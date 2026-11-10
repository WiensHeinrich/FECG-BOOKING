"use client";

import Link from "next/link";
import { Check, Users } from "lucide-react";
import type { HouseType } from "@/lib/types/database";
import { formatCurrency } from "@/lib/utils/format";
import { AvailabilityBadge } from "./availability-badge";
import { cn } from "@/lib/utils";

import { availabilityState } from "@/lib/utils/stay";
import { nightsLabel } from "@/lib/utils/stay";

interface StayCardProps {
  houseType: HouseType;
  availableCount: number | null;
  nights: number;
  selected?: boolean;
  /** Auswahl per Button (Anmeldung) */
  onSelect?: () => void;
  /** Auswahl per Link (Startseite, Unterkunftsübersicht) */
  selectHref?: string;
  onDetails?: () => void;
  detailsHref?: string;
  detailsOpen?: boolean;
}

export function StayCard({
  houseType,
  availableCount,
  nights,
  selected = false,
  onSelect,
  selectHref,
  onDetails,
  detailsHref,
  detailsOpen = false,
}: StayCardProps) {
  const state = availabilityState(availableCount);
  const soldOut = state === "soldout";

  const buttonLabel = selected
    ? "Ausgewählt"
    : soldOut
      ? "Auf Warteliste setzen"
      : "Unterkunft auswählen";

  const buttonClass = cn(
    "w-full",
    selected ? "btn-primary" : "btn-secondary"
  );

  return (
    <article
      className={cn(
        "flex min-w-0 flex-col gap-[13px] rounded-2xl border bg-card p-5",
        selected ? "border-primary shadow-[inset_0_0_0_1px_var(--primary)]" : "border-border"
      )}
      aria-current={selected ? "true" : undefined}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-[12px] uppercase tracking-[0.06em] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Users className="h-[17px] w-[17px]" aria-hidden="true" />
          bis zu {houseType.max_guests} Personen
        </span>
        {state !== "unknown" && availableCount !== null && (
          <AvailabilityBadge free={Math.max(availableCount, 0)} total={houseType.total_quantity} />
        )}
        {state === "unknown" && (
          <span className="normal-case tracking-normal">Verfügbarkeit gerade nicht abrufbar</span>
        )}
      </div>

      <h3 className="text-[19px] font-semibold leading-[1.35] text-foreground">{houseType.name}</h3>

      {houseType.description && (
        <p className="flex-1 text-[16px] leading-[1.7] text-muted-foreground wide:text-[15px]">
          {houseType.description}
        </p>
      )}

      <div>
        <p className="text-[30px] leading-[1.3] tracking-[-0.6px] text-foreground">
          {formatCurrency(houseType.price_per_house)}
        </p>
        <p className="mt-[3px] text-[14px] leading-[1.7] text-muted-foreground">
          pro Unterkunft · {nightsLabel(nights)} · zzgl. Kurtaxe
        </p>
      </div>

      {onSelect ? (
        <button type="button" className={buttonClass} onClick={onSelect} aria-pressed={selected}>
          {selected && <Check className="h-[17px] w-[17px]" aria-hidden="true" />}
          {buttonLabel}
        </button>
      ) : (
        <Link href={selectHref ?? "/anmeldung"} className={buttonClass}>
          {buttonLabel}
        </Link>
      )}

      {onDetails ? (
        <button
          type="button"
          onClick={onDetails}
          aria-expanded={detailsOpen}
          className="text-center text-[14px] text-primary underline underline-offset-[3px] hover:text-primary/85"
        >
          {detailsOpen ? "Ausstattung schließen" : "Ausstattung ansehen"}
        </button>
      ) : detailsHref ? (
        <Link
          href={detailsHref}
          className="text-center text-[14px] text-primary underline underline-offset-[3px] hover:text-primary/85"
        >
          Ausstattung ansehen
        </Link>
      ) : null}
    </article>
  );
}
