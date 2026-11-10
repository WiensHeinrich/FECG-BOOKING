"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import { nightsLabel } from "@/lib/utils/stay";
import { getFloorPlan } from "@/lib/config/floor-plans";
import type { Availability, HouseType } from "@/lib/types/database";
import { cn } from "@/lib/utils";

type GroupKey = "a" | "b" | "c" | "g" | "v";

interface Group {
  key: GroupKey;
  /** Unterkunftstypen (Slug aus der Datenbank), die an dieser Stelle liegen */
  slugs: string[];
  /** Überschrift, wenn mehrere Typen in einem Gebäude liegen */
  title?: string;
  where: string;
  color: string;
}

/** Zuordnung laut Belegungsvereinbarung und Übersichtsplan des Feriendorfs */
const GROUPS: Group[] = [
  { key: "a", slugs: ["ferienhaus-typ-a"], where: "Häuser 1 bis 4, 6, 7 und 9 bis 14", color: "#38bdf8" },
  { key: "b", slugs: ["ferienhaus-typ-b"], where: "Häuser 5, 8, 15 und 19 bis 25", color: "#facc15" },
  { key: "c", slugs: ["ferienhaus-typ-c"], where: "Häuser 16 bis 18", color: "#f472b6" },
  {
    key: "g",
    slugs: ["gaestehaus-g1-10", "gaestehaus-g11"],
    title: "Gästehaus",
    where: "Wohnungen G1 bis G11, unten im Plan",
    color: "#4ade80",
  },
  { key: "v", slugs: ["villa-iii"], where: "Wohnung in der Villa am Haupthaus", color: "#c084fc" },
];

interface Spot {
  id: string;
  label: string;
  group: GroupKey;
  /** Mittelpunkt in Prozent der Planbreite und Planhöhe */
  x: number;
  y: number;
  /** Durchmesser in Prozent der Planbreite */
  size?: number;
}

const house = (n: number, group: GroupKey, x: number, y: number): Spot => ({
  id: String(n),
  label: `Haus ${n}`,
  group,
  x,
  y,
});

const SPOTS: Spot[] = [
  house(1, "a", 34.83, 73.08),
  house(2, "a", 37.31, 74.06),
  house(3, "a", 39.91, 75.31),
  house(4, "a", 42.27, 76.15),
  house(5, "b", 44.98, 77.27),
  house(6, "a", 54.31, 75.17),
  house(7, "a", 56.2, 76.85),
  house(8, "b", 58.56, 78.94),
  house(9, "a", 53.25, 61.37),
  house(10, "a", 51.36, 59.55),
  house(11, "a", 49.35, 57.74),
  house(12, "a", 47.34, 56.07),
  house(13, "a", 43.68, 51.6),
  house(14, "a", 41.56, 49.79),
  house(15, "b", 39.2, 47.84),
  house(16, "c", 36.48, 27.62),
  house(17, "c", 39.91, 30.68),
  house(18, "c", 43.21, 33.89),
  house(19, "b", 47.23, 40.45),
  house(20, "b", 49.94, 36.54),
  house(21, "b", 52.66, 32.5),
  house(22, "b", 60.21, 50.49),
  house(23, "b", 64.11, 52.44),
  house(24, "b", 68.24, 53.84),
  house(25, "b", 67.77, 62.76),
  { id: "gaestehaus", label: "Gästehaus", group: "g", x: 45.81, y: 93.17, size: 11 },
  { id: "villa", label: "Villa", group: "v", x: 25.38, y: 76.01, size: 7.6 },
];

interface SitePlanProps {
  houseTypes: HouseType[];
  availability: Availability[] | null;
  nights: number;
}

export function SitePlan({ houseTypes, availability, nights }: SitePlanProps) {
  const [activeGroup, setActiveGroup] = useState<GroupKey | null>(null);
  const [activeSpot, setActiveSpot] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auf dem Handy ist der Plan breiter als der Bildschirm: so verschieben, dass die Häuser zu sehen sind
  useEffect(() => {
    const el = scrollRef.current;
    if (el && el.scrollWidth > el.clientWidth) {
      el.scrollLeft = el.scrollWidth * 0.47 - el.clientWidth / 2;
    }
  }, []);

  const typesOf = (group: Group) =>
    group.slugs
      .map((slug) => houseTypes.find((ht) => ht.slug === slug))
      .filter((ht): ht is HouseType => Boolean(ht));

  // Nur Gruppen zeigen, die es bei dieser Freizeit gibt
  const groups = GROUPS.filter((g) => typesOf(g).length > 0);
  const groupByKey = new Map(groups.map((g) => [g.key, g]));
  const spots = SPOTS.filter((s) => groupByKey.has(s.group));

  const titleOf = (group: Group) => group.title ?? typesOf(group)[0]?.name ?? "";
  const spot = spots.find((s) => s.id === activeSpot) ?? null;

  function availabilityText(ht: HouseType) {
    const a = availability?.find((x) => x.house_type_id === ht.id);
    if (!a) return null;
    if (a.available_count <= 0) return "Ausgebucht, Warteliste möglich";
    return `${a.available_count} von ${a.total_quantity} frei`;
  }

  function selectSpot(s: Spot) {
    setActiveSpot(s.id);
    setActiveGroup(s.group);
  }

  function toggleGroup(key: GroupKey) {
    setActiveSpot(null);
    setActiveGroup((prev) => (prev === key ? null : key));
  }

  return (
    <div className="grid items-start gap-5 wide:grid-cols-[minmax(0,2fr)_minmax(270px,1fr)] wide:gap-7">
      <div className="min-w-0">
        <div ref={scrollRef} className="overflow-x-auto rounded-2xl border border-border bg-white">
          <div className="relative min-w-[720px] wide:min-w-0">
            <Image
              src="/docs/uebersichtsplan-eckenhof.jpg"
              alt="Lageplan des Feriendorfs Eckenhof mit den Häusern 1 bis 25, dem Gästehaus und dem Haupthaus mit Villa."
              width={847}
              height={717}
              sizes="(min-width: 1120px) 690px, (min-width: 721px) 64vw, 720px"
              className="h-auto w-full select-none"
              draggable={false}
            />
            {spots.map((s) => {
              const group = groupByKey.get(s.group)!;
              const selected = s.id === activeSpot;
              const sameGroup = activeGroup === s.group;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => selectSpot(s)}
                  aria-pressed={selected}
                  aria-label={`${s.label}: ${titleOf(group)}`}
                  title={`${s.label}: ${titleOf(group)}`}
                  className={cn(
                    "absolute aspect-square -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full border-[2.5px] transition-[transform,background-color,box-shadow] duration-150 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2",
                    selected && "z-10 scale-[1.18]",
                    activeGroup && !sameGroup && "opacity-45"
                  )}
                  style={{
                    left: `${s.x}%`,
                    top: `${s.y}%`,
                    width: `${s.size ?? 2.9}%`,
                    borderColor: group.color,
                    backgroundColor: selected ? `${group.color}99` : sameGroup ? `${group.color}55` : "transparent",
                    boxShadow: selected
                      ? `0 0 0 2px #fffdf8, 0 0 0 4.5px ${group.color}, 0 2px 8px rgba(38,62,54,.45)`
                      : "0 0 0 1px rgba(38,62,54,.55)",
                  }}
                />
              );
            })}
          </div>
        </div>
        <p className="text-small mt-2 wide:hidden">Den Plan könnt ihr mit dem Finger seitlich verschieben.</p>
      </div>

      <div className="panel min-w-0">
        <p className="kicker mb-[7px]">{spot ? spot.label : "Farben im Plan"}</p>
        <p className="text-[19px] font-semibold leading-[1.35]">
          {spot
            ? `${spot.id === "gaestehaus" || spot.id === "villa" ? "Hier liegt" : "Das ist ein"}: ${titleOf(groupByKey.get(spot.group)!)}`
            : "Tippt ein Haus im Plan an."}
        </p>
        <p className="text-small mt-1">
          Ihr bucht die Art der Unterkunft. Die Hausnummer wird bei der Reservierung automatisch vergeben
          und steht in eurer Bestätigung.
        </p>

        <ul className="mt-4">
          {groups.map((group) => {
            const open = activeGroup === group.key;
            const types = typesOf(group);
            return (
              <li key={group.key} className="border-t border-border last:border-b">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.key)}
                  aria-expanded={open}
                  className="flex w-full cursor-pointer items-center gap-3 py-[11px] text-left"
                >
                  <span
                    className="h-[18px] w-[18px] shrink-0 rounded-full border-[2.5px]"
                    style={{ borderColor: group.color, backgroundColor: `${group.color}66`, boxShadow: "0 0 0 1px rgba(38,62,54,.55)" }}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[16px] font-semibold leading-snug">{titleOf(group)}</span>
                    <span className="block text-[14px] leading-snug text-muted-foreground">{group.where}</span>
                  </span>
                  <ChevronDown
                    className={cn("h-4 w-4 shrink-0 text-primary transition-transform", open && "rotate-180")}
                    aria-hidden="true"
                  />
                </button>

                {open && (
                  <div className="space-y-4 pb-4 pl-[30px]">
                    {types.map((ht) => {
                      const free = availabilityText(ht);
                      const plan = getFloorPlan(ht.slug);
                      return (
                        <div key={ht.id}>
                          {types.length > 1 && <p className="text-[16px] font-semibold">{ht.name}</p>}
                          <p className="text-[15px] leading-relaxed text-muted-foreground">
                            Bis zu {ht.max_guests} Personen · {formatCurrency(ht.price_per_house)} für{" "}
                            {nightsLabel(nights)}, zzgl. Kurtaxe
                            {free && <> · {free}</>}
                          </p>
                          {ht.description && (
                            <p className="mt-1.5 text-[15px] leading-relaxed">{ht.description}</p>
                          )}
                          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2">
                            <Link href={`/anmeldung?unterkunft=${ht.slug}`} className="btn-primary min-h-0 px-4 py-2 text-[15px]">
                              Diese Unterkunft wählen
                              <ArrowRight className="h-4 w-4" aria-hidden="true" />
                            </Link>
                            {plan && (
                              <a href={plan} target="_blank" rel="noopener noreferrer" className="text-link text-[15px]">
                                Grundriss ansehen
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
