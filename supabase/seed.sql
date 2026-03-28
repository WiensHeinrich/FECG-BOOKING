-- Seed-Daten: Gemeindefreizeit 2026 im Feriendorf Eckenhof Schramberg

INSERT INTO events (
  title, slug, description, location, location_address, location_url,
  start_date, end_date, registration_start, registration_end,
  reservation_validity_days, bank_account_holder, bank_iban, bank_bic,
  bank_reference_prefix, contact_email, contact_phone, is_active
) VALUES (
  'Gemeindefreizeit 2026',
  'gemeindefreizeit-2026',
  'Herzlich willkommen zur Gemeindefreizeit 2026 der FECG Trossingen e.V.! Wir verbringen eine gemeinsame Woche im autofreien Feriendorf Eckenhof im Schwarzwald — mit Gottesdiensten, Gemeinschaft, Wanderungen und vielem mehr.',
  'Feriendorf Eckenhof Schramberg',
  'Dr. Helmut-Junghans-Strasse 50, 78713 Schramberg-Sulgen',
  'https://maps.google.com/?q=Dr.+Helmut-Junghans-Strasse+50,+78713+Schramberg-Sulgen',
  '2026-08-01',
  '2026-08-08',
  '2026-03-01T00:00:00Z',
  '2026-07-01T23:59:59Z',
  14,
  'FECG Trossingen e.V.',
  'DE89 3704 0044 0532 0130 00',
  'COBADEFFXXX',
  'GF2026',
  'freizeit@fecg-trossingen.de',
  '+49 7425 12345',
  true
);

-- Haustypen (Preise = Gesamtpreis fuer 7 Naechte)

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

-- Haeuser erstellen

INSERT INTO houses (house_type_id, house_number, label)
SELECT ht.id, gs.n, 'Haus ' || gs.n
FROM house_types ht, generate_series(1, 22) AS gs(n)
WHERE ht.slug = 'ferienhaus-typ-ab';

INSERT INTO houses (house_type_id, house_number, label)
SELECT ht.id, gs.n, 'Haus C' || gs.n
FROM house_types ht, generate_series(1, 2) AS gs(n)
WHERE ht.slug = 'ferienhaus-typ-c-10';

INSERT INTO houses (house_type_id, house_number, label)
SELECT ht.id, 1, 'Haus C3'
FROM house_types ht
WHERE ht.slug = 'ferienhaus-typ-c-8';

INSERT INTO houses (house_type_id, house_number, label)
SELECT ht.id, gs.n, 'Gaestehaus G' || gs.n
FROM house_types ht, generate_series(1, 10) AS gs(n)
WHERE ht.slug = 'gaestehaus-g1-10';

INSERT INTO houses (house_type_id, house_number, label)
SELECT ht.id, 1, 'Gaestehaus G11'
FROM house_types ht
WHERE ht.slug = 'gaestehaus-g11';

INSERT INTO houses (house_type_id, house_number, label)
SELECT ht.id, 1, 'Villa I'
FROM house_types ht
WHERE ht.slug = 'villa-i';

INSERT INTO houses (house_type_id, house_number, label)
SELECT ht.id, 1, 'Villa II'
FROM house_types ht
WHERE ht.slug = 'villa-ii';

INSERT INTO houses (house_type_id, house_number, label)
SELECT ht.id, 1, 'Villa III'
FROM house_types ht
WHERE ht.slug = 'villa-iii';

INSERT INTO houses (house_type_id, house_number, label)
SELECT ht.id, 1, 'Wohnung'
FROM house_types ht
WHERE ht.slug = 'wohnung';
