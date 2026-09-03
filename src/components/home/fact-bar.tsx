import { CalendarDays, ClipboardCheck, Mail, MapPin } from "lucide-react";
import { differenceInCalendarDays, format } from "date-fns";
import { de } from "date-fns/locale";
import type { Event } from "@/lib/types/database";
import { formatDateBerlin, formatDateRange } from "@/lib/utils/format";
import type { RegistrationInfo } from "@/lib/utils/registration";

interface FactBarProps {
  event: Event;
  registration: RegistrationInfo;
}

export function FactBar({ event, registration }: FactBarProps) {
  const start = new Date(event.start_date);
  const end = new Date(event.end_date);
  const nights = Math.max(1, differenceInCalendarDays(end, start));
  const weekdays = `${format(start, "EEEE", { locale: de })} bis ${format(end, "EEEE", { locale: de })}`;

  const registrationValue =
    registration.status === "open"
      ? `Bis ${formatDateBerlin(event.registration_end)}`
      : registration.status === "upcoming"
        ? `Ab ${formatDateBerlin(event.registration_start)}`
        : "Geschlossen";

  const registrationSub =
    registration.status === "open"
      ? registration.daysUntilRegistrationEnd <= 14
        ? `Nur noch ${registration.daysUntilRegistrationEnd} Tage`
        : "Online in wenigen Minuten"
      : registration.status === "upcoming"
        ? "Die Anmeldung startet bald"
        : "Die Anmeldefrist ist abgelaufen";

  return (
    <section className="container relative z-10 mx-auto -mt-10 px-4">
      <div className="grid gap-5 rounded-2xl border bg-card p-5 shadow-lg shadow-black/5 sm:grid-cols-2 lg:grid-cols-4 md:p-6">
        <Fact icon={CalendarDays} label="Wann">
          <p className="font-semibold leading-snug">
            {formatDateRange(event.start_date, event.end_date)}
          </p>
          <p className="text-xs text-muted-foreground">
            {weekdays}, {nights} {nights === 1 ? "Nacht" : "Nächte"}
          </p>
        </Fact>

        <Fact icon={MapPin} label="Wo">
          <p className="font-semibold leading-snug">{event.location}</p>
          {event.location_address && (
            <p className="text-xs text-muted-foreground">{event.location_address}</p>
          )}
          {event.location_url && (
            <a
              href={event.location_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-xs font-semibold text-primary underline-offset-4 hover:underline"
            >
              Auf Karte anzeigen
            </a>
          )}
        </Fact>

        <Fact icon={ClipboardCheck} label="Anmeldung">
          <p className="font-semibold leading-snug">{registrationValue}</p>
          <p className="text-xs text-muted-foreground">{registrationSub}</p>
        </Fact>

        <Fact icon={Mail} label="Kontakt">
          <a
            href={`mailto:${event.contact_email}`}
            className="block break-all font-semibold leading-snug text-foreground underline-offset-4 hover:text-primary hover:underline"
          >
            {event.contact_email}
          </a>
          {event.contact_phone && (
            <p className="text-xs text-muted-foreground">{event.contact_phone}</p>
          )}
        </Fact>
      </div>
    </section>
  );
}

function Fact({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof CalendarDays;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3.5">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <div className="mt-0.5">{children}</div>
      </div>
    </div>
  );
}
