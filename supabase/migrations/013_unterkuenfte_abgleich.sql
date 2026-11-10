-- Migration 013: Unterkünfte mit Vertrag und Unterlagen des Feriendorfs abgeglichen (10.11.2026)
-- Im Supabase SQL-Editor ausführen.
--
--   1) Apartment Villa II entfernt: nicht Teil der Belegungsvereinbarung 30010262
--   2) Ferienhaus Typ A+B getrennt in Typ A (Häuser 1-4, 6, 7, 9-14) und Typ B (Häuser 5, 8, 15, 19-25)
--   3) Echte Hausnummern: Typ C sind die Häuser 16 bis 18
--   4) Beschreibungen und Ausstattung laut Grundrissen und Angaben des Feriendorfs
--   5) Preise: (2 Nächte + Endreinigung) minus 5 % Rabatt, plus Anteil an Großküche (400 €) und
--      Gemeinschaftsräumen (300 €), verteilt nach Betten (700 € / 222 Betten = 3,15 € je Bett),
--      auf volle Euro aufgerundet
--
-- Bestehende Reservierungen behalten Haus und Betrag.

BEGIN;

-- Schutz vor doppelter Ausführung und vor Datenverlust
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM house_types WHERE slug = 'ferienhaus-typ-ab') THEN
    RAISE EXCEPTION 'Migration 013 wurde bereits ausgeführt (Typ A+B existiert nicht mehr).';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM reservations r
    JOIN houses h ON h.id = r.house_id
    JOIN house_types ht ON ht.id = h.house_type_id
    WHERE ht.slug = 'apartment-villa-ii'
  ) THEN
    RAISE EXCEPTION 'Für Apartment Villa II gibt es noch Reservierungen. Bitte zuerst im Admin löschen.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM waitlist w
    JOIN house_types ht ON ht.id = w.house_type_id
    WHERE ht.slug = 'apartment-villa-ii'
  ) THEN
    RAISE EXCEPTION 'Für Apartment Villa II gibt es noch Wartelisteneinträge. Bitte zuerst im Admin entfernen.';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 1) Apartment Villa II entfernen
-- ---------------------------------------------------------------------------
DELETE FROM houses
WHERE house_type_id IN (SELECT id FROM house_types WHERE slug = 'apartment-villa-ii');

DELETE FROM house_types WHERE slug = 'apartment-villa-ii';

-- ---------------------------------------------------------------------------
-- 2) Typ B anlegen und Häuser zuordnen
-- ---------------------------------------------------------------------------
INSERT INTO house_types (event_id, name, slug, description, max_guests, price_per_house, total_quantity, features, sort_order)
SELECT
  ht.event_id,
  'Ferienhaus Typ B',
  'ferienhaus-typ-b',
  'Zweigeschossiges Ferienhaus für bis zu 6 Personen mit drei Doppelbettzimmern. Im Erdgeschoss Wohn-Essbereich mit Küchenzeile, ein Doppelbettzimmer, Dusche und WC. Im Dachgeschoss zwei Doppelbettzimmer. Mit Terrasse. Die Häuser 19 bis 25 haben zusätzlich ein WC im Obergeschoss.',
  6,
  361.00,
  10,
  '["3 Doppelbettzimmer", "Küchenzeile mit Gasherd", "Dusche und WC", "Terrasse mit Liegen", "Kleinkinderbett", "Kaffeemaschine und Wasserkocher", "Kühlschrank ohne Gefrierfach", "Bettwäsche inklusive", "WLAN"]'::jsonb,
  2
FROM house_types ht
WHERE ht.slug = 'ferienhaus-typ-ab';

-- Bisherige Nummern 16 bis 22 sind in Wirklichkeit die Häuser 19 bis 25 (Typ B)
UPDATE houses h
SET house_type_id = b.id,
    house_number = h.house_number + 3
FROM house_types a, house_types b
WHERE a.slug = 'ferienhaus-typ-ab'
  AND b.slug = 'ferienhaus-typ-b'
  AND h.house_type_id = a.id
  AND h.house_number BETWEEN 16 AND 22;

-- Häuser 5, 8 und 15 gehören ebenfalls zu Typ B
UPDATE houses h
SET house_type_id = b.id
FROM house_types a, house_types b
WHERE a.slug = 'ferienhaus-typ-ab'
  AND b.slug = 'ferienhaus-typ-b'
  AND h.house_type_id = a.id
  AND h.house_number IN (5, 8, 15);

-- ---------------------------------------------------------------------------
-- 3) Typ A (bisher A+B)
-- ---------------------------------------------------------------------------
UPDATE house_types
SET name = 'Ferienhaus Typ A',
    slug = 'ferienhaus-typ-a',
    description = 'Zweigeschossiges Ferienhaus für bis zu 6 Personen. Im Erdgeschoss Wohn-Essbereich mit Küchenzeile, ein Stockbettzimmer, Dusche und WC. Im Dachgeschoss das Elternschlafzimmer, ein weiteres Stockbettzimmer und ein WC. Mit Terrasse.',
    max_guests = 6,
    price_per_house = 361.00,
    total_quantity = 12,
    features = '["Elternschlafzimmer mit Doppelbett", "2 Stockbettzimmer", "Küchenzeile mit Gasherd", "Dusche und 2 WC", "Terrasse mit Liegen", "Kleinkinderbett", "Kaffeemaschine und Wasserkocher", "Kühlschrank ohne Gefrierfach", "Bettwäsche inklusive", "WLAN"]'::jsonb,
    sort_order = 1
WHERE slug = 'ferienhaus-typ-ab';

UPDATE houses h
SET label = 'Haus ' || h.house_number
FROM house_types ht
WHERE ht.id = h.house_type_id
  AND ht.slug IN ('ferienhaus-typ-a', 'ferienhaus-typ-b');

-- ---------------------------------------------------------------------------
-- 4) Typ C: Häuser 16 bis 18, fünf Schlafzimmer
-- ---------------------------------------------------------------------------
UPDATE houses h
SET house_number = h.house_number + 15,
    label = 'Haus ' || (h.house_number + 15)
FROM house_types ht
WHERE ht.id = h.house_type_id
  AND ht.slug = 'ferienhaus-typ-c'
  AND h.house_number BETWEEN 1 AND 3;

UPDATE house_types
SET description = 'Großes zweigeschossiges Ferienhaus für bis zu 10 Personen mit fünf Schlafzimmern. Im Erdgeschoss Wohn-Essbereich mit Küchenzeile, zwei Doppelbettzimmer, ein Stockbettzimmer, Dusche und WC. Das Erdgeschoss ist rollstuhlgerecht. Im Dachgeschoss zwei weitere Doppelbettzimmer und zwei Bäder. Mit Terrasse.',
    max_guests = 10,
    price_per_house = 459.00,
    total_quantity = 3,
    features = '["4 Doppelbettzimmer", "1 Stockbettzimmer", "3 Bäder", "Küchenzeile mit Gasherd, Backofen und Spülmaschine", "Erdgeschoss rollstuhlgerecht", "Terrasse mit Liegen", "Kleinkinderbett", "Kaffeemaschine und Wasserkocher", "Kühlschrank ohne Gefrierfach", "Bettwäsche inklusive", "WLAN"]'::jsonb,
    sort_order = 3
WHERE slug = 'ferienhaus-typ-c';

-- ---------------------------------------------------------------------------
-- 5) Gästehaus und Villa
-- ---------------------------------------------------------------------------
UPDATE house_types
SET description = 'Ferienwohnung im Gästehaus für bis zu 5 Personen: Elternschlafzimmer und Dreibettzimmer, jedes mit eigenem Bad, dazu ein Wohnzimmer mit Küchenzeile und Fernseher. Die Wohnungen im Erdgeschoss haben eine Terrasse, die in den Obergeschossen einen Balkon. Die Wohnungen 3 bis 6 sind rollstuhlgeeignet.',
    price_per_house = 329.00,
    features = '["Elternschlafzimmer", "Dreibettzimmer", "2 Bäder", "Wohnzimmer mit Küchenzeile (2-Platten-Herd)", "Terrasse oder Balkon", "Fernseher", "Kinderbett möglich", "Kaffeemaschine und Wasserkocher", "Kühlschrank ohne Gefrierfach", "Bettwäsche inklusive", "WLAN"]'::jsonb,
    sort_order = 4
WHERE slug = 'gaestehaus-g1-10';

UPDATE house_types
SET description = 'Wohnung im Gästehaus für bis zu 4 Personen mit Vierbettzimmer, eigenem Bad und Küche.',
    price_per_house = 241.00,
    features = '["Vierbettzimmer", "Eigenes Bad", "Küche", "Fernseher", "Kaffeemaschine und Wasserkocher", "Kühlschrank ohne Gefrierfach", "Bettwäsche inklusive", "WLAN"]'::jsonb,
    sort_order = 5
WHERE slug = 'gaestehaus-g11';

UPDATE house_types
SET description = 'Drei-Zimmer-Wohnung im zweiten Obergeschoss der denkmalgeschützten Villa Junghans für bis zu 6 Personen, mit zwei Bädern und großem Wohn-Essraum. Ohne Balkon.',
    price_per_house = 343.00,
    features = '["3 Zimmer mit 6 Betten", "2 Bäder", "Großer Wohn-Essraum mit Küche", "Ohne Balkon", "Kaffeemaschine und Wasserkocher", "Kühlschrank ohne Gefrierfach", "Bettwäsche inklusive", "WLAN"]'::jsonb,
    sort_order = 6
WHERE slug = 'villa-iii';

COMMIT;

-- Kontrolle: erwartet werden 6 Zeilen mit 12 / 10 / 3 / 10 / 1 / 1 Häusern
SELECT ht.sort_order, ht.name, ht.max_guests, ht.price_per_house,
       COUNT(h.id) AS haeuser,
       string_agg(h.house_number::text, ', ' ORDER BY h.house_number) AS hausnummern
FROM house_types ht
LEFT JOIN houses h ON h.house_type_id = ht.id
WHERE ht.event_id = (SELECT id FROM events WHERE is_active = true)
GROUP BY ht.id, ht.sort_order, ht.name, ht.max_guests, ht.price_per_house
ORDER BY ht.sort_order;
