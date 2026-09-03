import Link from "next/link";
import { ArrowRight, CalendarClock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Event } from "@/lib/types/database";
import { formatDateBerlin } from "@/lib/utils/format";
import type { RegistrationInfo } from "@/lib/utils/registration";

interface RegistrationCtaProps {
  event: Event;
  registration: RegistrationInfo;
}

export function RegistrationCta({ event, registration }: RegistrationCtaProps) {
  return (
    <section className="container mx-auto px-4 py-16">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-[oklch(0.6_0.13_215)] to-[oklch(0.5_0.11_225)] px-6 py-14 text-center text-primary-foreground shadow-xl shadow-primary/25 md:px-12 md:py-16">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-white/10" />

        <div className="relative mx-auto max-w-2xl">
          {registration.status === "open" && (
            <>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Die Anmeldung ist geöffnet
              </h2>
              <p className="mt-4 text-primary-foreground/85">
                Sichern Sie sich jetzt Ihre Unterkunft. Die Reservierung ist{" "}
                {event.reservation_validity_days} Tage gültig und wird nach Zahlungseingang
                verbindlich. Anmeldeschluss ist der {formatDateBerlin(event.registration_end)}.
              </p>
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="mt-8 gap-2 px-8 text-base shadow-lg shadow-black/15"
              >
                <Link href="/anmeldung">
                  Zur Anmeldung
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </>
          )}

          {registration.status === "upcoming" && (
            <>
              <CalendarClock className="mx-auto h-10 w-10 opacity-90" />
              <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
                Anmeldung startet bald
              </h2>
              <p className="mt-4 text-primary-foreground/85">
                Ab dem {formatDateBerlin(event.registration_start)} können Sie sich hier online anmelden.
                Schauen Sie sich bis dahin gern die Unterkünfte und Informationen an.
              </p>
            </>
          )}

          {registration.status === "closed" && (
            <>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Anmeldung geschlossen
              </h2>
              <p className="mt-4 text-primary-foreground/85">
                Die Anmeldefrist ist abgelaufen. Bei Fragen oder für einen Platz auf der Warteliste
                melden Sie sich gern bei uns.
              </p>
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="mt-8 gap-2 px-8 text-base shadow-lg shadow-black/15"
              >
                <a href={`mailto:${event.contact_email}`}>
                  <Mail className="h-4 w-4" />
                  {event.contact_email}
                </a>
              </Button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
