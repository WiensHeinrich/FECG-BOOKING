-- FECG Trossingen e.V. - Gemeindefreizeit Buchungssystem
-- Komplettes Datenbankschema

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE reservation_status AS ENUM (
  'reserviert',
  'bestaetigt',
  'storniert',
  'abgelaufen'
);

CREATE TYPE payment_status AS ENUM (
  'ausstehend',
  'eingegangen',
  'erstattet'
);

CREATE TYPE waitlist_status AS ENUM (
  'wartend',
  'benachrichtigt',
  'abgelaufen',
  'umgewandelt'
);

-- ============================================
-- EVENTS (Wiederverwendbar fuer jede Freizeit)
-- ============================================

CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  location_address TEXT,
  location_url TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  registration_start TIMESTAMPTZ NOT NULL,
  registration_end TIMESTAMPTZ NOT NULL,
  reservation_validity_days INTEGER DEFAULT 14,
  bank_account_holder TEXT NOT NULL,
  bank_iban TEXT NOT NULL,
  bank_bic TEXT,
  bank_reference_prefix TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  is_active BOOLEAN DEFAULT false,
  hero_image_url TEXT,
  additional_info JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_events_active ON events (is_active) WHERE is_active = true;

-- ============================================
-- HOUSE TYPES (Verschiedene Haustypen)
-- ============================================

CREATE TABLE house_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  max_guests INTEGER NOT NULL,
  price_per_house DECIMAL(10,2) NOT NULL,
  price_per_person DECIMAL(10,2),
  total_quantity INTEGER NOT NULL,
  features JSONB DEFAULT '[]',
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, slug)
);

-- ============================================
-- HOUSES (Einzelne Haeuser mit Nummern)
-- ============================================

CREATE TABLE houses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  house_type_id UUID NOT NULL REFERENCES house_types(id) ON DELETE CASCADE,
  house_number INTEGER NOT NULL,
  label TEXT,
  notes TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(house_type_id, house_number)
);

-- ============================================
-- RESERVATIONS
-- ============================================

CREATE TABLE reservations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id),
  house_id UUID NOT NULL REFERENCES houses(id),
  contact_first_name TEXT NOT NULL,
  contact_last_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  status reservation_status DEFAULT 'reserviert' NOT NULL,
  payment_status payment_status DEFAULT 'ausstehend' NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  payment_reference TEXT NOT NULL,
  reserved_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  payment_confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  admin_notes TEXT,
  confirmed_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Nur eine aktive Reservierung pro Haus
CREATE UNIQUE INDEX idx_one_active_reservation_per_house
  ON reservations (house_id)
  WHERE status IN ('reserviert', 'bestaetigt');

CREATE INDEX idx_reservations_status ON reservations (status);
CREATE INDEX idx_reservations_expires ON reservations (expires_at) WHERE status = 'reserviert';
CREATE INDEX idx_reservations_event ON reservations (event_id);
CREATE INDEX idx_reservations_email ON reservations (contact_email);

-- ============================================
-- GUESTS (Gaeste pro Reservierung)
-- ============================================

CREATE TABLE guests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  birth_date DATE,
  is_child BOOLEAN DEFAULT false,
  dietary_notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_guests_reservation ON guests (reservation_id);

-- ============================================
-- WAITLIST (Warteliste)
-- ============================================

CREATE TABLE waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id),
  house_type_id UUID NOT NULL REFERENCES house_types(id),
  contact_first_name TEXT NOT NULL,
  contact_last_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  guest_count INTEGER NOT NULL DEFAULT 1,
  status waitlist_status DEFAULT 'wartend' NOT NULL,
  position INTEGER NOT NULL,
  notified_at TIMESTAMPTZ,
  notification_expires_at TIMESTAMPTZ,
  converted_reservation_id UUID REFERENCES reservations(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_waitlist_type_status ON waitlist (house_type_id, status, position);

-- ============================================
-- DOCUMENTS (PDFs fuer Info-Seite)
-- ============================================

CREATE TABLE documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_size_bytes INTEGER,
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ADMIN USERS
-- ============================================

CREATE TABLE admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_user_id UUID UNIQUE NOT NULL,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT DEFAULT 'admin' NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Verfuegbarkeit pro Haustyp abfragen
CREATE OR REPLACE FUNCTION get_availability(p_event_id UUID)
RETURNS TABLE (
  house_type_id UUID,
  house_type_name TEXT,
  total_quantity INTEGER,
  reserved_count BIGINT,
  available_count BIGINT
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    ht.id AS house_type_id,
    ht.name AS house_type_name,
    ht.total_quantity,
    COUNT(r.id) AS reserved_count,
    (ht.total_quantity - COUNT(r.id))::BIGINT AS available_count
  FROM house_types ht
  LEFT JOIN houses h ON h.house_type_id = ht.id AND h.is_available = true
  LEFT JOIN reservations r ON r.house_id = h.id
    AND r.status IN ('reserviert', 'bestaetigt')
  WHERE ht.event_id = p_event_id
  GROUP BY ht.id, ht.name, ht.total_quantity
  ORDER BY ht.sort_order;
$$;

-- Naechstes freies Haus eines Typs finden
CREATE OR REPLACE FUNCTION get_next_available_house(p_house_type_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT h.id
  FROM houses h
  WHERE h.house_type_id = p_house_type_id
    AND h.is_available = true
    AND NOT EXISTS (
      SELECT 1 FROM reservations r
      WHERE r.house_id = h.id
        AND r.status IN ('reserviert', 'bestaetigt')
    )
  ORDER BY h.house_number
  LIMIT 1;
$$;

-- Reservierung atomar erstellen
CREATE OR REPLACE FUNCTION create_reservation(
  p_event_id UUID,
  p_house_type_id UUID,
  p_contact_first_name TEXT,
  p_contact_last_name TEXT,
  p_contact_email TEXT,
  p_contact_phone TEXT,
  p_total_price DECIMAL,
  p_guests JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_house_id UUID;
  v_reservation_id UUID;
  v_payment_reference TEXT;
  v_expires_at TIMESTAMPTZ;
  v_validity_days INTEGER;
  v_guest JSONB;
BEGIN
  -- Validity aus Event holen
  SELECT reservation_validity_days INTO v_validity_days
  FROM events WHERE id = p_event_id;

  -- Naechstes freies Haus mit Lock finden
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
    RETURN jsonb_build_object('error', 'Kein Haus verfuegbar');
  END IF;

  -- Zahlungsreferenz generieren
  SELECT COALESCE(e.bank_reference_prefix, 'GF') || '-' ||
    LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0')
  INTO v_payment_reference
  FROM events e WHERE e.id = p_event_id;

  v_expires_at := now() + (v_validity_days || ' days')::INTERVAL;

  -- Reservierung erstellen
  INSERT INTO reservations (
    event_id, house_id, contact_first_name, contact_last_name,
    contact_email, contact_phone, total_price, payment_reference, expires_at
  ) VALUES (
    p_event_id, v_house_id, p_contact_first_name, p_contact_last_name,
    p_contact_email, p_contact_phone, p_total_price, v_payment_reference, v_expires_at
  ) RETURNING id INTO v_reservation_id;

  -- Gaeste eintragen
  FOR v_guest IN SELECT * FROM jsonb_array_elements(p_guests)
  LOOP
    INSERT INTO guests (reservation_id, first_name, last_name, birth_date, is_child, dietary_notes, sort_order)
    VALUES (
      v_reservation_id,
      v_guest->>'first_name',
      v_guest->>'last_name',
      CASE WHEN v_guest->>'birth_date' IS NOT NULL AND v_guest->>'birth_date' != ''
        THEN (v_guest->>'birth_date')::DATE ELSE NULL END,
      COALESCE((v_guest->>'is_child')::BOOLEAN, false),
      v_guest->>'dietary_notes',
      COALESCE((v_guest->>'sort_order')::INTEGER, 0)
    );
  END LOOP;

  RETURN jsonb_build_object(
    'id', v_reservation_id,
    'house_id', v_house_id,
    'payment_reference', v_payment_reference,
    'expires_at', v_expires_at
  );
END;
$$;

-- Abgelaufene Reservierungen ablaufen lassen
CREATE OR REPLACE FUNCTION expire_overdue_reservations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE reservations
  SET status = 'abgelaufen', updated_at = now()
  WHERE status = 'reserviert'
    AND expires_at < now();

  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Events oeffentlich lesbar" ON events FOR SELECT USING (true);
CREATE POLICY "Events von Admins verwaltbar" ON events FOR ALL
  USING (auth.uid() IN (SELECT auth_user_id FROM admin_users WHERE is_active = true));

ALTER TABLE house_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Haustypen oeffentlich lesbar" ON house_types FOR SELECT USING (true);
CREATE POLICY "Haustypen von Admins verwaltbar" ON house_types FOR ALL
  USING (auth.uid() IN (SELECT auth_user_id FROM admin_users WHERE is_active = true));

ALTER TABLE houses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Haeuser oeffentlich lesbar" ON houses FOR SELECT USING (true);
CREATE POLICY "Haeuser von Admins verwaltbar" ON houses FOR ALL
  USING (auth.uid() IN (SELECT auth_user_id FROM admin_users WHERE is_active = true));

ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins verwalten Reservierungen" ON reservations FOR ALL
  USING (auth.uid() IN (SELECT auth_user_id FROM admin_users WHERE is_active = true));

ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins verwalten Gaeste" ON guests FOR ALL
  USING (auth.uid() IN (SELECT auth_user_id FROM admin_users WHERE is_active = true));

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Warteliste oeffentlich lesbar" ON waitlist FOR SELECT USING (true);
CREATE POLICY "Admins verwalten Warteliste" ON waitlist FOR ALL
  USING (auth.uid() IN (SELECT auth_user_id FROM admin_users WHERE is_active = true));

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Dokumente oeffentlich lesbar" ON documents FOR SELECT USING (is_published = true);
CREATE POLICY "Admins verwalten Dokumente" ON documents FOR ALL
  USING (auth.uid() IN (SELECT auth_user_id FROM admin_users WHERE is_active = true));

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins lesen Admin-Liste" ON admin_users FOR SELECT
  USING (auth.uid() IN (SELECT auth_user_id FROM admin_users WHERE is_active = true));
