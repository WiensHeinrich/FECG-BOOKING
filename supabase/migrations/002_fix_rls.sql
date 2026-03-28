-- Fix: Endlosrekursion in RLS-Policies beheben
-- Problem: admin_users Policy referenziert admin_users -> Endlosschleife

-- 1. SECURITY DEFINER Funktion fuer Admin-Check (umgeht RLS)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users
    WHERE auth_user_id = auth.uid()
      AND is_active = true
  );
$$;

-- 2. Alle problematischen Policies droppen und neu erstellen

-- Events
DROP POLICY IF EXISTS "Events von Admins verwaltbar" ON events;
CREATE POLICY "Events von Admins verwaltbar" ON events FOR ALL
  USING (is_admin());

-- House Types
DROP POLICY IF EXISTS "Haustypen von Admins verwaltbar" ON house_types;
CREATE POLICY "Haustypen von Admins verwaltbar" ON house_types FOR ALL
  USING (is_admin());

-- Houses
DROP POLICY IF EXISTS "Haeuser von Admins verwaltbar" ON houses;
CREATE POLICY "Haeuser von Admins verwaltbar" ON houses FOR ALL
  USING (is_admin());

-- Reservations
DROP POLICY IF EXISTS "Admins verwalten Reservierungen" ON reservations;
CREATE POLICY "Admins verwalten Reservierungen" ON reservations FOR ALL
  USING (is_admin());

-- Guests
DROP POLICY IF EXISTS "Admins verwalten Gaeste" ON guests;
CREATE POLICY "Admins verwalten Gaeste" ON guests FOR ALL
  USING (is_admin());

-- Waitlist
DROP POLICY IF EXISTS "Admins verwalten Warteliste" ON waitlist;
CREATE POLICY "Admins verwalten Warteliste" ON waitlist FOR ALL
  USING (is_admin());

-- Documents
DROP POLICY IF EXISTS "Admins verwalten Dokumente" ON documents;
CREATE POLICY "Admins verwalten Dokumente" ON documents FOR ALL
  USING (is_admin());

-- Admin Users - eigene Policy ohne Selbstreferenz
DROP POLICY IF EXISTS "Admins lesen Admin-Liste" ON admin_users;
CREATE POLICY "Admins lesen eigenen Eintrag" ON admin_users FOR SELECT
  USING (auth_user_id = auth.uid());
