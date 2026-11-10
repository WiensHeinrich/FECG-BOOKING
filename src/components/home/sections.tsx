import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Car,
  Flame,
  HelpCircle,
  Luggage,
  MapPin,
  Moon,
  Music,
  TreePine,
  Trees,
  Heart,
  Footprints,
} from "lucide-react";
import type { Availability, Event, HouseType } from "@/lib/types/database";
import { formatDateRange } from "@/lib/utils/format";
import { SectionHead } from "@/components/site/section";
import { StayCard } from "@/components/stays/stay-card";
import { nightsLabel } from "@/lib/utils/stay";
import { siteConfig } from "@/lib/config/site";

/** 7.1 Geteilter Einstieg */
export function Hero({ event, nights }: { event: Event; nights: number }) {
  return (
    <section className="site-container grid items-center gap-[26px] pb-[30px] pt-[30px] wide:grid-cols-2 wide:gap-9 wide:pb-[34px] wide:pt-[43px]">
      <div>
        <p className="kicker mb-[13px]">{siteConfig.slogan}</p>
        <h1 className="display-1 mb-5 text-[44px] max-[360px]:text-[36px] wide:text-[clamp(40px,5.6vw,62px)]">
          Ein Wochenende.
          <br />
          Zeit füreinander.
        </h1>
        <p className="max-w-[44ch] text-[18px] leading-[1.75] text-muted-foreground">
          Raus aus dem Alltag, rein in die Gemeinschaft. Ein Wochenende für Gott, für die Familie
          und für uns als Gemeinde.
        </p>
        <div className="my-[23px] grid gap-[10px] text-[15px]">
          <span className="flex items-center gap-[9px]">
            <CalendarDays className="h-[17px] w-[17px] text-primary" aria-hidden="true" />
            <strong>{formatDateRange(event.start_date, event.end_date)}</strong>
            <span className="text-muted-foreground">· {nightsLabel(nights)}</span>
          </span>
          <span className="flex items-center gap-[9px]">
            <MapPin className="h-[17px] w-[17px] text-primary" aria-hidden="true" />
            {event.location}
          </span>
        </div>
        <Link href="/unterkuenfte" className="btn-primary">
          Eure Unterkunft finden
          <ArrowRight className="h-[17px] w-[17px]" aria-hidden="true" />
        </Link>
        <p className="text-small mt-3">
          {event.title} der {siteConfig.church}
        </p>
      </div>

      <div className="relative">
        <Image
          src="/images/anreise.webp"
          alt="Illustration: Ankunft mit dem Bus vor einer Holzhütte im Schwarzwald"
          width={1600}
          height={776}
          priority
          sizes="(min-width: 721px) 50vw, 100vw"
          className="h-[250px] w-full rounded-[65px_15px_15px_15px] object-cover object-center wide:h-[345px] wide:rounded-[95px_18px_18px_18px]"
        />
        <div className="absolute inset-x-[18px] bottom-[18px] flex items-center gap-[10px] rounded-[9px] bg-card px-[15px] py-[11px] text-[14px] shadow-[0_4px_20px_rgba(38,62,54,0.07)]">
          <TreePine className="h-[19px] w-[19px] shrink-0 text-primary" aria-hidden="true" />
          <span>
            Zusammen ankommen.
            <br />
            <strong>Mitten im Schwarzwald.</strong>
          </span>
        </div>
      </div>
    </section>
  );
}

/** 7.2 Faktenstreifen */
export function Benefits({ nights }: { nights: number }) {
  const items = [
    { icon: Moon, text: `${nightsLabel(nights).replace(/^\w/, (c) => c.toUpperCase())} gemeinsam unterwegs` },
    { icon: Footprints, text: "Autofreies Feriendorf" },
    { icon: Heart, text: "Raum für Glauben und Begegnung" },
  ];
  return (
    <div className="site-container">
      <div className="flex flex-wrap justify-between gap-x-[22px] gap-y-3 border-y border-border py-[18px] text-[14px] text-muted-foreground">
        {items.map(({ icon: Icon, text }) => (
          <span key={text} className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
            {text}
          </span>
        ))}
      </div>
    </div>
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
  const preview = houseTypes.slice(0, 3);
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

/** 7.4 Erlebnisabschnitt */
export function Experiences() {
  const items = [
    {
      icon: Music,
      title: "Glauben gemeinsam leben",
      text: "Gottesdienste, Lobpreis und Zeit für das, was uns trägt.",
    },
    {
      icon: Trees,
      title: "Draußen durchatmen",
      text: "Den Schwarzwald entdecken und den Alltag hinter sich lassen.",
    },
    {
      icon: Flame,
      title: "Einfach zusammen sein",
      text: "Gespräche, Lagerfeuer und Begegnungen über alle Generationen hinweg.",
    },
  ];
  return (
    <section className="bg-band py-[27px] wide:py-[34px]">
      <div className="site-container grid items-center gap-[25px] wide:grid-cols-[1.1fr_1fr] wide:gap-[30px]">
        <Image
          src="/images/gemeinschaft-szene.webp"
          alt="Illustration: Gemeinsames Essen und Spielen vor den Holzhäusern des Feriendorfs"
          width={1263}
          height={729}
          sizes="(min-width: 721px) 52vw, 100vw"
          className="h-auto w-full rounded-2xl"
        />
        <div>
          <p className="kicker mb-[13px]">Was uns verbindet</p>
          <h2 className="display-2">Zeit, die gut tut.</h2>
          <div className="mt-[23px] grid gap-[17px]">
            {items.map(({ icon: Icon, title, text }) => (
              <article key={title} className="flex items-start gap-[13px]">
                <Icon className="mt-[3px] h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <h3 className="text-[19px] font-semibold leading-[1.35]">{title}</h3>
                  <p className="mt-1 text-[15px] text-muted-foreground">{text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/** 7.5 Bibelvers */
export function Verse() {
  return (
    <section className="border-b border-border px-6 py-8 text-center">
      <blockquote className="mx-auto mb-2 max-w-[550px] font-serif text-[23px] italic leading-[1.5] text-foreground">
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
          <h2 className="font-serif text-[32px] font-normal leading-[1.15] tracking-[-0.5px]">{title}</h2>
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
