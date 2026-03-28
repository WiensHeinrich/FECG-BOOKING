-- Admin-User in Supabase Auth anlegen
-- WICHTIG: Nach dem Ausfuehren in Supabase Dashboard -> Authentication -> Users
-- den User dort anlegen (oder ueber die API).

-- Schritt 1: Zuerst in Supabase Dashboard -> Authentication -> Users -> "Add User"
--   E-Mail: admin@fecg-trossingen.de (oder deine eigene E-Mail)
--   Passwort: Ein sicheres Passwort waehlen
--   "Auto Confirm User" aktivieren

-- Schritt 2: Dann die auth_user_id in admin_users eintragen.
-- Die UUID findest du in Authentication -> Users nach dem Anlegen.
-- Ersetze die UUID unten mit der echten UUID:

-- INSERT INTO admin_users (auth_user_id, email, display_name)
-- VALUES ('HIER-DIE-UUID-EINTRAGEN', 'admin@fecg-trossingen.de', 'Heinrich');
