"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, FileDown, X } from "lucide-react";
import type { Availability, HouseType } from "@/lib/types/database";
import { formatCurrency } from "@/lib/utils/format";
import { getFloorPlan } from "@/lib/config/floor-plans";
import type { PricingRates } from "@/lib/utils/pricing";
import { StayCard } from "./stay-card";
import { ShareHint } from "./share-hint";
import { availabilityState, nightsLabel } from "@/lib/utils/stay";

interface StayComparisonProps {
  houseTypes: HouseType[];
  availability: Availability[] | null;
  rates: PricingRates;
  nights: number;
  /** Buchungsmodus: Auswahl per Rückruf statt Link */
  selectedId?: string | null;
  onSelect?: (houseType: HouseType) => void;
  /** Überschrift des Vergleichsabschnitts */
  title?: string;
  showFilter?: boolean;
  /** Ziel der Auswahl im Link-Modus */
  selectHref?: (houseType: HouseType) => string;
}

export function StayComparison({
  houseTypes,
  availability,
  rates,
  nights,
  selectedId = null,
  onSelect,
  title = "Unterkünfte vergleichen",
  showFilter = true,
  selectHref = (ht) => `/anmeldung?unterkunft=${encodeURIComponent(ht.slug)}`,
}: StayComparisonProps) {
  const [persons, setPersons] = useState<number | "all">("all");
  const [detailId, setDetailId] = useState<string | null>(null);
  const detailRef = useRef<HTMLElement>(null);

  const maxPersons = useMemo(
    () => Math.max(1, ...houseTypes.map((ht) => ht.max_guests + rates.maxExtraBeds)),
    [houseTypes, rates.maxExtraBeds]
  );

  // Belegungsregel: mindestens max_guests - 1, höchstens max_guests + Zustellbetten
  const visible = houseTypes.filter((ht) => {
    if (persons === "all") return true;
    const min = Math.max(ht.max_guests - 1, 1);
    const max = ht.max_guests + rates.maxExtraBeds;
    return persons >= min && persons <= max;
  });

  /** Bei gewählter Personenzahl sagen, ob Betten frei bleiben oder Zustellbetten gebraucht werden */
  const fitNote = (ht: HouseType): string | null => {
    if (persons === "all") return null;
    const extra = persons - ht.max_guests;
    if (extra > 0) {
      return `Für ${persons} Personen mit ${extra} ${extra === 1 ? "Zustellbett" : "Zustellbetten"} (${formatCurrency(rates.extraBedPricePerDay)} pro Bett und Tag)`;
    }
    if (extra < 0) return `Für ${persons} Personen, ein Bett bleibt frei`;
    return `Passt genau für ${persons} Personen`;
  };

  const availableFor = (id: string): number | null => {
    if (!availability) return null;
    return availability.find((a) => a.house_type_id === id)?.available_count ?? 0;
  };

  const detail = houseTypes.find((ht) => ht.id === detailId) ?? null;

  useEffect(() => {
    if (detail && detailRef.current) {
      detailRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [detail]);

  return (
    <div>
      <div className="mb-[22px] flex flex-col items-start gap-[17px] wide:flex-row wide:items-end wide:justify-between">
        <div>
          <h2 className="display-2">{title}</h2>
          <p className="text-small mt-[10px]">
            Hauspreise für {nightsLabel(nights)} inklusive Endreinigung und Anteil an Großküche und
            Gemeinschaftsräumen, zuzüglich Kurtaxe. Die Auswahl nehmt ihr direkt mit in die Anmeldung.
          </p>
        </div>
        {showFilter && (
          <label className="flex shrink-0 items-center gap-[10px] text-[15px]">
            Personenzahl
            <select
              className="field-input min-h-[44px] w-auto"
              value={persons === "all" ? "all" : String(persons)}
              onChange={(e) =>
                setPersons(e.target.value === "all" ? "all" : Number(e.target.value))
              }
            >
              <option value="all">Alle anzeigen</option>
              {Array.from({ length: maxPersons }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? "Person" : "Personen"}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {showFilter && (
        <ShareHint className="mb-[18px]">
          Über die Personenzahl seht ihr, welche Unterkunft für euch passt.
        </ShareHint>
      )}

      {!availability && (
        <p className="mb-4 rounded-lg bg-sage px-4 py-3 text-[15px] text-foreground">
          Die Verfügbarkeit ist gerade nicht abrufbar. Ihr könnt trotzdem vergleichen, die
          Anmeldung prüft die Verfügbarkeit beim Absenden.
        </p>
      )}

      {visible.length === 0 ? (
        <p className="rounded-2xl border border-border bg-card p-6 text-[16px] text-muted-foreground">
          Für {persons} Personen passt keine einzelne Unterkunft. Verteilt euch auf mehrere
          Unterkünfte oder wählt eine größere Personenzahl mit Zustellbetten.
        </p>
      ) : (
        <div className="grid gap-4 wide:grid-cols-3">
          {visible.map((ht) => (
            <StayCard
              key={ht.id}
              houseType={ht}
              availableCount={availableFor(ht.id)}
              nights={nights}
              selected={selectedId === ht.id}
              onSelect={onSelect ? () => onSelect(ht) : undefined}
              selectHref={onSelect ? undefined : selectHref(ht)}
              onDetails={() => setDetailId(detailId === ht.id ? null : ht.id)}
              detailsOpen={detailId === ht.id}
              fitNote={fitNote(ht)}
            />
          ))}
        </div>
      )}

      {detail && (
        <section
          ref={detailRef}
          aria-label={`Ausstattung ${detail.name}`}
          className="mt-6 rounded-2xl border border-primary bg-card p-5 wide:p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="kicker mb-2">Ausstattung</p>
              <h3 className="panel-title">{detail.name}</h3>
            </div>
            <button
              type="button"
              onClick={() => setDetailId(null)}
              aria-label="Ausstattung schließen"
              className="rounded-md p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          {detail.description && (
            <p className="mt-3 max-w-[70ch] text-[16px] leading-relaxed text-muted-foreground">
              {detail.description}
            </p>
          )}

          {detail.features.length > 0 && (
            <ul className="mt-4 grid gap-x-6 gap-y-1.5 text-[16px] wide:grid-cols-2">
              {detail.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                  {f}
                </li>
              ))}
            </ul>
          )}

          <dl className="mt-5 grid gap-x-8 gap-y-2 border-t border-border pt-4 text-[15px] wide:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">Belegung</dt>
              <dd>
                {Math.max(detail.max_guests - 1, 1)} bis {detail.max_guests} Personen
                {rates.maxExtraBeds > 0 && (
                  <>
                    , mit Zustellbett bis {detail.max_guests + rates.maxExtraBeds}
                  </>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Hauspreis</dt>
              <dd>
                {formatCurrency(detail.price_per_house)} für {nightsLabel(nights)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Kurtaxe</dt>
              <dd>
                {formatCurrency(rates.adultRate)} ab {rates.adultMinAge} J.,{" "}
                {formatCurrency(rates.childRate)} von {rates.childMinAge} bis {rates.adultMinAge - 1} J., pro Person und Tag
              </dd>
            </div>
          </dl>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            {onSelect ? (
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  onSelect(detail);
                  setDetailId(null);
                }}
              >
                Mit dieser Unterkunft weiter
                <ArrowRight className="h-[17px] w-[17px]" aria-hidden="true" />
              </button>
            ) : (
              <Link href={selectHref(detail)} className="btn-primary">
                {availabilityState(availableFor(detail.id)) === "soldout"
                  ? "Auf Warteliste setzen"
                  : "Mit dieser Unterkunft weiter"}
                <ArrowRight className="h-[17px] w-[17px]" aria-hidden="true" />
              </Link>
            )}
            {getFloorPlan(detail.slug) && (
              <a
                href={getFloorPlan(detail.slug) ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
              >
                <FileDown className="h-[17px] w-[17px]" aria-hidden="true" />
                {getFloorPlan(detail.slug)?.endsWith(".pdf") ? "Grundriss (PDF)" : "Grundriss ansehen"}
              </a>
            )}
            <Link href="/informationen#grundrisse" className="text-link">
              Alle Grundrisse und Pläne
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
