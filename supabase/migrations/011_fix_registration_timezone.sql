-- Migration 011: Anmeldezeitraum in deutscher Zeit setzen
-- Migration 006 hatte den Anmeldeschluss auf 23:59:59 UTC gesetzt. Das ist in Deutschland
-- bereits der 9. Juni um 1:59 Uhr, deshalb zeigte die Seite "bis 09. Juni 2027".

UPDATE events
SET
  registration_start = '2026-03-28 00:00:00 Europe/Berlin',
  registration_end   = '2027-06-08 23:59:59 Europe/Berlin'
WHERE slug = 'gemeindefreizeit-2027';
