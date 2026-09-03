import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Availability, HouseType } from "@/lib/types/database";
import { formatCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

interface AccommodationsProps {
  houseTypes: HouseType[];
  availability: Availability[];
  registrationOpen: boolean;
}

export function Accommodations({ houseTypes, availability, registrationOpen }: AccommodationsProps) {
  if (houseTypes.length === 0) return null;

  const availableFor = (id: string) =>
    availability.find((a) => a.house_type_id === id)?.available_count ?? 0;

  const totalAvailable = houseTypes.reduce((sum, ht) => sum + availableFor(ht.id), 0);

  return (
    <section className="bg-secondary/40 py-16 md:py-20">
      <div className="container mx-auto px-4">
        <div className="grid items-center gap-10 md:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Unterkünfte
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              Übernachten im Feriendorf
            </h2>
            <p className="mt-4 max-w-xl leading-relaxed text-muted-foreground">
              Alle Unterkünfte liegen im autofreien Feriendorf Eckenhof mitten im Schwarzwald.
              Vom Ferienhaus für die ganze Familie bis zum Apartment für zwei: Jede Unterkunft hat
              eine eigene Küche, ein Bad und WLAN. Bettwäsche ist inklusive.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Preise gelten pro Unterkunft für das gesamte Wochenende, zuzüglich Kurtaxe.
              {totalAvailable > 0 && (
                <>
                  {" "}
                  Aktuell sind noch{" "}
                  <span className="font-semibold text-foreground">{totalAvailable} Unterkünfte</span>{" "}
                  frei.
                </>
              )}
            </p>
          </div>
          <div className="relative mx-auto aspect-[4/3] w-full max-w-md overflow-hidden rounded-2xl shadow-lg">
            <Image
              src="/images/ferienhaus.webp"
              alt="Ferienhaus im Feriendorf Eckenhof"
              fill
              sizes="(min-width: 768px) 40vw, 100vw"
              className="object-cover object-center"
            />
          </div>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {houseTypes.map((ht) => {
            const free = availableFor(ht.id);
            const soldOut = free <= 0;
            const scarce = !soldOut && free <= 2;
            return (
              <div
                key={ht.id}
                className={cn(
                  "flex flex-col rounded-2xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md",
                  soldOut && "opacity-75"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-semibold leading-snug">{ht.name}</h3>
                  <Badge
                    variant="outline"
                    className={cn(
                      "shrink-0 text-xs",
                      soldOut && "border-border bg-muted text-muted-foreground",
                      scarce && "border-amber-300 bg-amber-50 text-amber-800",
                      !soldOut && !scarce && "border-primary/25 bg-primary/10 text-primary"
                    )}
                  >
                    {soldOut ? "Ausgebucht" : scarce ? `Nur noch ${free} frei` : `${free} frei`}
                  </Badge>
                </div>

                {ht.description && (
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {ht.description}
                  </p>
                )}

                <div className="mt-4 flex items-end justify-between border-t pt-4">
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    bis {ht.max_guests} Personen
                  </span>
                  <div className="text-right">
                    <p className="text-lg font-semibold">{formatCurrency(ht.price_per_house)}</p>
                    <p className="text-[11px] text-muted-foreground">pro Haus, zzgl. Kurtaxe</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <Button asChild size="lg" className="gap-2">
            <Link href={registrationOpen ? "/anmeldung" : "/informationen"}>
              {registrationOpen ? "Unterkunft reservieren" : "Mehr zu den Unterkünften"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
