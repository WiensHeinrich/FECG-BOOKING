-- Migration 008: Bankdaten und Verwendungszweck aktualisieren
-- Neue IBAN und Verwendungszweck-Prefix "Spende Gemeindefreizeit2027"

UPDATE events
SET
  bank_iban = 'DE69643500700008536435',
  bank_reference_prefix = 'Spende Gemeindefreizeit2027'
WHERE slug = 'gemeindefreizeit-2027';
