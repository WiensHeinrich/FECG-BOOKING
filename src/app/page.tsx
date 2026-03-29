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
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: TreePine,
              label: "Wanderungen",
              text: `„Die Himmel erzählen die Ehre Gottes, und die Feste verkündigt seiner Hände Werk." (Psalm 19,2) — Gemeinsam entdecken wir Gottes wunderbare Schöpfung auf den Wegen durch den Schwarzwald. Wie die Jünger mit Jesus unterwegs waren, gehen auch wir Seite an Seite und erleben, wie Gespräche in der Natur das Herz berühren.`,
              bg: "from-emerald-400/20 via-teal-300/10 to-green-500/20",
            },
            {
              icon: Music,
              label: "Lobpreis",
              text: `„Singt dem Herrn ein neues Lied, denn er tut Wunder." (Psalm 98,1) — Als Paulus und Silas im Gefängnis sangen, erbebten die Mauern. So öffnet auch unser gemeinsamer Lobpreis verschlossene Herzen und bringt uns als Gemeinde näher zu Gott und zueinander.`,
              bg: "from-sky-400/20 via-blue-300/10 to-indigo-500/20",
            },
            {
              icon: Flame,
              label: "Lagerfeuer",
              text: `„Brannte nicht unser Herz, als er mit uns redete?" (Lukas 24,32) — Am Feuer kommen wir zusammen, wie die ersten Christen es taten. Wir teilen Geschichten, Gedanken und Gottes Wort — und spüren, wie er mitten unter uns ist, wenn die Flammen in den Nachthimmel steigen.`,
              bg: "from-orange-400/20 via-amber-300/10 to-red-500/20",
            },
            {
              icon: UtensilsCrossed,
              label: "Gemeinschaft",
              text: `„Sie waren täglich einmütig beieinander, brachen das Brot in den Häusern und nahmen die Speise mit Freuden." (Apostelgeschichte 2,46) — Gemeinsam essen, lachen und füreinander da sein — das ist gelebter Glaube. In dieser Freizeit erleben wir, was echte Gemeinschaft im Sinne Jesu bedeutet.`,
              bg: "from-violet-400/20 via-purple-300/10 to-fuchsia-500/20",
            },
          ].map(({ icon: Icon, label, text, bg }) => (
            <div
              key={label}
              className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-md transition-all duration-500 hover:shadow-2xl hover:shadow-primary/15"
            >
              {/* Zoom background gradient — scales up on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${bg} opacity-0 transition-all duration-700 ease-out group-hover:scale-110 group-hover:opacity-100`} />
              {/* Dark overlay on hover */}
              <div className="absolute inset-0 bg-foreground/0 transition-all duration-500 group-hover:bg-foreground/[0.03]" />
              {/* Content */}
              <div className="relative flex flex-col items-center gap-4 p-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent transition-all duration-500 group-hover:scale-110 group-hover:bg-primary group-hover:shadow-lg group-hover:shadow-primary/30">
                  <Icon className="h-7 w-7 text-primary transition-colors duration-500 group-hover:text-primary-foreground" />
                </div>
                <h3 className="text-base font-bold transition-colors duration-500 group-hover:text-primary">{label}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Info Cards */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="group relative overflow-hidden border-none bg-card shadow-md transition-all duration-500 hover:shadow-xl hover:shadow-primary/10">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/0 to-primary/0 transition-all duration-500 group-hover:from-accent/10 group-hover:to-primary/5" />
            <CardContent className="relative flex items-start gap-4 pt-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent transition-all duration-500 group-hover:scale-110 group-hover:bg-primary group-hover:shadow-md group-hover:shadow-primary/25">
                <CalendarDays className="h-5 w-5 text-primary transition-colors duration-500 group-hover:text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold transition-colors duration-500 group-hover:text-primary">Wann</h3>
                <p className="text-sm text-muted-foreground">
                  {formatDateRange(event.start_date, event.end_date)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden border-none bg-card shadow-md transition-all duration-500 hover:shadow-xl hover:shadow-primary/10">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/0 to-primary/0 transition-all duration-500 group-hover:from-accent/10 group-hover:to-primary/5" />
            <CardContent className="relative flex items-start gap-4 pt-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent transition-all duration-500 group-hover:scale-110 group-hover:bg-primary group-hover:shadow-md group-hover:shadow-primary/25">
                <MapPin className="h-5 w-5 text-primary transition-colors duration-500 group-hover:text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold transition-colors duration-500 group-hover:text-primary">Wo</h3>
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

          <Card className="group relative overflow-hidden border-none bg-card shadow-md transition-all duration-500 hover:shadow-xl hover:shadow-primary/10">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/0 to-primary/0 transition-all duration-500 group-hover:from-accent/10 group-hover:to-primary/5" />
            <CardContent className="relative flex items-start gap-4 pt-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent transition-all duration-500 group-hover:scale-110 group-hover:bg-primary group-hover:shadow-md group-hover:shadow-primary/25">
                <Users className="h-5 w-5 text-primary transition-colors duration-500 group-hover:text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold transition-colors duration-500 group-hover:text-primary">Kontakt</h3>
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
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent/50 via-accent/30 to-secondary/40 p-10 text-center transition-all duration-700 hover:shadow-xl hover:shadow-primary/15 md:p-14">
          {/* Zoom-Hintergrund */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-accent/0 to-primary/0 transition-all duration-700 group-hover:scale-110 group-hover:from-primary/10 group-hover:via-accent/15 group-hover:to-primary/10" />
          <div className="absolute -right-6 -top-6 text-[8rem] font-serif leading-none text-primary/[0.07] transition-all duration-700 select-none group-hover:scale-110 group-hover:text-primary/[0.12]">&bdquo;</div>
          <blockquote className="relative mx-auto max-w-xl text-xl italic leading-relaxed text-foreground/85 transition-transform duration-700 group-hover:scale-[1.02] md:text-2xl">
            &bdquo;Wo zwei oder drei versammelt sind in meinem Namen, da bin ich
            mitten unter ihnen.&ldquo;
          </blockquote>
          <cite className="relative mt-4 block text-sm font-semibold tracking-wide text-primary">
            Matthäus 18:20
          </cite>
        </div>
      </section>

      {/* Anmeldung Hinweis */}
      <section className="container mx-auto px-4 pb-16">
        <Card className="group overflow-hidden border-none shadow-lg transition-all duration-500 hover:shadow-xl hover:shadow-primary/15">
          <CardContent className="relative bg-gradient-to-r from-primary/10 via-accent/20 to-secondary/15 p-8 md:p-10">
            {/* Zoom-Hintergrund */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-accent/0 to-primary/0 transition-all duration-700 group-hover:scale-110 group-hover:from-primary/10 group-hover:via-accent/15 group-hover:to-primary/5" />
            <div className="relative text-center">
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
