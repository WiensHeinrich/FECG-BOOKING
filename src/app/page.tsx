import Link from "next/link";
import {
  CalendarDays,
  MapPin,
  Users,
  ArrowRight,
  TreePine,
  Music,
  Flame,
  UtensilsCrossed,
} from "lucide-react";
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
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-accent/5 to-background py-20 md:py-32">
        <div className="absolute inset-0 bg-[url('/docs/uebersichtsplan-eckenhof.jpg')] bg-cover bg-center opacity-[0.06]" />
        <div className="container relative mx-auto px-4 text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-primary">
            Gemeinsam. Glauben. Erleben.
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-6xl">
            {event.title}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {event.description}
          </p>
          {registrationOpen && (
            <div className="mt-10">
              <Button asChild size="lg" className="gap-2 px-8 text-base">
                <Link href="/anmeldung">
                  Jetzt anmelden
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Highlights */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { icon: TreePine, label: "Wanderungen" },
            { icon: Music, label: "Lobpreis" },
            { icon: Flame, label: "Lagerfeuer" },
            { icon: UtensilsCrossed, label: "Gemeinschaft" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-2 rounded-xl border bg-card p-4 text-center shadow-sm"
            >
              <Icon className="h-7 w-7 text-primary" />
              <span className="text-sm font-medium">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Info Cards */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-l-4 border-l-primary">
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

          <Card className="border-l-4 border-l-primary">
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

          <Card className="border-l-4 border-l-primary">
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

      {/* Bibelvers */}
      <section className="container mx-auto px-4 py-8">
        <div className="rounded-xl bg-primary/5 p-8 text-center md:p-12">
          <blockquote className="mx-auto max-w-xl text-lg italic leading-relaxed text-foreground/80">
            &bdquo;Wo zwei oder drei versammelt sind in meinem Namen, da bin ich
            mitten unter ihnen.&ldquo;
          </blockquote>
          <cite className="mt-3 block text-sm font-medium text-muted-foreground">
            Matthäus 18:20
          </cite>
        </div>
      </section>

      {/* Anmeldung Hinweis */}
      <section className="container mx-auto px-4 pb-16">
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
          <CardContent className="pt-6">
            <div className="text-center">
              {registrationOpen ? (
                <>
                  <h2 className="text-xl font-semibold">
                    Die Anmeldung ist geöffnet!
                  </h2>
                  <p className="mt-2 text-muted-foreground">
                    Sichern Sie sich jetzt Ihren Platz. Die Reservierung ist 14
                    Tage gültig und wird nach Zahlungseingang bestätigt.
                  </p>
                  <Button asChild className="mt-4" variant="outline">
                    <Link href="/anmeldung">Zur Anmeldung</Link>
                  </Button>
                </>
              ) : now < new Date(event.registration_start) ? (
                <>
                  <h2 className="text-xl font-semibold">
                    Anmeldung noch nicht geöffnet
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
