-- Migration 014: Hauspreise auf volle 5 € aufgerundet (10.11.2026)
-- Im Supabase SQL-Editor ausführen.
--
-- Rechenweg wie in Migration 013: (2 Nächte + Endreinigung) minus 5 % Rabatt,
-- plus Anteil an Großküche und Gemeinschaftsräumen (700 € / 222 Betten = 3,15 € je Bett).
-- Neu: Das Ergebnis wird immer auf volle 5 € aufgerundet.
--
--   Ferienhaus Typ A   360,44 € -> 365 €
--   Ferienhaus Typ B   360,44 € -> 365 €
--   Ferienhaus Typ C   bisher 459 € -> 460 €
--   Gästehaus G1-10    bisher 329 € -> 330 €
--   Gästehaus G11      bisher 241 € -> 245 €
--   Villa III          bisher 343 € -> 345 €
--
-- Das Skript kann gefahrlos mehrfach ausgeführt werden.

BEGIN;

UPDATE house_types ht
SET price_per_house = v.preis
FROM (VALUES
  ('ferienhaus-typ-a', 365.00),
  ('ferienhaus-typ-b', 365.00),
  ('ferienhaus-typ-c', 460.00),
  ('gaestehaus-g1-10', 330.00),
  ('gaestehaus-g11',   245.00),
  ('villa-iii',        345.00)
) AS v(slug, preis)
WHERE ht.slug = v.slug
  AND ht.event_id = (SELECT id FROM events WHERE is_active = true);

COMMIT;

-- Kontrolle: erwartet werden 6 Zeilen mit 365 / 365 / 460 / 330 / 245 / 345 €
-- und in der letzten Spalte zusammen 13.300 € bei voller Belegung
SELECT ht.sort_order, ht.name, ht.price_per_house,
       COUNT(h.id) AS haeuser,
       ht.price_per_house * COUNT(h.id) AS summe_bei_vollbelegung
FROM house_types ht
LEFT JOIN houses h ON h.house_type_id = ht.id
WHERE ht.event_id = (SELECT id FROM events WHERE is_active = true)
GROUP BY ht.id, ht.sort_order, ht.name, ht.price_per_house
ORDER BY ht.sort_order;
