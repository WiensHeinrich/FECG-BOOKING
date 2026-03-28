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
      <section className="relative overflow-hidden bg-gradient-to-b from-accent/40 via-accent/15 to-background py-24 md:py-36">
        <div className="absolute inset-0 bg-[url('/docs/uebersichtsplan-eckenhof.jpg')] bg-cover bg-center opacity-[0.05]" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        <div className="container relative mx-auto px-4 text-center">
          <p className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold uppercase tracking-widest text-primary">
            Gemeinsam. Glauben. Erleben.
          </p>
          <h1 className="mt-5 text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
            {event.title}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
            {event.description}
          </p>
          {registrationOpen && (
            <div className="mt-10 flex flex-col items-center gap-3">
              <Button asChild size="lg" className="gap-2 px-10 text-base shadow-lg shadow-primary/25 transition-shadow hover:shadow-xl hover:shadow-primary/30">
                <Link href="/anmeldung">
                  Jetzt anmelden
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <span className="text-xs text-muted-foreground">
                {formatDateRange(event.start_date, event.end_date)} &middot; {event.location}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Highlights */}
      <section className="container mx-auto -mt-8 px-4 py-12 md:-mt-12">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { icon: TreePine, label: "Wanderungen" },
            { icon: Music, label: "Lobpreis" },
            { icon: Flame, label: "Lagerfeuer" },
            { icon: UtensilsCrossed, label: "Gemeinschaft" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-card p-6 text-center shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <span className="text-sm font-semibold">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Info Cards */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-none bg-card shadow-md">
            <CardContent className="flex items-start gap-4 pt-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent">
                <CalendarDays className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Wann</h3>
                <p className="text-sm text-muted-foreground">
                  {formatDateRange(event.start_date, event.end_date)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none bg-card shadow-md">
            <CardContent className="flex items-start gap-4 pt-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
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
                    className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Auf Karte anzeigen
                  </a>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none bg-card shadow-md">
            <CardContent className="flex items-start gap-4 pt-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent">
                <Users className="h-5 w-5 text-primary" />
              </div>
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
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent/50 via-accent/30 to-secondary/40 p-10 text-center md:p-14">
          <div className="absolute -right-6 -top-6 text-[8rem] font-serif leading-none text-primary/[0.07] select-none">&bdquo;</div>
          <blockquote className="relative mx-auto max-w-xl text-xl italic leading-relaxed text-foreground/85 md:text-2xl">
            &bdquo;Wo zwei oder drei versammelt sind in meinem Namen, da bin ich
            mitten unter ihnen.&ldquo;
          </blockquote>
          <cite className="mt-4 block text-sm font-semibold tracking-wide text-primary">
            Matthäus 18:20
          </cite>
        </div>
      </section>

      {/* Anmeldung Hinweis */}
      <section className="container mx-auto px-4 pb-16">
        <Card className="overflow-hidden border-none shadow-lg">
          <CardContent className="relative bg-gradient-to-r from-primary/10 via-accent/20 to-secondary/15 p-8 md:p-10">
            <div className="text-center">
              {registrationOpen ? (
                <>
                  <h2 className="text-2xl font-bold">
                    Die Anmeldung ist geöffnet!
                  </h2>
                  <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
                    Sichern Sie sich jetzt Ihren Platz. Die Reservierung ist 14
                    Tage gültig und wird nach Zahlungseingang bestätigt.
                  </p>
                  <Button asChild className="mt-6 gap-2 px-8 shadow-md shadow-primary/20" size="lg">
                    <Link href="/anmeldung">
                      Zur Anmeldung
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </>
              ) : now < new Date(event.registration_start) ? (
                <>
                  <h2 className="text-2xl font-bold">
                    Anmeldung noch nicht geöffnet
                  </h2>
                  <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
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
                  <h2 className="text-2xl font-bold">
                    Anmeldung geschlossen
                  </h2>
                  <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
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
