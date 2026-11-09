-- Migration 012: Livegang 2027
-- Im Supabase SQL-Editor ausführen, am besten vor dem zugehörigen Deployment.
-- Inhalt:
--   1) Alte, ungenutzte Funktionen entfernen und Warteliste nicht mehr öffentlich lesbar machen
--   2) Verfügbarkeit korrekt zählen (lief bisher ohne Rechte auf die Reservierungen)
--   3) Preise 2027 laut Preisliste des Feriendorfs vom 07.11.2026 (Preis A, 2 Nächte + Endreinigung, minus 5 %)
--   4) Kurtaxe 2027 (2,60 € ab 17 Jahren, 1,50 € von 6 bis 16 Jahren) und Zustellbetten (19 € pro Tag)
--      werden am Event gepflegt und serverseitig in den Gesamtbetrag gerechnet
--   5) Buchungs- und Bestätigungsfunktionen mit Preisaufteilung, Zustellbetten und Regelzustimmung
-- Bestehende Reservierungen behalten ihren Betrag (Preisaufteilung bleibt dort leer).

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) Sicherheit
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.create_reservation(uuid, uuid, text, text, text, text, numeric, jsonb);
DROP FUNCTION IF EXISTS public.expire_overdue_reservations();
DROP FUNCTION IF EXISTS public.get_next_available_house(uuid);

DROP POLICY IF EXISTS "Warteliste oeffentlich lesbar" ON public.waitlist;

-- ---------------------------------------------------------------------------
-- 2) Verfügbarkeit: zählt nur freigegebene Häuser ohne aktive Reservierung
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_availability(uuid);

CREATE FUNCTION public.get_availability(p_event_id uuid)
RETURNS TABLE (
  house_type_id uuid,
  house_type_name text,
  total_quantity integer,
  reserved_count bigint,
  available_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ht.id,
    ht.name,
    ht.total_quantity,
    COUNT(r.id) AS reserved_count,
    COUNT(h.id) FILTER (WHERE h.is_available IS TRUE AND r.id IS NULL) AS available_count
  FROM house_types ht
  LEFT JOIN houses h ON h.house_type_id = ht.id
  LEFT JOIN reservations r
    ON r.house_id = h.id
   AND r.status IN ('reserviert', 'bestaetigt')
  WHERE ht.event_id = p_event_id
  GROUP BY ht.id, ht.name, ht.total_quantity, ht.sort_order
  ORDER BY ht.sort_order;
$$;

GRANT EXECUTE ON FUNCTION public.get_availability(uuid) TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3) Tarife am Event, Preise 2027, Kontaktdaten
-- ---------------------------------------------------------------------------
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS tourist_tax_adult_rate numeric(10,2) NOT NULL DEFAULT 2.60 CHECK (tourist_tax_adult_rate >= 0),
  ADD COLUMN IF NOT EXISTS tourist_tax_child_rate numeric(10,2) NOT NULL DEFAULT 1.50 CHECK (tourist_tax_child_rate >= 0),
  ADD COLUMN IF NOT EXISTS tourist_tax_child_min_age integer NOT NULL DEFAULT 6 CHECK (tourist_tax_child_min_age >= 0),
  ADD COLUMN IF NOT EXISTS tourist_tax_adult_min_age integer NOT NULL DEFAULT 17 CHECK (tourist_tax_adult_min_age >= 0),
  ADD COLUMN IF NOT EXISTS extra_bed_price_per_day numeric(10,2) NOT NULL DEFAULT 19.00 CHECK (extra_bed_price_per_day >= 0),
  ADD COLUMN IF NOT EXISTS max_extra_beds integer NOT NULL DEFAULT 2 CHECK (max_extra_beds >= 0);

UPDATE public.house_types ht
SET price_per_house = v.price
FROM (VALUES
  ('ferienhaus-typ-ab',   341.53),
  ('ferienhaus-typ-c',    427.03),
  ('gaestehaus-g1-10',    313.03),
  ('gaestehaus-g11',      227.53),
  ('apartment-villa-ii',  227.53),
  ('villa-iii',           323.48)
) AS v(slug, price)
WHERE ht.slug = v.slug
  AND ht.event_id = (SELECT id FROM public.events WHERE slug = 'gemeindefreizeit-2027');

-- Platzhalter-Kontaktdaten aus der Erstanlage entfernen
UPDATE public.events
SET contact_email = 'kontakt@fecg-trossingen-gemeindefreizeit.de'
WHERE slug = 'gemeindefreizeit-2027'
  AND contact_email = 'freizeit@fecg-trossingen.de';

UPDATE public.events
SET contact_phone = NULL
WHERE slug = 'gemeindefreizeit-2027'
  AND contact_phone = '+49 7425 12345';

-- ---------------------------------------------------------------------------
-- 4) Preisaufteilung an der Reservierung
-- ---------------------------------------------------------------------------
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS accommodation_price numeric(10,2),
  ADD COLUMN IF NOT EXISTS tourist_tax numeric(10,2),
  ADD COLUMN IF NOT EXISTS extra_beds integer NOT NULL DEFAULT 0 CHECK (extra_beds >= 0),
  ADD COLUMN IF NOT EXISTS extra_bed_total numeric(10,2),
  ADD COLUMN IF NOT EXISTS pricing_nights integer,
  ADD COLUMN IF NOT EXISTS rules_accepted_at timestamptz;

-- Hauspreis und Zustellbetten werden beim Anlegen aus der Datenbank übernommen,
-- nie aus der Anwendung. Gilt auch für Übernahmen von der Warteliste.
CREATE OR REPLACE FUNCTION public.apply_reservation_pricing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_price numeric;
  v_start date;
  v_end date;
  v_bed_price numeric;
  v_max_beds integer;
BEGIN
  SELECT ht.price_per_house, e.start_date, e.end_date, e.extra_bed_price_per_day, e.max_extra_beds
    INTO v_price, v_start, v_end, v_bed_price, v_max_beds
  FROM houses h
  JOIN house_types ht ON ht.id = h.house_type_id
  JOIN events e ON e.id = ht.event_id
  WHERE h.id = NEW.house_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unterkunft nicht gefunden.';
  END IF;

  IF NEW.extra_beds > v_max_beds THEN
    RAISE EXCEPTION 'Höchstens % Zustellbetten möglich.', v_max_beds;
  END IF;

  NEW.pricing_nights := GREATEST(v_end - v_start, 1);
  NEW.accommodation_price := v_price;
  NEW.extra_bed_total := ROUND(NEW.extra_beds * v_bed_price * NEW.pricing_nights, 2);
  IF TG_OP = 'INSERT' THEN
    NEW.tourist_tax := 0;
  END IF;
  NEW.total_price := NEW.accommodation_price + NEW.extra_bed_total + COALESCE(NEW.tourist_tax, 0);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS apply_reservation_pricing ON public.reservations;
CREATE TRIGGER apply_reservation_pricing
  BEFORE INSERT OR UPDATE OF extra_beds, house_id ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.apply_reservation_pricing();

-- Kurtaxe aus den Gästen berechnen: Alter am Freizeitbeginn, ohne Geburtsdatum gilt der Erwachsenentarif.
CREATE OR REPLACE FUNCTION public.recalculate_reservation_tourist_tax(p_reservation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_accommodation numeric;
  v_extra_beds numeric;
  v_nights integer;
  v_start date;
  v_adult_rate numeric;
  v_child_rate numeric;
  v_child_min integer;
  v_adult_min integer;
  v_tax numeric;
BEGIN
  SELECT r.accommodation_price, COALESCE(r.extra_bed_total, 0), COALESCE(r.pricing_nights, 1),
         e.start_date, e.tourist_tax_adult_rate, e.tourist_tax_child_rate,
         e.tourist_tax_child_min_age, e.tourist_tax_adult_min_age
    INTO v_accommodation, v_extra_beds, v_nights, v_start, v_adult_rate, v_child_rate, v_child_min, v_adult_min
  FROM reservations r
  JOIN events e ON e.id = r.event_id
  WHERE r.id = p_reservation_id
  FOR UPDATE OF r;

  -- Reservierungen aus der Zeit vor dieser Migration bleiben unverändert
  IF NOT FOUND OR v_accommodation IS NULL THEN
    RETURN;
  END IF;

  SELECT COALESCE(SUM(
    CASE
      WHEN g.birth_date IS NULL
        OR EXTRACT(YEAR FROM age(v_start, g.birth_date))::integer >= v_adult_min THEN v_adult_rate
      WHEN EXTRACT(YEAR FROM age(v_start, g.birth_date))::integer >= v_child_min THEN v_child_rate
      ELSE 0
    END
  ), 0) * v_nights
  INTO v_tax
  FROM guests g
  WHERE g.reservation_id = p_reservation_id;

  v_tax := ROUND(v_tax, 2);

  UPDATE reservations
  SET tourist_tax = v_tax,
      total_price = v_accommodation + v_extra_beds + v_tax
  WHERE id = p_reservation_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.guests_recalculate_pricing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM recalculate_reservation_tourist_tax(OLD.reservation_id);
  ELSE
    PERFORM recalculate_reservation_tourist_tax(NEW.reservation_id);
    IF TG_OP = 'UPDATE' AND OLD.reservation_id IS DISTINCT FROM NEW.reservation_id THEN
      PERFORM recalculate_reservation_tourist_tax(OLD.reservation_id);
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS guests_recalculate_pricing ON public.guests;
CREATE TRIGGER guests_recalculate_pricing
  AFTER INSERT OR UPDATE OR DELETE ON public.guests
  FOR EACH ROW EXECUTE FUNCTION public.guests_recalculate_pricing();

REVOKE ALL ON FUNCTION public.apply_reservation_pricing() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.recalculate_reservation_tourist_tax(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.guests_recalculate_pricing() FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5) Öffentliche Buchungsfunktion mit Zustellbetten und Regelzustimmung
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.create_public_reservation(uuid, uuid, text, text, text, text, text, text, text, jsonb);

CREATE FUNCTION public.create_public_reservation(
  p_event_id uuid,
  p_house_type_id uuid,
  p_contact_first_name text,
  p_contact_last_name text,
  p_contact_email text,
  p_contact_phone text,
  p_contact_gender text DEFAULT NULL,
  p_contact_birth_date text DEFAULT NULL,
  p_contact_dietary_notes text DEFAULT NULL,
  p_guests jsonb DEFAULT '[]'::jsonb,
  p_extra_beds integer DEFAULT 0,
  p_rules_accepted boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_reservation_id uuid := gen_random_uuid();
  v_house_id uuid;
  v_house_type record;
  v_event record;
  v_guest_count integer;
  v_payment_reference text;
  v_expires_at timestamptz;
  v_confirmation_token text;
  v_total numeric;
BEGIN
  IF NOT COALESCE(p_rules_accepted, false) THEN
    RETURN jsonb_build_object('error', 'Bitte akzeptieren Sie die Regeln der Gemeindefreizeit.');
  END IF;

  SELECT * INTO v_event
  FROM events
  WHERE id = p_event_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Event nicht gefunden oder nicht aktiv.');
  END IF;

  IF now() < v_event.registration_start OR now() > v_event.registration_end THEN
    RETURN jsonb_build_object('error', 'Anmeldung ist aktuell nicht möglich.');
  END IF;

  SELECT * INTO v_house_type
  FROM house_types
  WHERE id = p_house_type_id AND event_id = p_event_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Unterkunftstyp nicht gefunden.');
  END IF;

  v_guest_count := jsonb_array_length(COALESCE(p_guests, '[]'::jsonb));

  IF v_guest_count < 1 THEN
    RETURN jsonb_build_object('error', 'Bitte tragen Sie mindestens einen Gast ein.');
  END IF;

  IF v_guest_count > v_house_type.max_guests + v_event.max_extra_beds THEN
    RETURN jsonb_build_object('error', 'Zu viele Gäste für diese Unterkunft.');
  END IF;

  IF COALESCE(p_extra_beds, 0) < 0 OR COALESCE(p_extra_beds, 0) > v_event.max_extra_beds THEN
    RETURN jsonb_build_object('error', format('Höchstens %s Zustellbetten möglich.', v_event.max_extra_beds));
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_guests) AS elem
    WHERE COALESCE(elem->>'birth_date', '') <> ''
      AND (elem->>'birth_date')::date > v_event.start_date
  ) THEN
    RETURN jsonb_build_object('error', 'Ein Geburtsdatum liegt nach dem Freizeitbeginn.');
  END IF;

  SELECT h.id INTO v_house_id
  FROM houses h
  WHERE h.house_type_id = p_house_type_id
    AND h.is_available = true
    AND NOT EXISTS (
      SELECT 1 FROM reservations r
      WHERE r.house_id = h.id
        AND r.status IN ('reserviert', 'bestaetigt')
    )
  ORDER BY h.house_number
  LIMIT 1
  FOR UPDATE OF h;

  IF v_house_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Kein Haus verfügbar.');
  END IF;

  v_payment_reference :=
    COALESCE(NULLIF(v_event.bank_reference_prefix, ''), 'GF') || '-' ||
    UPPER(split_part(v_reservation_id::text, '-', 1));
  v_expires_at := now() + (COALESCE(v_event.reservation_validity_days, 14) || ' days')::interval;
  v_confirmation_token := encode(gen_random_bytes(16), 'hex');

  INSERT INTO reservations (
    id, event_id, house_id,
    contact_first_name, contact_last_name, contact_email, contact_phone,
    contact_gender, contact_birth_date, contact_dietary_notes,
    total_price, extra_beds, rules_accepted_at,
    payment_reference, expires_at, confirmation_token_hash
  ) VALUES (
    v_reservation_id, p_event_id, v_house_id,
    BTRIM(p_contact_first_name), BTRIM(p_contact_last_name), BTRIM(p_contact_email),
    NULLIF(BTRIM(p_contact_phone), ''),
    NULLIF(BTRIM(p_contact_gender), ''),
    CASE WHEN COALESCE(p_contact_birth_date, '') <> '' THEN p_contact_birth_date::date ELSE NULL END,
    NULLIF(BTRIM(p_contact_dietary_notes), ''),
    v_house_type.price_per_house, COALESCE(p_extra_beds, 0), now(),
    v_payment_reference, v_expires_at,
    encode(digest(v_confirmation_token, 'sha256'), 'hex')
  );

  INSERT INTO guests (
    reservation_id, first_name, last_name, birth_date, is_child, gender, dietary_notes, sort_order
  )
  SELECT
    v_reservation_id,
    BTRIM(elem->>'first_name'),
    BTRIM(elem->>'last_name'),
    CASE WHEN COALESCE(elem->>'birth_date', '') <> '' THEN (elem->>'birth_date')::date ELSE NULL END,
    COALESCE((elem->>'is_child')::boolean, false),
    NULLIF(elem->>'gender', ''),
    NULLIF(elem->>'dietary_notes', ''),
    COALESCE((elem->>'sort_order')::integer, 0)
  FROM jsonb_array_elements(p_guests) AS elem;

  SELECT total_price INTO v_total FROM reservations WHERE id = v_reservation_id;

  RETURN jsonb_build_object(
    'id', v_reservation_id,
    'payment_reference', v_payment_reference,
    'expires_at', v_expires_at,
    'confirmation_token', v_confirmation_token,
    'total_price', v_total
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_public_reservation(uuid, uuid, text, text, text, text, text, text, text, jsonb, integer, boolean)
  TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 6) Bestätigungsseite: Preisaufteilung mitliefern
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_public_reservation_confirmation(uuid, text);

CREATE FUNCTION public.get_public_reservation_confirmation(
  p_reservation_id uuid,
  p_access_token text
)
RETURNS TABLE (
  reservation_id uuid,
  contact_first_name text,
  contact_last_name text,
  contact_email text,
  contact_phone text,
  contact_gender text,
  total_price numeric,
  expires_at timestamptz,
  payment_reference text,
  status reservation_status,
  payment_status payment_status,
  house_label text,
  house_number integer,
  house_type_name text,
  bank_account_holder text,
  bank_iban text,
  bank_bic text,
  guests_json jsonb,
  accommodation_price numeric,
  tourist_tax numeric,
  extra_beds integer,
  extra_bed_total numeric,
  pricing_nights integer
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT
    r.id,
    r.contact_first_name,
    r.contact_last_name,
    r.contact_email,
    r.contact_phone,
    r.contact_gender,
    r.total_price,
    r.expires_at,
    r.payment_reference,
    r.status,
    r.payment_status,
    COALESCE(h.label, 'Haus ' || h.house_number::text),
    h.house_number,
    ht.name,
    e.bank_account_holder,
    e.bank_iban,
    e.bank_bic,
    COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'first_name', g.first_name,
          'last_name', g.last_name,
          'birth_date', g.birth_date,
          'is_child', g.is_child,
          'gender', g.gender,
          'dietary_notes', g.dietary_notes
        ) ORDER BY g.sort_order
      ) FROM guests g WHERE g.reservation_id = r.id),
      '[]'::jsonb
    ),
    r.accommodation_price,
    r.tourist_tax,
    r.extra_beds,
    r.extra_bed_total,
    r.pricing_nights
  FROM reservations r
  JOIN houses h ON h.id = r.house_id
  JOIN house_types ht ON ht.id = h.house_type_id
  JOIN events e ON e.id = r.event_id
  WHERE p_access_token IS NOT NULL
    AND r.id = p_reservation_id
    AND r.confirmation_token_hash = encode(digest(p_access_token, 'sha256'), 'hex')
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_reservation_confirmation(uuid, text)
  TO anon, authenticated, service_role;

COMMIT;
