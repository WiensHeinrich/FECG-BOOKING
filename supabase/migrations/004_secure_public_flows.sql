-- Sichere Public-Flows fuer Reservierung, Warteliste und Bestaetigungsseite

ALTER TABLE reservations
ADD COLUMN IF NOT EXISTS confirmation_token_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_reservations_confirmation_token_hash
  ON reservations (confirmation_token_hash)
  WHERE confirmation_token_hash IS NOT NULL;

CREATE OR REPLACE FUNCTION create_public_reservation(
  p_event_id UUID,
  p_house_type_id UUID,
  p_contact_first_name TEXT,
  p_contact_last_name TEXT,
  p_contact_email TEXT,
  p_contact_phone TEXT,
  p_guests JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_event events%ROWTYPE;
  v_house_type house_types%ROWTYPE;
  v_house_id UUID;
  v_reservation_id UUID := gen_random_uuid();
  v_payment_reference TEXT;
  v_expires_at TIMESTAMPTZ;
  v_guest JSONB;
  v_guest_count INTEGER;
  v_confirmation_token TEXT;
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

  IF p_guests IS NULL OR jsonb_typeof(p_guests) <> 'array' THEN
    RETURN jsonb_build_object('error', 'Ungueltige Gastdaten.');
  END IF;

  v_guest_count := jsonb_array_length(p_guests);

  IF v_guest_count < 1 THEN
    RETURN jsonb_build_object('error', 'Mindestens ein Gast ist erforderlich.');
  END IF;

  IF v_guest_count > v_house_type.max_guests THEN
    RETURN jsonb_build_object(
      'error',
      format('Dieser Unterkunftstyp erlaubt maximal %s Gaeste.', v_house_type.max_guests)
    );
  END IF;

  SELECT h.id
  INTO v_house_id
  FROM houses h
  WHERE h.house_type_id = p_house_type_id
    AND h.is_available = true
    AND NOT EXISTS (
      SELECT 1
      FROM reservations r
      WHERE r.house_id = h.id
        AND r.status IN ('reserviert', 'bestaetigt')
    )
  ORDER BY h.house_number
  LIMIT 1
  FOR UPDATE OF h;

  IF v_house_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Kein Haus verfuegbar.');
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
    v_house_type.price_per_house,
    v_payment_reference,
    v_expires_at,
    encode(digest(v_confirmation_token, 'sha256'), 'hex')
  );

  FOR v_guest IN SELECT * FROM jsonb_array_elements(p_guests)
  LOOP
    INSERT INTO guests (
      reservation_id,
      first_name,
      last_name,
      birth_date,
      is_child,
      dietary_notes,
      sort_order
    ) VALUES (
      v_reservation_id,
      v_guest->>'first_name',
      v_guest->>'last_name',
      CASE
        WHEN v_guest->>'birth_date' IS NOT NULL AND v_guest->>'birth_date' <> ''
          THEN (v_guest->>'birth_date')::DATE
        ELSE NULL
      END,
      COALESCE((v_guest->>'is_child')::BOOLEAN, false),
      NULLIF(v_guest->>'dietary_notes', ''),
      COALESCE((v_guest->>'sort_order')::INTEGER, 0)
    );
  END LOOP;

  RETURN jsonb_build_object(
    'id', v_reservation_id,
    'payment_reference', v_payment_reference,
    'expires_at', v_expires_at,
    'confirmation_token', v_confirmation_token
  );
END;
$$;

CREATE OR REPLACE FUNCTION join_public_waitlist(
  p_event_id UUID,
  p_house_type_id UUID,
  p_contact_first_name TEXT,
  p_contact_last_name TEXT,
  p_contact_email TEXT,
  p_contact_phone TEXT,
  p_guest_count INTEGER
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

  IF p_guest_count < 1 OR p_guest_count > v_house_type.max_guests THEN
    RETURN jsonb_build_object(
      'error',
      format('Bitte waehlen Sie zwischen 1 und %s Gaesten.', v_house_type.max_guests)
    );
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
      'Es sind noch freie Unterkuenfte verfuegbar. Bitte reservieren Sie direkt.'
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
      'Fuer diese E-Mail-Adresse besteht bereits ein offener Wartelisteneintrag.'
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
    guest_count,
    position
  ) VALUES (
    p_event_id,
    p_house_type_id,
    p_contact_first_name,
    p_contact_last_name,
    lower(p_contact_email),
    NULLIF(BTRIM(p_contact_phone), ''),
    p_guest_count,
    v_next_position
  );

  RETURN jsonb_build_object(
    'position', v_next_position
  );
END;
$$;

CREATE OR REPLACE FUNCTION get_public_reservation_confirmation(
  p_reservation_id UUID,
  p_access_token TEXT
)
RETURNS TABLE (
  reservation_id UUID,
  contact_first_name TEXT,
  contact_last_name TEXT,
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
  bank_bic TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT
    r.id AS reservation_id,
    r.contact_first_name,
    r.contact_last_name,
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
    e.bank_bic
  FROM reservations r
  JOIN houses h ON h.id = r.house_id
  JOIN house_types ht ON ht.id = h.house_type_id
  JOIN events e ON e.id = r.event_id
  WHERE p_access_token IS NOT NULL
    AND r.id = p_reservation_id
    AND r.confirmation_token_hash = encode(digest(p_access_token, 'sha256'), 'hex')
  LIMIT 1;
$$;
