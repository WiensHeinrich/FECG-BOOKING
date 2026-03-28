import Link from "next/link";
import { CalendarDays, MapPin, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getActiveEvent } from "@/lib/queries/events";
import { formatDateRange } from "@/lib/utils/format";

export default async function HomePage() {
  const event = await getActiveEvent();

  if (!event) {
    return (
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Aktuell keine Freizeit geplant</h1>
          <p className="mt-2 text-muted-foreground">
            Sobald eine neue Gemeindefreizeit geplant ist, finden Sie hier alle
            Informationen.
          </p>
        </div>
      </div>
    );
  }

  const now = new Date();
  const registrationOpen =
    new Date(event.registration_start) <= now &&
    now <= new Date(event.registration_end);

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/5 to-background py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
            {event.title}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            {event.description}
          </p>
          {registrationOpen && (
            <div className="mt-8">
              <Button asChild size="lg" className="gap-2">
                <Link href="/anmeldung">
                  Jetzt anmelden
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Info Cards */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardContent className="flex items-start gap-4 pt-6">
              <CalendarDays className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
              <div>
                <h3 className="font-semibold">Wann</h3>
                <p className="text-sm text-muted-foreground">
                  {formatDateRange(event.start_date, event.end_date)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-start gap-4 pt-6">
              <MapPin className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
              <div>
                <h3 className="font-semibold">Wo</h3>
                <p className="text-sm text-muted-foreground">
                  {event.location}
                </p>
                {event.location_address && (
                  <p className="text-sm text-muted-foreground">
                    {event.location_address}
                  </p>
                )}
                {event.location_url && (
                  <a
                    href={event.location_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary underline-offset-4 hover:underline"
                  >
                    Auf Karte anzeigen
                  </a>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-start gap-4 pt-6">
              <Users className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
              <div>
                <h3 className="font-semibold">Kontakt</h3>
                <p className="text-sm text-muted-foreground">
                  {event.contact_email}
                </p>
                {event.contact_phone && (
                  <p className="text-sm text-muted-foreground">
                    {event.contact_phone}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Anmeldung Hinweis */}
      <section className="container mx-auto px-4 pb-16">
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="text-center">
              {registrationOpen ? (
                <>
                  <h2 className="text-xl font-semibold">
                    Die Anmeldung ist geoeffnet!
                  </h2>
                  <p className="mt-2 text-muted-foreground">
                    Sichern Sie sich jetzt Ihren Platz. Die Reservierung ist 14
                    Tage gueltig und wird nach Zahlungseingang bestaetigt.
                  </p>
                  <Button asChild className="mt-4" variant="outline">
                    <Link href="/anmeldung">Zur Anmeldung</Link>
                  </Button>
                </>
              ) : now < new Date(event.registration_start) ? (
                <>
                  <h2 className="text-xl font-semibold">
                    Anmeldung noch nicht geoeffnet
                  </h2>
                  <p className="mt-2 text-muted-foreground">
                    Die Anmeldung startet am{" "}
                    {new Date(event.registration_start).toLocaleDateString(
                      "de-DE",
                      { day: "numeric", month: "long", year: "numeric" }
                    )}
                    .
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-semibold">
                    Anmeldung geschlossen
                  </h2>
                  <p className="mt-2 text-muted-foreground">
                    Die Anmeldefrist ist leider abgelaufen. Bei Fragen wenden Sie
                    sich bitte an {event.contact_email}.
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
