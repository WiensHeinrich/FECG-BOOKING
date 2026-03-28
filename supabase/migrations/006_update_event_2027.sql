-- Migration 006: Event auf Gemeindefreizeit 2027 aktualisieren
-- Preise: Gesamtpreis für 2 Nächte + Endreinigung, mit 5% Gruppenrabatt

-- 1) Event aktualisieren
UPDATE events
SET
  title = 'Gemeindefreizeit 2027',
  slug = 'gemeindefreizeit-2027',
  description = 'Gemeinsam. Glauben. Erleben. — Wir verbringen ein Wochenende im autofreien Feriendorf Eckenhof im Schwarzwald. Mit Gottesdiensten, Gemeinschaft, Wanderungen, Lagerfeuer und vielem mehr. „Wo zwei oder drei versammelt sind in meinem Namen, da bin ich mitten unter ihnen." (Matthäus 18:20)',
  start_date = '2027-06-11',
  end_date = '2027-06-13',
  registration_start = '2027-03-01T00:00:00Z',
  registration_end = '2027-06-01T23:59:59Z',
  bank_reference_prefix = 'GF2027'
WHERE slug = 'gemeindefreizeit-2026';

-- 2) Alte Häuser und Haustypen löschen
DELETE FROM houses
WHERE house_type_id IN (
  SELECT id FROM house_types
  WHERE event_id = (SELECT id FROM events WHERE slug = 'gemeindefreizeit-2027')
);

DELETE FROM house_types
WHERE event_id = (SELECT id FROM events WHERE slug = 'gemeindefreizeit-2027');

-- 3) Neue Haustypen (Preise inkl. Endreinigung, mit 5% Rabatt)
INSERT INTO house_types (event_id, name, slug, description, max_guests, price_per_house, total_quantity, features, sort_order)
SELECT e.id, 'Ferienhaus Typ A+B', 'ferienhaus-typ-ab',
  'Geräumiges Ferienhaus für Familien mit bis zu 6 Personen. Drei Schlafzimmer, Küche, Bad mit Dusche und Terrasse.',
  6, 335.27, 22,
  '["3 Schlafzimmer", "Küche", "Bad mit Dusche", "Terrasse", "WLAN", "Kaffeemaschine", "Kühlschrank", "Bettwäsche inkl.", "Kinderbett verfügbar"]'::JSONB, 1
FROM events e WHERE e.slug = 'gemeindefreizeit-2027';

INSERT INTO house_types (event_id, name, slug, description, max_guests, price_per_house, total_quantity, features, sort_order)
SELECT e.id, 'Ferienhaus Typ C', 'ferienhaus-typ-c',
  'Großes Ferienhaus für Gruppen mit bis zu 10 Personen. Drei Schlafzimmer, Küche mit Backofen und Spülmaschine.',
  10, 420.55, 3,
  '["3 Schlafzimmer", "Küche mit Backofen", "Spülmaschine", "Bad mit Dusche", "Terrasse", "WLAN", "Kaffeemaschine", "Kühlschrank", "Bettwäsche inkl."]'::JSONB, 2
FROM events e WHERE e.slug = 'gemeindefreizeit-2027';

INSERT INTO house_types (event_id, name, slug, description, max_guests, price_per_house, total_quantity, features, sort_order)
SELECT e.id, 'Gästehaus G1-10', 'gaestehaus-g1-10',
  'Gästehaus mit 2 Zimmern (2-Bett + 3-Bett) und 2 Bädern. Ideal für Familien oder kleine Gruppen.',
  5, 307.17, 10,
  '["2 Zimmer", "2 Bäder", "Küche", "WLAN", "Kaffeemaschine", "Kühlschrank", "Bettwäsche inkl.", "Kinderbett verfügbar"]'::JSONB, 3
FROM events e WHERE e.slug = 'gemeindefreizeit-2027';

INSERT INTO house_types (event_id, name, slug, description, max_guests, price_per_house, total_quantity, features, sort_order)
SELECT e.id, 'Gästehaus G11 + App. Villa II', 'gaestehaus-g11-villa-ii',
  'Gästehaus mit 4-Bett-Zimmer und eigenem Bad. Kompakt und gemütlich.',
  4, 223.35, 1,
  '["1 Zimmer", "1 Bad", "Küche", "WLAN", "Kaffeemaschine", "Kühlschrank", "Bettwäsche inkl."]'::JSONB, 4
FROM events e WHERE e.slug = 'gemeindefreizeit-2027';

INSERT INTO house_types (event_id, name, slug, description, max_guests, price_per_house, total_quantity, features, sort_order)
SELECT e.id, 'Villa III (ohne Balkon)', 'villa-iii',
  'Größere Villa für bis zu 6 Personen. Drei Zimmer mit eigenem Bad.',
  6, 317.83, 1,
  '["3 Zimmer", "Eigenes Bad", "Küche", "WLAN", "Kaffeemaschine", "Kühlschrank", "Bettwäsche inkl."]'::JSONB, 5
FROM events e WHERE e.slug = 'gemeindefreizeit-2027';

-- 4) Häuser erstellen
INSERT INTO houses (house_type_id, house_number, label)
SELECT ht.id, gs.n, 'Haus ' || gs.n
FROM house_types ht, generate_series(1, 22) AS gs(n)
WHERE ht.slug = 'ferienhaus-typ-ab';

INSERT INTO houses (house_type_id, house_number, label)
SELECT ht.id, gs.n, 'Haus C' || gs.n
FROM house_types ht, generate_series(1, 3) AS gs(n)
WHERE ht.slug = 'ferienhaus-typ-c';

INSERT INTO houses (house_type_id, house_number, label)
SELECT ht.id, gs.n, 'Gästehaus G' || gs.n
FROM house_types ht, generate_series(1, 10) AS gs(n)
WHERE ht.slug = 'gaestehaus-g1-10';

INSERT INTO houses (house_type_id, house_number, label)
SELECT ht.id, 1, 'Gästehaus G11 + Villa II'
FROM house_types ht
WHERE ht.slug = 'gaestehaus-g11-villa-ii';

INSERT INTO houses (house_type_id, house_number, label)
SELECT ht.id, 1, 'Villa III'
FROM house_types ht
WHERE ht.slug = 'villa-iii';
