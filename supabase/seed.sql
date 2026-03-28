-- Seed-Daten: Beispiel-Freizeit fuer Entwicklung/Test

INSERT INTO events (
  title, slug, description, location, location_address, location_url,
  start_date, end_date, registration_start, registration_end,
  reservation_validity_days, bank_account_holder, bank_iban, bank_bic,
  bank_reference_prefix, contact_email, contact_phone, is_active
) VALUES (
  'Gemeindefreizeit 2026',
  'gemeindefreizeit-2026',
  'Herzlich willkommen zur Gemeindefreizeit 2026 der FECG Trossingen e.V.! Wir freuen uns auf eine wunderbare gemeinsame Zeit mit Gottesdiensten, Gemeinschaft, Wanderungen und vielem mehr.',
  'Feriendorf Schwarzwald',
  'Feriendorfstrasse 1, 78098 Triberg',
  'https://maps.google.com',
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

-- Haustypen
INSERT INTO house_types (event_id, name, slug, description, max_guests, price_per_house, total_quantity, features, sort_order)
SELECT
  e.id,
  'Familienhaus Gross',
  'familienhaus-gross',
  'Geraiumiges Ferienhaus fuer Familien mit bis zu 6 Personen. Zwei Schlafzimmer, Wohnkueche, Bad mit Dusche.',
  6,
  850.00,
  4,
  '["2 Schlafzimmer", "Wohnkueche", "Bad mit Dusche", "Terrasse", "WLAN"]'::JSONB,
  1
FROM events e WHERE e.slug = 'gemeindefreizeit-2026';

INSERT INTO house_types (event_id, name, slug, description, max_guests, price_per_house, total_quantity, features, sort_order)
SELECT
  e.id,
  'Familienhaus Klein',
  'familienhaus-klein',
  'Gemuetliches Ferienhaus fuer kleine Familien mit bis zu 4 Personen. Ein Schlafzimmer, Wohnkueche, Bad.',
  4,
  650.00,
  6,
  '["1 Schlafzimmer", "Wohnkueche", "Bad mit Dusche", "WLAN"]'::JSONB,
  2
FROM events e WHERE e.slug = 'gemeindefreizeit-2026';

INSERT INTO house_types (event_id, name, slug, description, max_guests, price_per_house, total_quantity, features, sort_order)
SELECT
  e.id,
  'Einzelzimmer',
  'einzelzimmer',
  'Komfortables Einzelzimmer im Haupthaus. Ideal fuer Einzelpersonen oder Paare.',
  2,
  350.00,
  8,
  '["1 Zimmer", "Eigenes Bad", "WLAN"]'::JSONB,
  3
FROM events e WHERE e.slug = 'gemeindefreizeit-2026';

-- Haeuser erstellen (Familienhaus Gross: 4 Stueck)
INSERT INTO houses (house_type_id, house_number, label)
SELECT ht.id, gs.n, 'Haus ' || gs.n
FROM house_types ht, generate_series(1, 4) AS gs(n)
WHERE ht.slug = 'familienhaus-gross';

-- Haeuser erstellen (Familienhaus Klein: 6 Stueck)
INSERT INTO houses (house_type_id, house_number, label)
SELECT ht.id, gs.n, 'Haus ' || (gs.n + 4)
FROM house_types ht, generate_series(1, 6) AS gs(n)
WHERE ht.slug = 'familienhaus-klein';

-- Zimmer erstellen (Einzelzimmer: 8 Stueck)
INSERT INTO houses (house_type_id, house_number, label)
SELECT ht.id, gs.n, 'Zimmer ' || gs.n
FROM house_types ht, generate_series(1, 8) AS gs(n)
WHERE ht.slug = 'einzelzimmer';
