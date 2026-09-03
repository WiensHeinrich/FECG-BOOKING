import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, Info, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Event } from "@/lib/types/database";
import { formatDateRange } from "@/lib/utils/format";
import type { RegistrationStatus } from "@/lib/utils/registration";

interface HeroProps {
  event: Event;
  status: RegistrationStatus;
  daysUntilStart: number;
}

export function Hero({ event, status, daysUntilStart }: HeroProps) {
  return (
    <section className="relative isolate overflow-hidden bg-[oklch(0.25_0.04_55)] text-white">
      <Image
        src="/images/anreise.webp"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/30" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.45),transparent_65%)]" />

      <div className="container relative mx-auto flex min-h-[560px] flex-col items-center justify-center px-4 py-20 text-center md:min-h-[680px] md:py-28">
        <p className="rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] backdrop-blur-sm sm:text-xs">
          Gemeinsam. Glauben. Erleben.
        </p>

        <h1 className="mt-6 text-4xl font-bold tracking-tight drop-shadow-md sm:text-5xl md:text-6xl lg:text-7xl">
          {event.title}
        </h1>

        {event.description && (
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/85 md:text-lg">
            {event.description}
          </p>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm font-medium">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 backdrop-blur-sm">
            <CalendarDays className="h-4 w-4" />
            {formatDateRange(event.start_date, event.end_date)}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 backdrop-blur-sm">
            <MapPin className="h-4 w-4" />
            {event.location}
          </span>
        </div>

        <div className="mt-8 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
          {status === "open" && (
            <Button
              asChild
              size="lg"
              className="w-full gap-2 px-8 text-base shadow-lg shadow-black/30 sm:w-auto"
            >
              <Link href="/anmeldung">
                Jetzt anmelden
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
          <Button
            asChild
            size="lg"
            variant="outline"
            className="w-full gap-2 border-white/40 bg-white/10 px-8 text-base text-white backdrop-blur-sm hover:bg-white/20 hover:text-white sm:w-auto"
          >
            <Link href="/informationen">
              <Info className="h-4 w-4" />
              Alle Informationen
            </Link>
          </Button>
        </div>

        {daysUntilStart > 0 && (
          <p className="mt-8 text-sm text-white/70">
            Noch{" "}
            <span className="font-semibold text-white">
              {daysUntilStart} {daysUntilStart === 1 ? "Tag" : "Tage"}
            </span>{" "}
            bis zur Freizeit
          </p>
        )}
      </div>
    </section>
  );
}
