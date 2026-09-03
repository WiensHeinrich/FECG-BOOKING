import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Car,
  Check,
  Clock,
  FileDown,
  FileText,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { ImagePreview } from "@/components/ui/image-preview";
import { getActiveEvent } from "@/lib/queries/events";
import { getPublishedDocuments } from "@/lib/queries/documents";
import { formatFileSize } from "@/lib/utils/format";
import { getRegistrationInfo } from "@/lib/utils/registration";

export const metadata: Metadata = {
  title: "Informationen",
  description:
    "An- und Abreise, Ausstattung der Unterkünfte, Mitbringliste, Gemeinschaftseinrichtungen und Grundrisse für die Gemeindefreizeit im Feriendorf Eckenhof Schramberg.",
};

const sections = [
  { id: "anreise", label: "An- und Abreise" },
  { id: "ausstattung", label: "Ausstattung" },
  { id: "mitbringen", label: "Mitbringen" },
  { id: "einrichtungen", label: "Einrichtungen" },
  { id: "grundrisse", label: "Grundrisse" },
];

const vorhanden = [
  "Kaffeemaschine (Filtertüten bitte mitbringen)",
  "Wasserkocher",
  "Kühlschrank (ohne Gefrierfach)",
  "Grundgeschirr und Besteck",
  "Bettwäsche inklusive",
  "Kinderbett und Hochstuhl auf Anfrage",
  "WLAN im ganzen Dorf",
  "Heizung",
];

const nichtVorhanden = [
  "Backofen (nur in Typ C)",
  "Spülmaschine (nur in Typ C)",
  "Gefrierfach",
  "Elektrogrill (Gemeinschaftsgrill vorhanden)",
  "Fernseher im Haus (TV-Raum im Hauptgebäude)",
];

const mitbringen = [
  "Spülmittel und Spültabs",
  "Spültücher und Putzlappen",
  "Müllbeutel",
  "Toilettenpapier",
  "Filtertüten für die Kaffeemaschine",
  "Handtücher",
  "Sandspielzeug für den Sandkasten",
  "Eigenes Datenvolumen, das WLAN kann begrenzt sein",
];

const einrichtungen = [
  {
    title: "Großer Grillplatz",
    text: "Überdachter Gemeinschaftsgrill für alle Gäste. Ideal für gemeinsame Abende.",
    image: "/images/grill.webp",
  },
  {
    title: "Waschraum",
    text: "Münzbetriebene Waschmaschine und Trockner (3,50 € pro Ladung). Ein Bügeleisen ist vorhanden.",
    image: "/images/waschraum.webp",
  },
  {
    title: "Spielplatz und Spieleverleih",
    text: "Kinderspielplatz mit Sandkasten. Bälle, Badminton und mehr können an der Rezeption ausgeliehen werden.",
    image: "/images/spielplatz.webp",
  },
  {
    title: "WLAN und TV-Raum",
    text: "WLAN im gesamten Dorf. Der TV-Raum im Hauptgebäude ist mit dem Schlüssel von der Rezeption nutzbar.",
    image: "/images/wlan-tv-raum.webp",
  },
];

const grundrisse = [
  {
    title: "Übersichtsplan",
    text: "Lageplan des gesamten Feriendorfs",
    image: "/docs/uebersichtsplan-eckenhof.jpg",
    download: "/docs/uebersichtsplan-eckenhof.jpg",
  },
  {
    title: "Ferienhaus Typ A und B",
    text: "Raumaufteilung für bis zu 6 Personen",
    image: "/images/grundriss-typ-ab.webp",
    download: "/docs/grundriss-typ-a.pdf",
  },
  {
    title: "Ferienhaus Typ C",
    text: "Raumaufteilung für 8 bis 10 Personen",
    image: "/images/grundriss-typ-c.webp",
    download: "/docs/grundriss-typ-c.pdf",
  },
  {
    title: "Gästehaus G1 bis G11",
    text: "Raumaufteilung der Gästehäuser",
    image: "/images/grundriss-gaestehaus.webp",
    download: "/docs/grundriss-gaestehaus.pdf",
  },
  {
    title: "Villa II und III",
    text: "Raumaufteilung der Villen",
    image: "/images/grundriss-villa-2-3.webp",
    download: null,
  },
];

export default async function InformationenPage() {
  const event = await getActiveEvent();

  if (!event) {
    return (
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4">
        <p className="text-muted-foreground">Keine aktive Freizeit gefunden.</p>
      </div>
    );
  }

  const documents = await getPublishedDocuments(event.id);
  const registration = getRegistrationInfo(event);
  const arrivalDay = format(new Date(event.start_date), "EEEE, d. MMMM yyyy", { locale: de });
  const departureDay = format(new Date(event.end_date), "EEEE, d. MMMM yyyy", { locale: de });

  return (
    <div>
      {/* Kopfbereich */}
      <section className="border-b bg-secondary/40">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="mx-auto max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              {event.title}
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              Alles Wichtige auf einen Blick
            </h1>
            <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
              Hier finden Sie alle Informationen rund um die Freizeit im Feriendorf Eckenhof
              Schramberg: Anreise, Ausstattung, was Sie mitbringen sollten und die Grundrisse
              der Unterkünfte.
            </p>
            <nav className="mt-6 flex flex-wrap gap-2" aria-label="Abschnitte">
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="rounded-full border bg-card px-3.5 py-1.5 text-sm font-medium text-foreground/80 transition-colors hover:border-primary/40 hover:text-primary"
                >
                  {s.label}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl">
          {/* An- und Abreise */}
          <section id="anreise" className="scroll-mt-24 py-12 md:py-16">
            <SectionTitle
              eyebrow="Ankommen und Abfahren"
              title="An- und Abreise"
            />
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              <TimeCard
                image="/images/anreise.webp"
                title="Anreise"
                day={arrivalDay}
                time="ab 17:00 Uhr"
              />
              <TimeCard
                image="/images/abreise.webp"
                title="Abreise"
                day={departureDay}
                time="bis spätestens 12:00 Uhr"
              />
            </div>
            <div className="mt-5 flex gap-4 rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Car className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">Mit dem Auto</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {event.location_address ?? "Feriendorf Eckenhof, Schramberg-Sulgen"}. Das
                  Feriendorf ist autofrei, Fahrzeuge sind im Dorf nicht erlaubt. Parkplätze
                  befinden sich in der Nähe. Für den Gepäcktransport stehen Bollerwagen zur
                  Verfügung.
                </p>
                {event.location_url && (
                  <a
                    href={event.location_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-sm font-semibold text-primary underline-offset-4 hover:underline"
                  >
                    Route in Google Maps öffnen
                  </a>
                )}
              </div>
            </div>
          </section>

          {/* Ausstattung */}
          <section id="ausstattung" className="scroll-mt-24 border-t py-12 md:py-16">
            <SectionTitle
              eyebrow="In jeder Unterkunft"
              title="Ausstattung der Unterkünfte"
            />
            <div className="mt-8 grid gap-6 md:grid-cols-[1fr_1.15fr] md:items-start">
              <div className="relative aspect-[16/10] overflow-hidden rounded-2xl shadow-md md:aspect-[4/5]">
                <Image
                  src="/images/kueche.webp"
                  alt="Küche im Ferienhaus"
                  fill
                  sizes="(min-width: 768px) 40vw, 100vw"
                  className="object-cover object-center"
                />
              </div>
              <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-1">
                <ChecklistCard title="Vorhanden" items={vorhanden} positive />
                <ChecklistCard title="Nicht vorhanden" items={nichtVorhanden} />
              </div>
            </div>
          </section>

          {/* Mitbringen */}
          <section id="mitbringen" className="scroll-mt-24 border-t py-12 md:py-16">
            <SectionTitle eyebrow="Packliste" title="Bitte mitbringen" />
            <div className="mt-8 grid gap-6 md:grid-cols-[1.15fr_1fr] md:items-start">
              <div className="rounded-2xl border bg-card p-6 shadow-sm">
                <ul className="grid gap-3 sm:grid-cols-2">
                  {mitbringen.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Check className="h-3 w-3" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative aspect-[16/10] overflow-hidden rounded-2xl shadow-md md:aspect-[4/3]">
                <Image
                  src="/images/mitbringen.webp"
                  alt="Küche mit Vorräten"
                  fill
                  sizes="(min-width: 768px) 40vw, 100vw"
                  className="object-cover object-center"
                />
              </div>
            </div>
          </section>

          {/* Gemeinschaftseinrichtungen */}
          <section id="einrichtungen" className="scroll-mt-24 border-t py-12 md:py-16">
            <SectionTitle
              eyebrow="Im Feriendorf"
              title="Gemeinschaftseinrichtungen"
            />
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {einrichtungen.map((e) => (
                <article
                  key={e.title}
                  className="group overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-lg"
                >
                  <div className="relative aspect-[2/1] overflow-hidden">
                    <Image
                      src={e.image}
                      alt={e.title}
                      fill
                      sizes="(min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold">{e.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{e.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* Grundrisse und Dokumente */}
          <section id="grundrisse" className="scroll-mt-24 border-t py-12 md:py-16">
            <SectionTitle
              eyebrow="Zum Anschauen und Herunterladen"
              title="Grundrisse und Dokumente"
            />
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {grundrisse.map((g) => (
                <article
                  key={g.title}
                  className="flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm"
                >
                  <div className="relative aspect-[4/3] bg-white">
                    <Image
                      src={g.image}
                      alt={g.title}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-contain p-3"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-semibold">{g.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{g.text}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <ImagePreview src={g.image} alt={g.title} />
                      {g.download && (
                        <Button asChild variant="outline" size="sm" className="gap-1.5">
                          <a href={g.download} download>
                            <FileDown className="h-4 w-4" />
                            Download
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {documents.length > 0 && (
              <div className="mt-10">
                <h3 className="text-lg font-semibold">Weitere Dokumente</h3>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {documents.map((doc) => (
                    <li key={doc.id}>
                      <a
                        href={doc.file_url}
                        download
                        className="flex items-start gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <FileText className="h-5 w-5" />
                        </span>
                        <span className="min-w-0">
                          <span className="block font-medium">{doc.title}</span>
                          {doc.description && (
                            <span className="mt-0.5 block text-sm text-muted-foreground">
                              {doc.description}
                            </span>
                          )}
                          {doc.file_size_bytes && (
                            <span className="mt-1 block text-xs text-muted-foreground">
                              {formatFileSize(doc.file_size_bytes)}
                            </span>
                          )}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* Abschluss */}
          <section className="border-t py-12 md:py-16">
            <div className="flex flex-col items-center justify-between gap-5 rounded-2xl bg-primary/10 px-6 py-8 text-center md:flex-row md:text-left">
              <div>
                <h2 className="text-xl font-bold">Noch Fragen?</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Schreiben Sie uns an{" "}
                  <a
                    href={`mailto:${event.contact_email}`}
                    className="font-semibold text-primary underline-offset-4 hover:underline"
                  >
                    {event.contact_email}
                  </a>
                  {event.contact_phone && <> oder rufen Sie an: {event.contact_phone}</>}.
                </p>
              </div>
              {registration.status === "open" && (
                <Button asChild size="lg" className="gap-2 shrink-0">
                  <Link href="/anmeldung">
                    Zur Anmeldung
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">{title}</h2>
    </div>
  );
}

function TimeCard({
  image,
  title,
  day,
  time,
}: {
  image: string;
  title: string;
  day: string;
  time: string;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="relative aspect-[2/1]">
        <Image
          src={image}
          alt={title}
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
      <div className="p-5">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{day}</p>
        <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
          <Clock className="h-4 w-4" />
          {time}
        </p>
      </div>
    </article>
  );
}

function ChecklistCard({
  title,
  items,
  positive = false,
}: {
  title: string;
  items: string[];
  positive?: boolean;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <h3 className="font-semibold">{title}</h3>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed">
            <span
              className={
                positive
                  ? "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
                  : "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
              }
            >
              {positive ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
            </span>
            <span className={positive ? "" : "text-muted-foreground"}>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
