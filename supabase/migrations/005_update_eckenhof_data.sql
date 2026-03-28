-- Migration 005: Echte Daten vom Feriendorf Eckenhof Schramberg einpflegen
-- Dieses Script aktualisiert das bestehende Event und ersetzt die Platzhalter-Haustypen.

-- 1) Event-Daten aktualisieren
UPDATE events
SET
  location = 'Feriendorf Eckenhof Schramberg',
  location_address = 'Dr. Helmut-Junghans-Strasse 50, 78713 Schramberg-Sulgen',
  location_url = 'https://maps.google.com/?q=Dr.+Helmut-Junghans-Strasse+50,+78713+Schramberg-Sulgen',
  description = 'Herzlich willkommen zur Gemeindefreizeit 2026 der FECG Trossingen e.V.! Wir verbringen eine gemeinsame Woche im autofreien Feriendorf Eckenhof im Schwarzwald — mit Gottesdiensten, Gemeinschaft, Wanderungen und vielem mehr.'
WHERE slug = 'gemeindefreizeit-2026';

-- 2) Alte Haeuser und Haustypen loeschen (Kaskade: houses -> house_types)
DELETE FROM houses
WHERE house_type_id IN (
  SELECT id FROM house_types
  WHERE event_id = (SELECT id FROM events WHERE slug = 'gemeindefreizeit-2026')
);

DELETE FROM house_types
WHERE event_id = (SELECT id FROM events WHERE slug = 'gemeindefreizeit-2026');

-- 3) Neue Haustypen einfuegen (Preise = Gesamtpreis fuer 7 Naechte)
INSERT INTO house_types (event_id, name, slug, description, max_guests, price_per_house, total_quantity, features, sort_order)
SELECT e.id, 'Ferienhaus Typ A+B', 'ferienhaus-typ-ab',
  'Geraeumiges Ferienhaus fuer Familien mit bis zu 6 Personen. Drei Schlafzimmer, Kueche, Bad mit Dusche und Terrasse.',
  6, 959.00, 22,
  '["3 Schlafzimmer", "Kueche", "Bad mit Dusche", "Terrasse", "WLAN", "Kaffeemaschine", "Kuehlschrank", "Bettwaesche inkl.", "Kinderbett verfuegbar"]'::JSONB, 1
FROM events e WHERE e.slug = 'gemeindefreizeit-2026';

INSERT INTO house_types (event_id, name, slug, description, max_guests, price_per_house, total_quantity, features, sort_order)
SELECT e.id, 'Ferienhaus Typ C (10 Pers.)', 'ferienhaus-typ-c-10',
  'Grosses Ferienhaus fuer Gruppen mit bis zu 10 Personen. Drei Schlafzimmer, Kueche mit Backofen und Spuelmaschine.',
  10, 1225.00, 2,
  '["3 Schlafzimmer", "Kueche mit Backofen", "Spuelmaschine", "Bad mit Dusche", "Terrasse", "WLAN", "Kaffeemaschine", "Kuehlschrank", "Bettwaesche inkl."]'::JSONB, 2
FROM events e WHERE e.slug = 'gemeindefreizeit-2026';

INSERT INTO house_types (event_id, name, slug, description, max_guests, price_per_house, total_quantity, features, sort_order)
SELECT e.id, 'Ferienhaus Typ C (8 Pers.)', 'ferienhaus-typ-c-8',
  'Grosses Ferienhaus fuer Gruppen mit bis zu 8 Personen. Drei Schlafzimmer, Kueche mit Backofen und Spuelmaschine.',
  8, 1155.00, 1,
  '["3 Schlafzimmer", "Kueche mit Backofen", "Spuelmaschine", "Bad mit Dusche", "Terrasse", "WLAN", "Kaffeemaschine", "Kuehlschrank", "Bettwaesche inkl."]'::JSONB, 3
FROM events e WHERE e.slug = 'gemeindefreizeit-2026';

INSERT INTO house_types (event_id, name, slug, description, max_guests, price_per_house, total_quantity, features, sort_order)
SELECT e.id, 'Gaestehaus G1-10', 'gaestehaus-g1-10',
  'Gaestehaus mit 2 Zimmern (2-Bett + 3-Bett) und 2 Baedern. Ideal fuer Familien oder kleine Gruppen.',
  5, 850.50, 10,
  '["2 Zimmer", "2 Baeder", "Kueche", "WLAN", "Kaffeemaschine", "Kuehlschrank", "Bettwaesche inkl.", "Kinderbett verfuegbar"]'::JSONB, 4
FROM events e WHERE e.slug = 'gemeindefreizeit-2026';

INSERT INTO house_types (event_id, name, slug, description, max_guests, price_per_house, total_quantity, features, sort_order)
SELECT e.id, 'Gaestehaus G11 + Apartment', 'gaestehaus-g11',
  'Einzelnes Gaestehaus mit 4-Bett-Zimmer und eigenem Bad. Kompakt und gemuetlich.',
  4, 672.00, 1,
  '["1 Zimmer", "1 Bad", "Kueche", "WLAN", "Kaffeemaschine", "Kuehlschrank", "Bettwaesche inkl."]'::JSONB, 5
FROM events e WHERE e.slug = 'gemeindefreizeit-2026';

INSERT INTO house_types (event_id, name, slug, description, max_guests, price_per_house, total_quantity, features, sort_order)
SELECT e.id, 'Villa I (3 Pers.)', 'villa-i',
  'Kompakte Villa fuer bis zu 3 Personen. Ein Zimmer mit eigenem Bad, ohne Balkon.',
  3, 546.00, 1,
  '["1 Zimmer", "Eigenes Bad", "Kueche", "WLAN", "Kaffeemaschine", "Kuehlschrank", "Bettwaesche inkl."]'::JSONB, 6
FROM events e WHERE e.slug = 'gemeindefreizeit-2026';

INSERT INTO house_types (event_id, name, slug, description, max_guests, price_per_house, total_quantity, features, sort_order)
SELECT e.id, 'Villa II (4 Pers.)', 'villa-ii',
  'Villa fuer bis zu 4 Personen. Zwei Zimmer mit eigenem Bad, ohne Balkon.',
  4, 672.00, 1,
  '["2 Zimmer", "Eigenes Bad", "Kueche", "WLAN", "Kaffeemaschine", "Kuehlschrank", "Bettwaesche inkl."]'::JSONB, 7
FROM events e WHERE e.slug = 'gemeindefreizeit-2026';

INSERT INTO house_types (event_id, name, slug, description, max_guests, price_per_house, total_quantity, features, sort_order)
SELECT e.id, 'Villa III (6 Pers.)', 'villa-iii',
  'Groessere Villa fuer bis zu 6 Personen. Drei Zimmer mit eigenem Bad, ohne Balkon.',
  6, 892.50, 1,
  '["3 Zimmer", "Eigenes Bad", "Kueche", "WLAN", "Kaffeemaschine", "Kuehlschrank", "Bettwaesche inkl."]'::JSONB, 8
FROM events e WHERE e.slug = 'gemeindefreizeit-2026';

INSERT INTO house_types (event_id, name, slug, description, max_guests, price_per_house, total_quantity, features, sort_order)
SELECT e.id, 'Wohnung (2 Pers.)', 'wohnung',
  'Kleine Wohnung fuer 2 Personen. Ein Zimmer mit eigenem Bad — ideal fuer Paare oder Einzelpersonen.',
  2, 451.50, 1,
  '["1 Zimmer", "Eigenes Bad", "Kueche", "WLAN", "Kaffeemaschine", "Kuehlschrank", "Bettwaesche inkl."]'::JSONB, 9
FROM events e WHERE e.slug = 'gemeindefreizeit-2026';

-- 4) Haeuser erstellen

-- Ferienhaus Typ A+B: 22 Haeuser
INSERT INTO houses (house_type_id, house_number, label)
SELECT ht.id, gs.n, 'Haus ' || gs.n
FROM house_types ht, generate_series(1, 22) AS gs(n)
WHERE ht.slug = 'ferienhaus-typ-ab';

-- Ferienhaus Typ C (10 Pers.): 2 Haeuser
INSERT INTO houses (house_type_id, house_number, label)
SELECT ht.id, gs.n, 'Haus C' || gs.n
FROM house_types ht, generate_series(1, 2) AS gs(n)
WHERE ht.slug = 'ferienhaus-typ-c-10';

-- Ferienhaus Typ C (8 Pers.): 1 Haus
INSERT INTO houses (house_type_id, house_number, label)
SELECT ht.id, 1, 'Haus C3'
FROM house_types ht
WHERE ht.slug = 'ferienhaus-typ-c-8';

-- Gaestehaus G1-10: 10 Einheiten
INSERT INTO houses (house_type_id, house_number, label)
SELECT ht.id, gs.n, 'Gaestehaus G' || gs.n
FROM house_types ht, generate_series(1, 10) AS gs(n)
WHERE ht.slug = 'gaestehaus-g1-10';

-- Gaestehaus G11: 1 Einheit
INSERT INTO houses (house_type_id, house_number, label)
SELECT ht.id, 1, 'Gaestehaus G11'
FROM house_types ht
WHERE ht.slug = 'gaestehaus-g11';

-- Villa I: 1 Einheit
INSERT INTO houses (house_type_id, house_number, label)
SELECT ht.id, 1, 'Villa I'
FROM house_types ht
WHERE ht.slug = 'villa-i';

-- Villa II: 1 Einheit
INSERT INTO houses (house_type_id, house_number, label)
SELECT ht.id, 1, 'Villa II'
FROM house_types ht
WHERE ht.slug = 'villa-ii';

-- Villa III: 1 Einheit
INSERT INTO houses (house_type_id, house_number, label)
SELECT ht.id, 1, 'Villa III'
FROM house_types ht
WHERE ht.slug = 'villa-iii';

-- Wohnung: 1 Einheit
INSERT INTO houses (house_type_id, house_number, label)
SELECT ht.id, 1, 'Wohnung'
FROM house_types ht
WHERE ht.slug = 'wohnung';
