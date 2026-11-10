-- Migration 015: Feste Hauswahl (10.11.2026)
-- Im Supabase SQL-Editor ausführen.
--
--   1) Neue Funktion get_house_status: liefert je Haus, ob es frei ist (ohne Namen oder Daten der Gäste).
--      Damit zeigt der Lageplan freie und vergebene Häuser.
--   2) Buchungsfunktion create_public_reservation nimmt zusätzlich ein Wunschhaus an (p_house_id).
--      Ohne Wunsch bleibt alles wie bisher: Es wird das freie Haus mit der niedrigsten Nummer vergeben.
--      Ist das Wunschhaus inzwischen vergeben, wird nichts gebucht und die Seite bittet um eine neue Wahl.
--   3) Wohnungen im Gästehaus heißen einheitlich "Gästehaus G1" bis "Gästehaus G10".
--   4) Meldungen der Buchungsfunktion in der Anrede "ihr".
--
-- Bestehende Reservierungen bleiben unverändert.
-- Das Skript kann gefahrlos mehrfach ausgeführt werden.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) Belegung je Haus, öffentlich abrufbar
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_house_status(uuid);

CREATE FUNCTION public.get_house_status(p_event_id uuid)
RETURNS TABLE (
  house_id uuid,
  house_type_id uuid,
  house_number integer,
  label text,
  is_free boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    h.id,
    h.house_type_id,
    h.house_number,
    COALESCE(h.label, 'Haus ' || h.house_number::text),
    (
      h.is_available IS TRUE
      AND NOT EXISTS (
        SELECT 1 FROM reservations r
        WHERE r.house_id = h.id
          AND r.status IN ('reserviert', 'bestaetigt')
      )
    )
  FROM houses h
  JOIN house_types ht ON ht.id = h.house_type_id
  WHERE ht.event_id = p_event_id
  ORDER BY ht.sort_order, h.house_number;
$$;

REVOKE ALL ON FUNCTION public.get_house_status(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_house_status(uuid) TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2) Buchungsfunktion mit Wunschhaus
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.create_public_reservation(uuid, uuid, text, text, text, text, text, text, text, jsonb, integer, boolean);
DROP FUNCTION IF EXISTS public.create_public_reservation(uuid, uuid, text, text, text, text, text, text, text, jsonb, integer, boolean, uuid);

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
  p_rules_accepted boolean DEFAULT false,
  p_house_id uuid DEFAULT NULL
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
    RETURN jsonb_build_object('error', 'Bitte akzeptiert die Regeln der Gemeindefreizeit.');
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
    RETURN jsonb_build_object('error', 'Bitte tragt mindestens einen Gast ein.');
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

  IF p_house_id IS NOT NULL THEN
    -- Wunschhaus: zuerst sperren, dann prüfen. Eine zweite Anfrage für dasselbe Haus
    -- wartet an der Sperre und sieht danach die Reservierung der ersten.
    PERFORM 1 FROM houses h WHERE h.id = p_house_id FOR UPDATE;

    SELECT h.id INTO v_house_id
    FROM houses h
    WHERE h.id = p_house_id
      AND h.house_type_id = p_house_type_id
      AND h.is_available = true
      AND NOT EXISTS (
        SELECT 1 FROM reservations r
        WHERE r.house_id = h.id
          AND r.status IN ('reserviert', 'bestaetigt')
      );

    IF v_house_id IS NULL THEN
      RETURN jsonb_build_object(
        'error', 'Das gewählte Haus ist nicht mehr frei.',
        'code', 'house_taken'
      );
    END IF;
  ELSE
    -- Ohne Wunsch: das freie Haus mit der niedrigsten Nummer
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

REVOKE ALL ON FUNCTION public.create_public_reservation(uuid, uuid, text, text, text, text, text, text, text, jsonb, integer, boolean, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_public_reservation(uuid, uuid, text, text, text, text, text, text, text, jsonb, integer, boolean, uuid)
  TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3) Bezeichnungen im Gästehaus
-- ---------------------------------------------------------------------------
UPDATE houses h
SET label = 'Gästehaus G' || h.house_number
FROM house_types ht
WHERE ht.id = h.house_type_id
  AND ht.slug = 'gaestehaus-g1-10';

COMMIT;

-- Schnittstelle neu einlesen, damit die Webseite die neuen Funktionen sofort findet
NOTIFY pgrst, 'reload schema';

-- Kontrolle: alle Häuser mit Belegung
SELECT ht.name AS unterkunft, s.label AS haus, CASE WHEN s.is_free THEN 'frei' ELSE 'vergeben' END AS stand
FROM get_house_status((SELECT id FROM events WHERE is_active = true)) s
JOIN house_types ht ON ht.id = s.house_type_id
ORDER BY ht.sort_order, s.house_number;
