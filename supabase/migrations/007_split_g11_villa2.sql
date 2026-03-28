-- Migration 007: Gästehaus G11 und Apartment Villa II aufteilen (waren fälschlicherweise kombiniert)

-- Altes Haus und Haustyp löschen
DELETE FROM houses
WHERE house_type_id IN (
  SELECT id FROM house_types WHERE slug = 'gaestehaus-g11-villa-ii'
);
DELETE FROM house_types WHERE slug = 'gaestehaus-g11-villa-ii';

-- Gästehaus G11 (4 Personen, 223.35 €)
INSERT INTO house_types (event_id, name, slug, description, max_guests, price_per_house, total_quantity, features, sort_order)
SELECT e.id, 'Gästehaus G11', 'gaestehaus-g11',
  'Gästehaus mit 4-Bett-Zimmer und eigenem Bad. Kompakt und gemütlich.',
  4, 223.35, 1,
  '["1 Zimmer", "1 Bad", "Küche", "WLAN", "Kaffeemaschine", "Kühlschrank", "Bettwäsche inkl."]'::JSONB, 4
FROM events e WHERE e.slug = 'gemeindefreizeit-2027';

INSERT INTO houses (house_type_id, house_number, label)
SELECT ht.id, 1, 'Gästehaus G11'
FROM house_types ht WHERE ht.slug = 'gaestehaus-g11';

-- Apartment Villa II (4 Personen, 223.35 €)
INSERT INTO house_types (event_id, name, slug, description, max_guests, price_per_house, total_quantity, features, sort_order)
SELECT e.id, 'Apartment Villa II', 'apartment-villa-ii',
  'Apartment für bis zu 4 Personen. Eigenes Bad und Küche.',
  4, 223.35, 1,
  '["1 Zimmer", "Eigenes Bad", "Küche", "WLAN", "Kaffeemaschine", "Kühlschrank", "Bettwäsche inkl."]'::JSONB, 5
FROM events e WHERE e.slug = 'gemeindefreizeit-2027';

INSERT INTO houses (house_type_id, house_number, label)
SELECT ht.id, 1, 'Apartment Villa II'
FROM house_types ht WHERE ht.slug = 'apartment-villa-ii';

-- Villa III sort_order anpassen
UPDATE house_types SET sort_order = 6 WHERE slug = 'villa-iii';
