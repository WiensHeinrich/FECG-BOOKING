import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Car, Check, Clock, FileDown, FileText, MapPin, X } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { ImagePreview } from "@/components/ui/image-preview";
import { PageHead } from "@/components/site/section";
import { CoverImage } from "@/components/site/cover-image";
import { getActiveEvent } from "@/lib/queries/events";
import { getPublishedDocuments } from "@/lib/queries/documents";
import { formatCurrency, formatFileSize } from "@/lib/utils/format";
import { ratesFromEvent } from "@/lib/utils/pricing";
import { ARRIVAL_TIME_LONG, DEPARTURE_TIME_LONG } from "@/lib/config/stay-times";

export const metadata: Metadata = {
  title: "Gut zu wissen",
  description:
    "Anreise, Abreise, Zahlung, Ausstattung der Unterkünfte, Packliste, Gemeinschaftseinrichtungen und Grundrisse für die Gemeindefreizeit im Feriendorf Eckenhof Schramberg.",
};

// Angaben laut "Häufig gestellte Fragen Gruppen", Belegungsvereinbarung und Grundrissen des Feriendorfs
const vorhanden = [
  "Kaffeemaschine und Wasserkocher (Filtertüten Größe 4 bitte mitbringen)",
  "Kühlschrank ohne Gefrierfach",
  "Geschirr, Besteck und Kochutensilien",
  "Gasherd in den Ferienhäusern, 2-Platten-Herd im Gästehaus",
  "Bettwäsche inklusive",
  "Kinderbett und Kinderstuhl (Bedarf bitte bei der Anmeldung angeben)",
  "Fernseher in den Wohnungen im Gästehaus",
  "WLAN im ganzen Feriendorf",
  "Toaster zum Ausleihen an der Rezeption",
];

const nichtVorhanden = [
  "Backofen und Spülmaschine (nur in den Ferienhäusern Typ C)",
  "Gefrierfach",
  "Fernseher in den Ferienhäusern (TV-Raum im Haupthaus)",
  "Handtücher und Seife",
  "Elektrogrill: Auf Terrasse und Balkon darf nur elektrisch gegrillt werden, für alle gibt es den überdachten Grillplatz",
];

const mitbringen = [
  "Handtücher und Seife",
  "Geschirrtücher und Putzlappen",
  "Spülmittel, für Typ C auch Spültabs",
  "Müllbeutel",
  "Toilettenpapier",
  "Filtertüten Größe 4 für die Kaffeemaschine",
  "Sandspielzeug für den Sandkasten",
];

const einrichtungen = [
  {
    title: "Großer Grillplatz",
    text: "Überdachter Grillplatz auf dem Gelände, der allen Gästen offensteht. Ideal für gemeinsame Abende.",
    image: "/images/grill-v3.webp",
    alt: "Zwei Personen von hinten beim gemeinsamen Grillen im Grünen.",
    position: "object-[50%_5%]",
  },
  {
    title: "Waschraum",
    text: "Münzwaschmaschine und Trockner im Haupthaus. Waschmünzen gibt es für 3,50 € an der Rezeption, Waschmittel ist vorhanden. Bügelbrett und Bügeleisen stehen bereit.",
    image: "/images/waschraum.webp",
    alt: "Waschmaschine und Wäschekorb mit gefalteten Handtüchern.",
    position: "object-[65%_60%]",
  },
  {
    title: "Spielplatz und Spieleverleih",
    text: "Kinderspielplatz mit Sandkasten. Bälle (gegen Pfand), Federball und Gesellschaftsspiele könnt ihr an der Rezeption ausleihen.",
    image: "/images/spielplatz-v3.webp",
    alt: "Kinder und Erwachsene von hinten an einem Spielplatz im Grünen.",
    position: "object-[50%_68%]",
  },
  {
    title: "WLAN und TV-Raum",
    text: "WLAN im gesamten Feriendorf. Der TV-Raum im Haupthaus ist mit dem Schlüssel von der Rezeption nutzbar.",
    image: "/images/wlan-tv-raum.webp",
    alt: "Laptop auf einem Holztisch in einer ruhigen Sitzecke.",
    position: "object-[55%_60%]",
  },
];

const grundrisse = [
  {
    title: "Übersichtsplan",
    text: "Lageplan des gesamten Feriendorfs. Zum Anklicken gibt es ihn auf der Seite Unterkünfte.",
    image: "/docs/uebersichtsplan-eckenhof.jpg",
    download: "/docs/uebersichtsplan-eckenhof.jpg",
  },
  {
    title: "Ferienhaus Typ A",
    text: "Häuser 1 bis 4, 6, 7 und 9 bis 14: Elternschlafzimmer und zwei Stockbettzimmer",
    image: "/images/grundriss-typ-a.webp",
    download: "/docs/grundriss-typ-a.pdf",
  },
  {
    title: "Ferienhaus Typ B",
    text: "Häuser 5, 8, 15 und 19 bis 25: drei Doppelbettzimmer",
    image: "/images/grundriss-typ-b.webp",
    download: "/docs/grundriss-typ-b.pdf",
  },
  {
    title: "Ferienhaus Typ C",
    text: "Häuser 16 bis 18: fünf Schlafzimmer für bis zu 10 Personen",
    image: "/images/grundriss-typ-c.webp",
    download: "/docs/grundriss-typ-c.pdf",
  },
  {
    title: "Wohnungen im Gästehaus",
    text: "Elternschlafzimmer, Dreibettzimmer und Wohnzimmer mit Küchenzeile",
    image: "/images/grundriss-gaestehaus.webp",
    download: "/docs/grundriss-gaestehaus.pdf",
  },
  {
    title: "Villa III",
    text: "Zweites Obergeschoss der Villa, die Wohnung Villa 3 liegt rechts im Plan",
    image: "/images/grundriss-villa-2-3.webp",
    download: null,
  },
];

export default async function InformationenPage() {
  const event = await getActiveEvent();

  if (!event) {
    return (
      <div className="site-container flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Keine aktive Freizeit gefunden.</p>
      </div>
    );
  }

  const documents = await getPublishedDocuments(event.id);
  const rates = ratesFromEvent(event);
  const arrivalDay = format(new Date(event.start_date), "EEEE, d. MMMM yyyy", { locale: de });
  const departureDay = format(new Date(event.end_date), "EEEE, d. MMMM yyyy", { locale: de });
  const locationShort = event.location.replace(/^Feriendorf\s+/i, "");

  const faq = [
    {
      q: "Was müssen wir mitbringen?",
      a: (
        <>
          Handtücher, Seife, Geschirrtücher, Putzlappen, Spülmittel, Müllbeutel, Toilettenpapier und
          Filtertüten Größe 4 für die Kaffeemaschine. Bettwäsche ist inklusive.{" "}
          <a href="#mitbringen" className="font-semibold text-primary underline underline-offset-4 hover:text-primary/85">
            Zur vollständigen Packliste
          </a>
        </>
      ),
    },
    {
      q: "Wie bezahlen wir unsere Unterkunft?",
      a: `Hauspreis und Kurtaxe werden zusammen vorab überwiesen. Im Hauspreis sind die Endreinigung und der Anteil an Großküche und Gemeinschaftsräumen enthalten. Nach der Reservierung seht ihr Gesamtbetrag, Bankverbindung und Verwendungszweck auf der Bestätigungsseite und per E-Mail. Die Reservierung bleibt ${event.reservation_validity_days} Tage gültig und wird mit dem Zahlungseingang verbindlich. Die Kurtaxe (${formatCurrency(rates.adultRate)} pro Person und Tag ab ${rates.adultMinAge} Jahren, ${formatCurrency(rates.childRate)} von ${rates.childMinAge} bis ${rates.adultMinAge - 1} Jahren) führt das Freizeitteam gesammelt an das Feriendorf ab.`,
    },
    {
      q: "Wie funktioniert die Anreise ins autofreie Dorf?",
      a: `Für das Navi: ${event.location_address ?? "Dr.-Helmut-Junghans-Straße 50, 78713 Schramberg-Sulgen"}. Das Feriendorf ist ausgeschildert. Parkplätze befinden sich in der Nähe, Fahrzeuge dürfen nicht ins Dorf.`,
    },
    {
      q: "Können wir mit der Bahn anreisen?",
      a: "Ja. Am besten über den Bahnhof Rottweil, von dort fährt der Bus nach Schramberg-Sulgen. Die Haltestelle Sulgen Feriendorf liegt direkt am Dorf, von der Haltestelle Schramberger Straße sind es etwa 10 Minuten zu Fuß. Plant die Verbindung bitte vorher über die Fahrplanauskunft der Bahn.",
    },
    {
      q: "Was ist mit der Verpflegung und dem genauen Programm?",
      a: "Für das Essen sorgt die Gemeinde: Es gibt Frühstück, Mittagessen und Abendessen, die Kosten dafür übernimmt die Gemeinde. Unterkunft und Kurtaxe zahlt jede Familie selbst. Das genaue Programm ergänzt das Freizeitteam rechtzeitig vor der Freizeit.",
    },
    {
      q: "Können wir mit mehr Personen als Betten anreisen?",
      a: `Pro Unterkunft könnt ihr bis zu ${rates.maxExtraBeds} Zustellbetten für ${formatCurrency(rates.extraBedPricePerDay)} pro Bett und Tag dazubuchen. Ein Doppelbett kann auch von zwei Personen genutzt werden, dann ist kein Zustellbett nötig.`,
    },
    {
      q: "Dürfen wir unseren Hund mitbringen?",
      a: "Nein. Hunde sind im Feriendorf aus hygienischen Gründen nicht gestattet.",
    },
    {
      q: "Was ist bei der Abreise zu beachten?",
      a: `Die Unterkünfte bitte ${DEPARTURE_TIME_LONG} räumen und ordentlich hinterlassen. Die abgezogene Bettwäsche bringt ihr zu den Wäschecontainern an der Schwarzwaldstube.`,
    },
  ];

  return (
    <div>
      <PageHead
        kicker="Entspannt vorbereitet"
        title="Gut zu wissen."
        text="Die wichtigsten Antworten zur Freizeit an einem Ort. Kurze Informationen zuerst, Einzelheiten direkt darunter."
      />

      {/* Ankommen, Ziel, Abreise */}
      <section id="anreise" className="site-container scroll-mt-6 py-[30px] wide:py-[37px]">
        <div className="grid gap-6 wide:grid-cols-3 wide:gap-[25px]">
          <article className="border-b border-border pb-5 wide:border-0 wide:pb-0">
            <Clock className="mb-3 h-[22px] w-[22px] text-primary" aria-hidden="true" />
            <h2 className="mb-[7px] text-[17px] font-semibold">Ankommen</h2>
            <p className="text-small">
              {arrivalDay}
              <br />
              {ARRIVAL_TIME_LONG.replace(/^ab/, "Ab")}
            </p>
          </article>
          <article className="border-b border-border pb-5 wide:border-0 wide:pb-0">
            <MapPin className="mb-3 h-[22px] w-[22px] text-primary" aria-hidden="true" />
            <h2 className="mb-[7px] text-[17px] font-semibold">Unser Ziel</h2>
            <p className="text-small">
              {event.location}
              {event.location_address && (
                <>
                  <br />
                  {event.location_address}
                </>
              )}
            </p>
            {event.location_url && (
              <a
                href={event.location_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-link mt-2 inline-block"
              >
                Route in Google Maps öffnen →
              </a>
            )}
          </article>
          <article className="border-b border-border pb-5 wide:border-0 wide:pb-0">
            <Car className="mb-3 h-[22px] w-[22px] text-primary" aria-hidden="true" />
            <h2 className="mb-[7px] text-[17px] font-semibold">Abreise</h2>
            <p className="text-small">
              {departureDay}
              <br />
              {DEPARTURE_TIME_LONG.replace(/^bis/, "Bis")}
            </p>
          </article>
        </div>

        {/* FAQ */}
        <div id="faq" className="mt-7 scroll-mt-6 border-t border-border">
          {faq.map((item) => (
            <details key={item.q} className="group border-b border-border py-[14px] text-[16px]">
              <summary className="cursor-pointer list-none font-semibold marker:content-none [&::-webkit-details-marker]:hidden">
                <span className="mr-2 inline-block text-primary transition-transform group-open:rotate-90" aria-hidden="true">
                  ▸
                </span>
                {item.q}
              </summary>
              <p className="mt-[10px] max-w-[74ch] pl-5 text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Ausstattung */}
      <section id="ausstattung" className="site-container scroll-mt-6 border-t border-border py-[30px] wide:py-[37px]">
        <p className="kicker mb-[9px]">In jeder Unterkunft</p>
        <h2 className="display-2 mb-[22px]">Ausstattung der Unterkünfte</h2>
        <div className="grid gap-5 wide:grid-cols-[1fr_1.15fr] wide:items-start">
          <CoverImage
            src="/images/kueche.webp"
            alt="Filterkaffeemaschine, Geschirr und Besteck auf einer Holzarbeitsfläche."
            sizes="(min-width: 1120px) 480px, (min-width: 721px) 45vw, 100vw"
            className="h-[220px] rounded-2xl wide:h-[420px]"
            imageClassName="object-[25%_55%]"
          />
          <div className="grid gap-4 sm:grid-cols-2 wide:grid-cols-1">
            <Checklist title="Vorhanden" items={vorhanden} positive />
            <Checklist title="Nicht vorhanden" items={nichtVorhanden} />
          </div>
        </div>
      </section>

      {/* Packliste */}
      <section id="mitbringen" className="site-container scroll-mt-6 border-t border-border py-[30px] wide:py-[37px]">
        <p className="kicker mb-[9px]">Packliste</p>
        <h2 className="display-2 mb-[22px]">Was kommt ins Gepäck?</h2>
        <div className="grid gap-5 wide:grid-cols-[1.15fr_1fr] wide:items-start">
          <div className="panel">
            <ul className="grid gap-3 sm:grid-cols-2">
              {mitbringen.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-[16px] leading-relaxed">
                  <Check className="mt-[3px] h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <Image
            src="/images/mitbringen.webp"
            alt="Handtücher, Spültuch, Spülmittel und Kaffeefilter liegen zum Einpacken bereit."
            width={1080}
            height={720}
            sizes="(min-width: 1120px) 470px, (min-width: 721px) 40vw, 100vw"
            className="h-[200px] w-full rounded-2xl object-cover object-[50%_70%] wide:h-[260px]"
          />
        </div>
      </section>

      {/* Gemeinschaftseinrichtungen */}
      <section id="einrichtungen" className="site-container scroll-mt-6 border-t border-border py-[30px] wide:py-[37px]">
        <p className="kicker mb-[9px]">Im Feriendorf</p>
        <h2 className="display-2 mb-[22px]">Gemeinschafts&shy;einrichtungen</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {einrichtungen.map((e) => (
            <article key={e.title} className="overflow-hidden rounded-2xl border border-border bg-card">
              <CoverImage
                src={e.image}
                alt={e.alt}
                sizes="(min-width: 1120px) 525px, (min-width: 640px) 50vw, 100vw"
                className="aspect-[2/1]"
                imageClassName={e.position}
              />
              <div className="p-5">
                <h3 className="text-[19px] font-semibold leading-[1.35]">{e.title}</h3>
                <p className="mt-1.5 text-[15px] leading-[1.7] text-muted-foreground">{e.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Grundrisse und Dokumente */}
      <section id="grundrisse" className="site-container scroll-mt-6 border-t border-border py-[30px] wide:py-[37px]">
        <p className="kicker mb-[9px]">Zum Anschauen und Herunterladen</p>
        <h2 className="display-2 mb-[22px]">Grundrisse und Dokumente</h2>
        <div className="grid gap-4 sm:grid-cols-2 wide:grid-cols-3">
          {grundrisse.map((g) => (
            <article key={g.title} className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
              <div className="relative aspect-[4/3] bg-white">
                <Image
                  src={g.image}
                  alt={g.title}
                  fill
                  sizes="(min-width: 1120px) 345px, (min-width: 721px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-contain p-3"
                />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-[19px] font-semibold leading-[1.35]">{g.title}</h3>
                <p className="mt-1 text-[15px] text-muted-foreground">{g.text}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <ImagePreview src={g.image} alt={g.title} />
                  {g.download && (
                    <a href={g.download} download className="btn-secondary min-h-0 px-3 py-1.5 text-[15px]">
                      <FileDown className="h-4 w-4" aria-hidden="true" />
                      Download
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>

        {documents.length > 0 && (
          <div className="mt-8">
            <h3 className="text-[19px] font-semibold">Weitere Dokumente</h3>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {documents.map((doc) => (
                <li key={doc.id}>
                  <a
                    href={doc.file_url}
                    download
                    className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50"
                  >
                    <FileText className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                    <span className="min-w-0">
                      <span className="block font-medium">{doc.title}</span>
                      {doc.description && (
                        <span className="mt-0.5 block text-[15px] text-muted-foreground">{doc.description}</span>
                      )}
                      {doc.file_size_bytes && (
                        <span className="mt-1 block text-[14px] text-muted-foreground">
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

      <div className="site-container">
        <div className="mb-[25px] flex flex-col items-start gap-[18px] rounded-2xl bg-sage p-[22px] wide:mb-[30px] wide:flex-row wide:items-center wide:justify-between wide:p-[25px]">
          <div>
            <h2 className="cta-title">Noch Fragen?</h2>
            <p className="text-small mt-2">
              <a href={`mailto:${event.contact_email}`} className="hover:text-primary">
                {event.contact_email}
              </a>
              {event.contact_phone && <> · {event.contact_phone}</>}
            </p>
          </div>
          <Link href="/unterkuenfte" className="btn-primary shrink-0">
            Unterkünfte ansehen
            <ArrowRight className="h-[17px] w-[17px]" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function Checklist({ title, items, positive = false }: { title: string; items: string[]; positive?: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h3 className="text-[17px] font-semibold">{title}</h3>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-[16px] leading-relaxed">
            {positive ? (
              <Check className="mt-[3px] h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            ) : (
              <X className="mt-[3px] h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            )}
            <span className={positive ? "" : "text-muted-foreground"}>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
