import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, Car, HelpCircle, Luggage, MapPin, UsersRound } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import type { Availability, Event, HouseType } from "@/lib/types/database";
import { formatDateRange } from "@/lib/utils/format";
import { SectionHead } from "@/components/site/section";
import { StayCard } from "@/components/stays/stay-card";
import { nightsLabel } from "@/lib/utils/stay";
import { siteConfig } from "@/lib/config/site";

/** 7.1 Einstieg: Überschrift, großes Bild, Eckdaten darunter */
export function Hero({ event, nights }: { event: Event; nights: number }) {
  const weekday = (date: string) => format(new Date(date), "EEEE", { locale: de });
  const isEckenhof = event.location.includes("Eckenhof");
  const facts = [
    {
      icon: CalendarDays,
      title: formatDateRange(event.start_date, event.end_date),
      text: `${weekday(event.start_date)} bis ${weekday(event.end_date)} · ${nightsLabel(nights)}`,
    },
    {
      icon: MapPin,
      title: isEckenhof ? "Feriendorf Eckenhof" : event.location,
      text: isEckenhof ? "Schramberg-Sulgen · Schwarzwald" : "",
    },
    {
      icon: UsersRound,
      title: "Alle Generationen",
      text: "Als Gemeinde gemeinsam unterwegs",
    },
  ];

  return (
    <section>
      <div className="site-container grid gap-[20px] pb-[26px] pt-[30px] wide:grid-cols-[1.2fr_1fr] wide:items-end wide:gap-10 wide:pb-[34px] wide:pt-[46px]">
        <div>
          <p className="kicker mb-[14px]">{siteConfig.slogan}</p>
          <h1 className="display-1">
            Ein Wochenende.
            <br />
            <em className="text-[#86632e]">Zeit füreinander.</em>
          </h1>
        </div>
        <div className="wide:pb-[6px]">
          <p className="max-w-[40ch] text-[18px] leading-[1.75] text-muted-foreground">
            Raus aus dem Alltag, rein in die Gemeinschaft. Ein Wochenende für Gott, für die Familie
            und für uns als Gemeinde.
          </p>
          <Link href="/unterkuenfte" className="btn-primary mt-5">
            Eure Unterkunft finden
            <ArrowRight className="h-[17px] w-[17px]" aria-hidden="true" />
          </Link>
          <p className="text-small mt-3">
            {event.title} der {siteConfig.church}
          </p>
        </div>
      </div>

      <div className="site-container">
        <Image
          src="/images/anreise.webp"
          alt="Eine Familie geht von hinten gesehen auf einem Wiesenweg am Waldrand."
          width={1536}
          height={1024}
          priority
          sizes="(min-width: 1120px) 1060px, 100vw"
          className="h-[300px] w-full rounded-[4px_4px_42px_4px] object-cover object-[65%_70%] wide:h-[400px] wide:rounded-[4px_4px_52px_4px] wide:object-[50%_75%] min-[1100px]:h-[440px]"
        />
        <div className="grid gap-[18px] border-b border-border py-6 wide:grid-cols-[1fr_1.1fr_1fr] wide:gap-6">
          {facts.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-start gap-3">
              <Icon className="mt-[5px] h-[19px] w-[19px] shrink-0 text-primary" aria-hidden="true" />
              <div>
                <strong className="block text-[18px] font-medium leading-[1.5]">{title}</strong>
                {text && <span className="block text-[16px] text-muted-foreground">{text}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** 7.3 Unterkunftsvorschau: die ersten drei Typen laut Sortierung */
export function StaysPreview({
  houseTypes,
  availability,
  nights,
}: {
  houseTypes: HouseType[];
  availability: Availability[] | null;
  nights: number;
}) {
  // Je Größe nur ein Beispiel, damit die Vorschau die Bandbreite zeigt (z. B. 6, 10 und 5 Personen)
  const preview = houseTypes
    .filter((ht, i) => houseTypes.findIndex((o) => o.max_guests === ht.max_guests) === i)
    .slice(0, 3);
  if (preview.length === 0) return null;

  return (
    <section className="site-container py-[30px] wide:py-[37px]">
      <SectionHead
        kicker="Euer Platz im Feriendorf"
        title="Ein Zuhause für das Wochenende."
        text={`Hauspreise für ${nightsLabel(nights)}, zuzüglich Kurtaxe.`}
        aside={
          <Link href="/unterkuenfte" className="text-link shrink-0">
            Alle Unterkünfte ansehen →
          </Link>
        }
      />
      <div className="grid gap-4 wide:grid-cols-3">
        {preview.map((ht) => (
          <StayCard
            key={ht.id}
            houseType={ht}
            availableCount={
              availability ? (availability.find((a) => a.house_type_id === ht.id)?.available_count ?? 0) : null
            }
            nights={nights}
            selectHref={`/anmeldung?unterkunft=${encodeURIComponent(ht.slug)}`}
            detailsHref="/unterkuenfte"
          />
        ))}
      </div>
    </section>
  );
}

/** 7.4 Erlebnisabschnitt: vier Reihen, Bild und Text wechseln die Seite */
export function Experiences() {
  const items = [
    {
      kicker: "Was uns verbindet",
      title: "Zeit, die gut tut.",
      text: "Den Alltag für ein paar Tage hinter sich lassen. Zeit haben für ein gutes Gespräch, für gemeinsame Wege und für das, was uns im Glauben verbindet.",
      image: "/images/gemeinschaft-szene.webp",
      alt: "Blick über die Schultern einer Gruppe beim gemeinsamen Essen im Grünen.",
    },
    {
      title: "Glauben gemeinsam leben",
      text: "Gottesdienste, Lobpreis und Zeit für das, was uns trägt.",
      image: "/images/lobpreis.webp",
      alt: "Eine Gruppe von hinten beim gemeinsamen Musizieren mit einer akustischen Gitarre.",
    },
    {
      title: "Draußen durchatmen",
      text: "Den Schwarzwald entdecken und den Alltag hinter sich lassen.",
      image: "/images/wanderung.webp",
      alt: "Eine Gruppe mehrerer Generationen wandert von hinten gesehen durch den Wald.",
    },
    {
      title: "Einfach zusammen sein",
      text: "Gespräche, Lagerfeuer und Begegnungen über alle Generationen hinweg.",
      image: "/images/lagerfeuer.webp",
      alt: "Eine Familie sitzt von hinten gesehen gemeinsam an einem Lagerfeuer.",
    },
  ];
  const titleClass = "font-serif text-[34px] font-medium leading-[1.1] tracking-[-0.02em] wide:text-[42px]";

  return (
    <section className="bg-band py-[34px] wide:py-[52px]">
      <div className="site-container grid gap-[38px] wide:gap-[52px]">
        {items.map(({ kicker, title, text, image, alt }, i) => {
          const imageRight = i % 2 === 1;
          return (
            <article key={title} className="grid items-center gap-[18px] wide:grid-cols-2 wide:gap-[48px]">
              <Image
                src={image}
                alt={alt}
                width={1200}
                height={800}
                sizes="(min-width: 721px) 50vw, 100vw"
                className={
                  imageRight
                    ? "aspect-[3/2] w-full rounded-[16px_16px_16px_48px] object-cover wide:order-2"
                    : "aspect-[3/2] w-full rounded-[16px_16px_48px_16px] object-cover"
                }
              />
              <div className={imageRight ? "wide:order-1" : undefined}>
                {kicker && <p className="kicker mb-[11px]">{kicker}</p>}
                {i === 0 ? <h2 className={titleClass}>{title}</h2> : <h3 className={titleClass}>{title}</h3>}
                <p className="mt-[12px] max-w-[42ch] text-[17px] leading-[1.7] text-muted-foreground wide:mt-[14px] wide:text-[18px]">
                  {text}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

/** 7.5 Bibelvers */
export function Verse() {
  return (
    <section className="border-b border-border px-6 py-8 text-center">
      <blockquote className="mx-auto mb-2 max-w-[650px] font-serif text-[clamp(28px,3.8vw,38px)] font-medium leading-[1.3] tracking-[-0.01em] text-foreground">
        „Wo zwei oder drei versammelt sind in meinem Namen, da bin ich mitten unter ihnen.“
      </blockquote>
      <p className="text-small">Matthäus 18,20</p>
    </section>
  );
}

/** 7.6 Gut vorbereitet */
export function Prepared({ arrival, departure }: { arrival: string; departure: string }) {
  const items = [
    {
      icon: Car,
      title: "Anreise und Abreise",
      text: `Freitag ab ${arrival} ankommen. Sonntag bis ${departure} abreisen.`,
      link: { href: "/informationen#anreise", label: "Anreise ansehen →" },
    },
    {
      icon: Luggage,
      title: "Was kommt ins Gepäck?",
      text: "Bettwäsche ist dabei. Handtücher und persönliche Dinge bringt ihr mit.",
      link: { href: "/informationen#mitbringen", label: "Zur Packliste →" },
    },
    {
      icon: HelpCircle,
      title: "Noch eine Frage?",
      text: "Unterkünfte, Zahlung und Organisation verständlich erklärt.",
      link: { href: "/informationen#faq", label: "Antworten finden →" },
    },
  ];
  return (
    <section className="site-container py-[30px] wide:py-[37px]">
      <p className="kicker mb-[13px]">Gut vorbereitet</p>
      <h2 className="display-2">Alles Wichtige. Ohne langes Suchen.</h2>
      <div className="mt-6 grid gap-6 wide:grid-cols-3 wide:gap-[25px]">
        {items.map(({ icon: Icon, title, text, link }) => (
          <article key={title} className="border-b border-border pb-5 wide:border-0 wide:pb-0">
            <Icon className="mb-3 h-[22px] w-[22px] text-primary" aria-hidden="true" />
            <h3 className="mb-[7px] text-[17px] font-semibold">{title}</h3>
            <p className="text-small">{text}</p>
            <Link href={link.href} className="text-link mt-2 inline-block">
              {link.label}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

/** 7.7 Abschlussfläche */
export function ClosingCta({
  title,
  text,
  href,
  label,
}: {
  title: string;
  text: string;
  href: string;
  label: string;
}) {
  return (
    <div className="site-container pb-[25px] wide:pb-[30px]">
      <div className="flex flex-col items-start gap-[18px] rounded-2xl bg-sage p-[22px] wide:flex-row wide:items-center wide:justify-between wide:gap-6 wide:p-[25px]">
        <div>
          <h2 className="cta-title">{title}</h2>
          <p className="text-small mt-2">{text}</p>
        </div>
        <Link href={href} className="btn-primary shrink-0">
          {label}
          <ArrowRight className="h-[17px] w-[17px]" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
