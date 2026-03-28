# FECG Booking

Buchungssystem fuer die Gemeindefreizeit der FECG Trossingen e.V. auf Basis von Next.js und Supabase.

## Funktionen

- Oeffentliche Start-, Info- und Anmeldeseiten
- Reservierung von Unterkunftstypen mit Gastdaten
- Wartelisten-Eintrag fuer ausgebuchte Unterkunftstypen
- Adminbereich fuer Reservierungen, Warteliste, Hausverwaltung und Event-Einstellungen
- Supabase-Migrationen fuer Schema, RLS und sichere Public-RPCs

## Technik

- Next.js 16 mit App Router
- React 19
- Tailwind CSS 4
- Supabase Auth, Database und RLS
- Server Actions fuer Buchungs- und Adminprozesse

## Lokale Entwicklung

1. Abhaengigkeiten installieren:

```bash
pnpm install
```

2. Umgebungsvariablen anlegen:

```bash
cp .env.example .env.local
```

3. Werte in `.env.local` setzen:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`

4. Entwicklungsserver starten:

```bash
pnpm dev
```

Die Anwendung laeuft danach unter [http://localhost:3000](http://localhost:3000).

## Datenbank

Die Supabase-Migrationen liegen in `supabase/migrations/001_create_schema.sql`, `supabase/migrations/002_fix_rls.sql`, `supabase/migrations/003_create_admin_user.sql` und `supabase/migrations/004_secure_public_flows.sql`.

Fuer lokale Testdaten gibt es `supabase/seed.sql`.

## Wichtige Hinweise

- Adminzugriffe setzen einen Eintrag in `admin_users` voraus.
- Die oeffentliche Reservierungsbestaetigung funktioniert ueber einen tokenisierten Link und nicht mehr allein ueber die Reservierungs-ID.
- `RESEND_API_KEY` und `CRON_SECRET` sind in `.env.example` vorbereitet, aber im aktuellen Stand noch nicht aktiv verdrahtet.
