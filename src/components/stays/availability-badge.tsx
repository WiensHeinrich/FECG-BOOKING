import { availabilityLevel, type AvailabilityLevel } from "@/lib/utils/stay";
import { cn } from "@/lib/utils";

const STYLES: Record<AvailabilityLevel, { box: string; dot: string }> = {
  frei: { box: "bg-[#e1f2e7] text-[#17633c]", dot: "bg-[#2e9e62]" },
  knapp: { box: "bg-[#fdebd2] text-[#8f4a00]", dot: "bg-[#f08c00]" },
  voll: { box: "bg-[#fbe1de] text-[#a1211a]", dot: "bg-[#d93a30]" },
};

interface AvailabilityBadgeProps {
  /** freie Unterkünfte dieser Art */
  free: number;
  total: number;
  /** eigener Text statt "3 von 12 frei" */
  label?: string;
  /** Farbe fest vorgeben, zum Beispiel für ein einzelnes Haus */
  level?: AvailabilityLevel;
  className?: string;
}

/** Farbige Marke: grün = frei, orange = fast ausgebucht, rot = ausgebucht */
export function AvailabilityBadge({ free, total, label, level, className }: AvailabilityBadgeProps) {
  const lvl = level ?? availabilityLevel(free, total);
  const text =
    label ??
    (lvl === "voll"
      ? "Ausgebucht"
      : lvl === "knapp"
        ? free === 1
          ? "Fast ausgebucht: nur noch 1 frei"
          : `Fast ausgebucht: noch ${free} frei`
        : total === 1
          ? "Frei"
          : `${free} von ${total} frei`);
  const style = STYLES[lvl];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-[2px] text-[13px] font-semibold normal-case leading-[1.45] tracking-normal",
        style.box,
        className
      )}
    >
      <span className={cn("h-2 w-2 shrink-0 rounded-full", style.dot)} aria-hidden="true" />
      {text}
    </span>
  );
}
