-- Migration 009: Geschlecht-Feld + Gäste in Bestätigungsseite

-- Geschlecht-Spalte zur guests-Tabelle
ALTER TABLE guests ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('maennlich', 'weiblich'));

-- Kontaktperson-Spalten zur reservations-Tabelle
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS contact_gender TEXT CHECK (contact_gender IN ('maennlich', 'weiblich'));
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS contact_birth_date DATE;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS contact_dietary_notes TEXT;

-- Alte Funktionen droppen (Signatur hat sich geändert)
DROP FUNCTION IF EXISTS create_public_reservation(uuid, uuid, text, text, text, text, jsonb);
DROP FUNCTION IF EXISTS get_public_reservation_confirmation(uuid, text);
DROP FUNCTION IF EXISTS join_public_waitlist(uuid, uuid, text, text, text, text, integer);

-- RPC-Funktion aktualisieren, um gender zu speichern
CREATE OR REPLACE FUNCTION create_public_reservation(
  p_event_id UUID,
  p_house_type_id UUID,
  p_contact_first_name TEXT,
  p_contact_last_name TEXT,
  p_contact_email TEXT,
  p_contact_phone TEXT,
  p_contact_gender TEXT DEFAULT NULL,
  p_contact_birth_date TEXT DEFAULT NULL,
  p_contact_dietary_notes TEXT DEFAULT NULL,
  p_guests JSONB DEFAULT '[]'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_reservation_id UUID := gen_random_uuid();
  v_house_id UUID;
  v_house_type RECORD;
  v_event RECORD;
  v_payment_reference TEXT;
  v_expires_at TIMESTAMPTZ;
  v_confirmation_token TEXT;
BEGIN
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
    UPPER(split_part(v_reservation_id::TEXT, '-', 1));
  v_expires_at := now() + (COALESCE(v_event.reservation_validity_days, 14) || ' days')::INTERVAL;
  v_confirmation_token := encode(gen_random_bytes(16), 'hex');

  INSERT INTO reservations (
    id,
    event_id,
    house_id,
    contact_first_name,
    contact_last_name,
    contact_email,
    contact_phone,
    contact_gender,
    contact_birth_date,
    contact_dietary_notes,
    total_price,
    payment_reference,
    expires_at,
    confirmation_token_hash
  ) VALUES (
    v_reservation_id,
    p_event_id,
    v_house_id,
    p_contact_first_name,
    p_contact_last_name,
    p_contact_email,
    NULLIF(BTRIM(p_contact_phone), ''),
    NULLIF(BTRIM(p_contact_gender), ''),
    CASE
      WHEN p_contact_birth_date IS NOT NULL AND p_contact_birth_date <> ''
        THEN p_contact_birth_date::DATE
      ELSE NULL
    END,
    NULLIF(BTRIM(p_contact_dietary_notes), ''),
    v_house_type.price_per_house,
    v_payment_reference,
    v_expires_at,
    encode(digest(v_confirmation_token, 'sha256'), 'hex')
  );

  INSERT INTO guests (
    reservation_id, first_name, last_name, birth_date, is_child, gender, dietary_notes, sort_order
  )
  SELECT
    v_reservation_id,
    elem->>'first_name',
    elem->>'last_name',
    CASE
      WHEN elem->>'birth_date' IS NOT NULL AND elem->>'birth_date' <> ''
        THEN (elem->>'birth_date')::DATE
      ELSE NULL
    END,
    COALESCE((elem->>'is_child')::BOOLEAN, false),
    NULLIF(elem->>'gender', ''),
    NULLIF(elem->>'dietary_notes', ''),
    COALESCE((elem->>'sort_order')::INTEGER, 0)
  FROM jsonb_array_elements(p_guests) AS elem;

  RETURN jsonb_build_object(
    'id', v_reservation_id,
    'payment_reference', v_payment_reference,
    'expires_at', v_expires_at,
    'confirmation_token', v_confirmation_token
  );
END;
$$;

-- Erweiterte Bestätigungs-RPC: jetzt auch Kontakt-E-Mail, Telefon, Geschlecht + Gäste als JSON
CREATE OR REPLACE FUNCTION get_public_reservation_confirmation(
  p_reservation_id UUID,
  p_access_token TEXT
)
RETURNS TABLE (
  reservation_id UUID,
  contact_first_name TEXT,
  contact_last_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  contact_gender TEXT,
  total_price DECIMAL,
  expires_at TIMESTAMPTZ,
  payment_reference TEXT,
  status reservation_status,
  payment_status payment_status,
  house_label TEXT,
  house_number INTEGER,
  house_type_name TEXT,
  bank_account_holder TEXT,
  bank_iban TEXT,
  bank_bic TEXT,
  guests_json JSONB
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT
    r.id AS reservation_id,
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
    COALESCE(h.label, 'Haus ' || h.house_number::TEXT) AS house_label,
    h.house_number,
    ht.name AS house_type_name,
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
      '[]'::JSONB
    ) AS guests_json
  FROM reservations r
  JOIN houses h ON h.id = r.house_id
  JOIN house_types ht ON ht.id = h.house_type_id
  JOIN events e ON e.id = r.event_id
  WHERE p_access_token IS NOT NULL
    AND r.id = p_reservation_id
    AND r.confirmation_token_hash = encode(digest(p_access_token, 'sha256'), 'hex')
  LIMIT 1;
$$;

-- Warteliste: Gästedaten als JSON speichern + Geschlecht Kontaktperson
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS guests_json JSONB DEFAULT '[]'::JSONB;
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS contact_gender TEXT CHECK (contact_gender IN ('maennlich', 'weiblich'));

-- Waitlist-RPC aktualisieren um Gäste + Geschlecht zu speichern
CREATE OR REPLACE FUNCTION join_public_waitlist(
  p_event_id UUID,
  p_house_type_id UUID,
  p_contact_first_name TEXT,
  p_contact_last_name TEXT,
  p_contact_email TEXT,
  p_contact_phone TEXT,
  p_guest_count INTEGER,
  p_contact_gender TEXT DEFAULT NULL,
  p_guests JSONB DEFAULT '[]'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_event events%ROWTYPE;
  v_house_type house_types%ROWTYPE;
  v_next_position INTEGER;
  v_available_house_count INTEGER;
BEGIN
  SELECT *
  INTO v_event
  FROM events
  WHERE id = p_event_id
    AND is_active = true;

  IF v_event IS NULL THEN
    RETURN jsonb_build_object('error', 'Event nicht gefunden.');
  END IF;

  IF now() < v_event.registration_start OR now() > v_event.registration_end THEN
    RETURN jsonb_build_object('error', 'Die Anmeldung ist aktuell geschlossen.');
  END IF;

  SELECT *
  INTO v_house_type
  FROM house_types
  WHERE id = p_house_type_id
    AND event_id = p_event_id;

  IF v_house_type IS NULL THEN
    RETURN jsonb_build_object('error', 'Haustyp nicht gefunden.');
  END IF;

  SELECT COUNT(*)
  INTO v_available_house_count
  FROM houses h
  WHERE h.house_type_id = p_house_type_id
    AND h.is_available = true
    AND NOT EXISTS (
      SELECT 1
      FROM reservations r
      WHERE r.house_id = h.id
        AND r.status IN ('reserviert', 'bestaetigt')
    );

  IF v_available_house_count > 0 THEN
    RETURN jsonb_build_object(
      'error',
      'Es sind noch freie Unterkünfte verfügbar. Bitte reservieren Sie direkt.'
    );
  END IF;

  IF EXISTS (
    SELECT 1
    FROM waitlist w
    WHERE w.event_id = p_event_id
      AND w.house_type_id = p_house_type_id
      AND lower(w.contact_email) = lower(p_contact_email)
      AND w.status = 'wartend'
  ) THEN
    RETURN jsonb_build_object(
      'error',
      'Für diese E-Mail-Adresse besteht bereits ein offener Wartelisteneintrag.'
    );
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(p_house_type_id::TEXT));

  SELECT COALESCE(MAX(position), 0) + 1
  INTO v_next_position
  FROM waitlist
  WHERE house_type_id = p_house_type_id
    AND status = 'wartend';

  INSERT INTO waitlist (
    event_id,
    house_type_id,
    contact_first_name,
    contact_last_name,
    contact_email,
    contact_phone,
    contact_gender,
    guest_count,
    guests_json,
    position
  ) VALUES (
    p_event_id,
    p_house_type_id,
    p_contact_first_name,
    p_contact_last_name,
    lower(p_contact_email),
    NULLIF(BTRIM(p_contact_phone), ''),
    NULLIF(BTRIM(p_contact_gender), ''),
    p_guest_count,
    p_guests,
    v_next_position
  );

  RETURN jsonb_build_object(
    'position', v_next_position
  );
END;
$$;
