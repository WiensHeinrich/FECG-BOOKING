import Link from "next/link";
import {
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
              text: `„Die Himmel erzählen die Ehre Gottes, und die Feste verkündigt seiner Hände Werk." (Psalm 19,2) — Gemeinsam entdecken wir Gottes wunderbare Schöpfung auf den Wegen durch den Schwarzwald.`,
              image: "/Pictures/Wanderung.png",
            },
            {
              icon: Music,
              label: "Lobpreis",
              text: `„Singt dem Herrn ein neues Lied, denn er tut Wunder." (Psalm 98,1) — Unser gemeinsamer Lobpreis öffnet verschlossene Herzen und bringt uns als Gemeinde näher zu Gott und zueinander.`,
              image: "/Pictures/Lobpreis%20und%20Anbetung.png",
            },
            {
              icon: Flame,
              label: "Lagerfeuer",
              text: `„Brannte nicht unser Herz, als er mit uns redete?" (Lukas 24,32) — Am Feuer kommen wir zusammen und spüren, wie Gott mitten unter uns ist.`,
              image: "/Pictures/Lagerfeuer.png",
            },
            {
              icon: UtensilsCrossed,
              label: "Gemeinschaft",
              text: `„Sie waren täglich einmütig beieinander und brachen das Brot in den Häusern." (Apg 2,46) — Gemeinsam essen, lachen und füreinander da sein — gelebter Glaube.`,
              image: "/Pictures/Gemeinschaft.png",
            },
          ].map(({ icon: Icon, label, text, image }) => (
            <div
              key={label}
              className="group relative h-[28rem] cursor-pointer overflow-hidden rounded-2xl shadow-md transition-shadow duration-500 hover:shadow-2xl hover:shadow-primary/20 md:h-[32rem]"
            >
              {/* Bild — zoomt rein bei Hover */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-110"
                style={{ backgroundImage: `url('${image}')` }}
              />

              {/* Dunkler Overlay — wird dunkler bei Hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10 transition-all duration-500 group-hover:from-black/80 group-hover:via-black/50 group-hover:to-black/20" />

              {/* Obere Linie — fährt nach oben bei Hover */}
              <div className="absolute left-6 right-6 top-1/2 -translate-y-4 border-t border-white/60 transition-all duration-500 ease-out group-hover:top-4 group-hover:translate-y-0" />

              {/* Untere Linie — fährt nach unten bei Hover */}
              <div className="absolute bottom-1/2 left-6 right-6 translate-y-4 border-t border-white/60 transition-all duration-500 ease-out group-hover:bottom-4 group-hover:translate-y-0" />

              {/* Label — immer zentriert sichtbar */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center transition-all duration-500 group-hover:justify-end group-hover:pb-8">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-all duration-500 group-hover:mb-4 group-hover:scale-110 group-hover:bg-white/30">
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold tracking-wide text-white drop-shadow-lg">{label}</h3>
                {/* Beschreibung — erscheint bei Hover */}
                <p className="mx-6 mt-0 max-h-0 overflow-hidden text-sm leading-relaxed text-white/0 drop-shadow transition-all duration-500 group-hover:mt-3 group-hover:max-h-40 group-hover:text-white/90">
                  {text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Info Cards — Wann / Wo / Kontakt */}
      <section className="container mx-auto px-4 py-8">
        <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-3">
          {/* Wann */}
          <div className="group relative aspect-square overflow-hidden rounded-2xl shadow-md transition-all duration-500 hover:shadow-2xl hover:shadow-primary/15">
            <div className="absolute inset-0 transition-all duration-700 ease-out group-hover:scale-110 group-hover:brightness-50 group-hover:saturate-50">
              <img src="/Pictures/Wann.png" alt="Wann" className="h-full w-full object-cover" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent transition-all duration-500 group-hover:from-black/60 group-hover:via-black/40 group-hover:to-black/30" />
            <div className="absolute inset-x-0 bottom-0 p-4 text-center transition-all duration-500 group-hover:bottom-auto group-hover:top-1/2 group-hover:-translate-y-1/2">
              <h3 className="text-lg font-bold text-white drop-shadow-lg transition-all duration-500 group-hover:text-2xl">Wann</h3>
              <p className="mt-0.5 text-sm font-semibold text-white/80 drop-shadow transition-all duration-500 group-hover:text-base group-hover:text-white">
                {formatDateRange(event.start_date, event.end_date)}
              </p>
            </div>
          </div>

          {/* Wo */}
          <div className="group relative aspect-square overflow-hidden rounded-2xl shadow-md transition-all duration-500 hover:shadow-2xl hover:shadow-primary/15">
            <div className="absolute inset-0 transition-all duration-700 ease-out group-hover:scale-110 group-hover:brightness-50 group-hover:saturate-50">
              <img src="/Pictures/Wo.png" alt="Wo" className="h-full w-full object-cover" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent transition-all duration-500 group-hover:from-black/60 group-hover:via-black/40 group-hover:to-black/30" />
            <div className="absolute inset-x-0 bottom-0 p-4 text-center transition-all duration-500 group-hover:bottom-auto group-hover:top-1/2 group-hover:-translate-y-1/2">
              <h3 className="text-lg font-bold text-white drop-shadow-lg transition-all duration-500 group-hover:text-2xl">Wo</h3>
              <p className="mt-0.5 text-sm font-semibold text-white/80 drop-shadow transition-all duration-500 group-hover:text-base group-hover:text-white">{event.location}</p>
              {event.location_address && (
                <p className="text-xs text-white/60 drop-shadow transition-all duration-500 group-hover:text-sm group-hover:text-white/80">{event.location_address}</p>
              )}
              {event.location_url && (
                <a
                  href={event.location_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-0.5 inline-block text-xs font-semibold text-white/70 underline underline-offset-4 drop-shadow transition-all duration-500 group-hover:text-sm group-hover:text-white"
                >
                  Auf Karte anzeigen
                </a>
              )}
            </div>
          </div>

          {/* Kontakt */}
          <div className="group relative aspect-square overflow-hidden rounded-2xl shadow-md transition-all duration-500 hover:shadow-2xl hover:shadow-primary/15">
            <div className="absolute inset-0 transition-all duration-700 ease-out group-hover:scale-110 group-hover:brightness-50 group-hover:saturate-50">
              <img src="/Pictures/kontakt.png" alt="Kontakt" className="h-full w-full object-cover" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent transition-all duration-500 group-hover:from-black/60 group-hover:via-black/40 group-hover:to-black/30" />
            <div className="absolute inset-x-0 bottom-0 p-4 text-center transition-all duration-500 group-hover:bottom-auto group-hover:top-1/2 group-hover:-translate-y-1/2">
              <h3 className="text-lg font-bold text-white drop-shadow-lg transition-all duration-500 group-hover:text-2xl">Kontakt</h3>
              <p className="mt-0.5 text-sm font-semibold text-white/80 drop-shadow transition-all duration-500 group-hover:text-base group-hover:text-white">{event.contact_email}</p>
              {event.contact_phone && (
                <p className="text-xs text-white/60 drop-shadow transition-all duration-500 group-hover:text-sm group-hover:text-white/80">{event.contact_phone}</p>
              )}
            </div>
          </div>
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
