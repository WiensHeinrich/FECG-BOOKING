-- Migration 010: Foreign Key waitlist.converted_reservation_id → ON DELETE SET NULL
-- Problem: Reservierung kann nicht gelöscht werden, wenn ein Warteliste-Eintrag darauf verweist.

ALTER TABLE waitlist
  DROP CONSTRAINT IF EXISTS waitlist_converted_reservation_id_fkey;

ALTER TABLE waitlist
  ADD CONSTRAINT waitlist_converted_reservation_id_fkey
  FOREIGN KEY (converted_reservation_id)
  REFERENCES reservations(id)
  ON DELETE SET NULL;
