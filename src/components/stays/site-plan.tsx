"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import { nightsLabel } from "@/lib/utils/stay";
import { getFloorPlan } from "@/lib/config/floor-plans";
import type { Availability, HouseType } from "@/lib/types/database";
import { cn } from "@/lib/utils";

/** Maße des Planbilds, alle Koordinaten unten beziehen sich darauf */
const PLAN_WIDTH = 847;
const PLAN_HEIGHT = 717;
const INK = "#263e36";
const PAPER = "#fffdf8";
const DIMMED = "#e4e1d6";

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
  { key: "a", slugs: ["ferienhaus-typ-a"], where: "Häuser 1 bis 4, 6, 7 und 9 bis 14", color: "#7cc0ea" },
  { key: "b", slugs: ["ferienhaus-typ-b"], where: "Häuser 5, 8, 15 und 19 bis 25", color: "#f4c95d" },
  { key: "c", slugs: ["ferienhaus-typ-c"], where: "Häuser 16 bis 18", color: "#f09ab3" },
  {
    key: "g",
    slugs: ["gaestehaus-g1-10", "gaestehaus-g11"],
    title: "Gästehaus",
    where: "Wohnungen G1 bis G11, unten im Plan",
    color: "#7fd3a4",
  },
  { key: "v", slugs: ["villa-iii"], where: "Wohnung in der Villa am Haupthaus", color: "#c3a6ee" },
];

interface Spot {
  id: string;
  label: string;
  group: GroupKey;
  /** Umriss des Gebäudes im Planbild */
  points: string;
  /** Mitte der sichtbaren Fläche, dort steht die Beschriftung */
  cx: number;
  cy: number;
  /** Beschriftung im Plan, mehrere Zeilen möglich */
  text: string[];
  fontSize?: number;
}

/** Schiebt die Ecken etwas nach außen, damit das braune Haus im Bild vollständig überdeckt ist */
function grow(points: string, cx: number, cy: number, by: number) {
  return points
    .split(" ")
    .map((p) => {
      const [x, y] = p.split(",").map(Number);
      const d = Math.hypot(x - cx, y - cy) || 1;
      return `${(x + ((x - cx) / d) * by).toFixed(1)},${(y + ((y - cy) / d) * by).toFixed(1)}`;
    })
    .join(" ");
}

const house = (n: number, group: GroupKey, points: string, cx: number, cy: number): Spot => ({
  id: String(n),
  label: `Haus ${n}`,
  group,
  points: grow(points, cx, cy, 1.8),
  cx,
  cy,
  text: [String(n)],
});

const SPOTS: Spot[] = [
  house(1, "a", "292.8,509.5 310.2,517.8 297.5,543.2 280.8,535.8", 295.4, 526.2),
  house(2, "a", "314.2,515.2 331.2,524 319.8,548.8 301.2,540.8", 316.3, 532.2),
  house(3, "a", "333.5,522.8 351,530 338,555.8 321.2,548", 336.2, 539.2),
  house(4, "a", "351.5,530.5 371.5,539.5 360,562.5 340,553", 356.2, 546.2),
  house(5, "b", "373.8,536.8 399.8,549.8 386.2,574.5 361.2,562", 380.4, 555.4),
  house(6, "a", "458,520.8 474.5,528 462.2,554.2 444.8,546", 459.4, 537.2),
  house(7, "a", "473.2,534.5 490.2,541.8 478,568 460.8,560", 475.3, 551.1),
  house(8, "b", "489.8,546.5 513,559.5 500.8,584.2 477.2,572.8", 495.4, 565.9),
  house(9, "a", "447.8,424.8 466.5,432.2 453.5,458.2 436.8,450", 451.3, 441.1),
  house(10, "a", "431.5,410 449,418.8 438,443.5 419.8,435.8", 434.3, 427.1),
  house(11, "a", "414.8,396.8 432,405.2 419.8,430 402.8,421.2", 417.4, 413.1),
  house(12, "a", "398.2,384.8 415.2,392.2 403.2,418 385.2,408.5", 400.4, 401.3),
  house(13, "a", "368.5,353.8 386.2,362.2 373.8,388 356,380", 371.2, 371.2),
  house(14, "a", "350,341.5 368.5,350.5 357,376.2 337.5,367", 353.1, 358.7),
  house(15, "b", "327.5,324.2 350.2,336 338.2,360.8 314.8,348.5", 332.5, 342.7),
  house(16, "c", "304.8,182.8 325.8,194.8 316,215 293.5,204.5", 309.8, 199.3),
  house(17, "c", "333,204.2 353.2,213.8 343.2,237 321.8,225.5", 337.8, 220.4),
  house(18, "c", "361.5,228 383,239 371.5,260.2 351.5,250.2", 366.9, 244.3),
  house(19, "b", "390.8,271.8 419,284.5 406.8,309.8 380,297", 399.1, 290.6),
  house(20, "b", "415.8,242.8 442.8,256.5 431.2,281.5 402.8,268", 423, 262.5),
  house(21, "b", "437.5,214.2 464,226.8 453.2,252.8 425.2,239.2", 445, 233.5),
  house(22, "b", "503.5,348 526.2,357.8 515.8,379.8 494.5,369", 509.8, 363.6),
  house(23, "b", "538.2,360 559,370.5 547.8,392.2 526.8,381.5", 542.8, 376.3),
  house(24, "b", "574.2,369.8 595,380.8 585,401.5 563,392.2", 578.7, 386.1),
  house(25, "b", "568.8,434.2 590.8,444 580,466.2 559.5,456.8", 574.7, 450.3),
  {
    id: "gaestehaus",
    label: "Gästehaus",
    group: "g",
    points: grow(
      "351.8,629 343.8,662.8 357.8,667.8 350,701.8 375,709 380.8,708 384,698.5 416,706 424.8,678.2 420.8,673 427,643.8 400.2,636.5 395.2,646.8 385,643.5 382.8,636",
      386,
      669,
      1.6
    ),
    cx: 386,
    cy: 671,
    text: ["Gästehaus", "G1 bis G11"],
    fontSize: 11.5,
  },
  {
    id: "villa",
    label: "Villa",
    group: "v",
    points: "210.8,515.8 255,535.8 235,577.5 216.7,569.7 214.7,575.3 188,563.4",
    cx: 221,
    cy: 547,
    text: ["Villa III"],
    fontSize: 11.5,
  },
];

interface SitePlanProps {
  houseTypes: HouseType[];
  availability: Availability[] | null;
  nights: number;
}

export function SitePlan({ houseTypes, availability, nights }: SitePlanProps) {
  /** über die Farbliste hervorgehobene Art, alle anderen Häuser werden grau */
  const [filterGroup, setFilterGroup] = useState<GroupKey | null>(null);
  const [activeSpot, setActiveSpot] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auf dem Handy ist der Plan breiter als der Bildschirm: so verschieben, dass die Häuser zu sehen sind
  useEffect(() => {
    const el = scrollRef.current;
    if (el && el.scrollWidth > el.clientWidth) {
      el.scrollLeft = el.scrollWidth * 0.47 - el.clientWidth / 2;
    }
  }, []);

  useEffect(() => {
    if (!activeSpot) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveSpot(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeSpot]);

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
  const spotGroup = spot ? groupByKey.get(spot.group)! : null;

  function freeCount(ht: HouseType) {
    const a = availability?.find((x) => x.house_type_id === ht.id);
    return a ? { free: Math.max(a.available_count, 0), total: a.total_quantity } : null;
  }

  function availabilityText(ht: HouseType) {
    const a = freeCount(ht);
    if (!a) return null;
    if (a.free <= 0) return "Ausgebucht, Warteliste möglich";
    return `${a.free} von ${a.total} frei`;
  }

  function selectSpot(s: Spot) {
    setFilterGroup(null);
    setActiveSpot((prev) => (prev === s.id ? null : s.id));
  }

  function toggleGroup(key: GroupKey) {
    setActiveSpot(null);
    setFilterGroup((prev) => (prev === key ? null : key));
  }

  // Das angewählte Haus zuletzt zeichnen, damit sein Rand über den Nachbarn liegt
  const ordered = [...spots].sort((a, b) => Number(a.id === activeSpot) - Number(b.id === activeSpot));

  return (
    <div>
      <div ref={scrollRef} className="overflow-x-auto rounded-2xl border border-border bg-white">
        <div className="relative min-w-[800px] wide:min-w-0">
          <svg
            viewBox={`0 0 ${PLAN_WIDTH} ${PLAN_HEIGHT}`}
            className="block h-auto w-full select-none"
            role="group"
            aria-label="Lageplan des Feriendorfs Eckenhof mit den Häusern 1 bis 25, dem Gästehaus und dem Haupthaus mit Villa. Die Häuser lassen sich anwählen."
          >
            <image
              href="/docs/uebersichtsplan-eckenhof.jpg"
              width={PLAN_WIDTH}
              height={PLAN_HEIGHT}
              preserveAspectRatio="xMidYMid meet"
            />
            {ordered.map((s) => {
              const group = groupByKey.get(s.group)!;
              const selected = s.id === activeSpot;
              const dimmed = filterGroup !== null && filterGroup !== s.group;
              const fontSize = s.fontSize ?? 12.5;
              const lineHeight = fontSize * 1.15;
              const firstLine = s.cy - ((s.text.length - 1) * lineHeight) / 2;
              return (
                <g
                  key={s.id}
                  role="button"
                  tabIndex={0}
                  aria-pressed={selected}
                  aria-label={`${s.label}: ${titleOf(group)}`}
                  onClick={() => selectSpot(s)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      selectSpot(s);
                    }
                  }}
                  className="group/spot cursor-pointer outline-none"
                >
                  <title>{`${s.label}: ${titleOf(group)}`}</title>
                  {selected && (
                    <polygon points={s.points} fill="none" stroke={INK} strokeWidth={6.5} strokeLinejoin="round" />
                  )}
                  <polygon
                    points={s.points}
                    fill={dimmed ? DIMMED : group.color}
                    stroke={selected ? PAPER : INK}
                    strokeWidth={selected ? 2.6 : 1.1}
                    strokeLinejoin="round"
                    className="transition-[fill,filter] duration-150 group-hover/spot:brightness-[1.08] group-focus-visible/spot:stroke-[3px]"
                  />
                  {s.text.map((line, i) => (
                    <text
                      key={line}
                      x={s.cx}
                      y={firstLine + i * lineHeight}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={fontSize}
                      fontWeight={700}
                      fill={INK}
                      opacity={dimmed ? 0.55 : 1}
                      pointerEvents="none"
                    >
                      {line}
                    </text>
                  ))}
                </g>
              );
            })}
          </svg>

          {spot && spotGroup && (
            <div
              role="dialog"
              aria-label={`${spot.label}: ${titleOf(spotGroup)}`}
              className="absolute z-10 w-[262px] rounded-xl border border-border bg-card p-[14px] shadow-[0_10px_30px_rgba(38,62,54,.28)]"
              style={{
                left: `clamp(139px, ${(spot.cx / PLAN_WIDTH) * 100}%, calc(100% - 139px))`,
                ...(spot.cy / PLAN_HEIGHT > 0.52
                  ? { bottom: `calc(${100 - (spot.cy / PLAN_HEIGHT) * 100}% + 26px)` }
                  : { top: `calc(${(spot.cy / PLAN_HEIGHT) * 100}% + 26px)` }),
                transform: "translateX(-50%)",
              }}
            >
              <button
                type="button"
                onClick={() => setActiveSpot(null)}
                aria-label="Schließen"
                className="absolute right-1.5 top-1.5 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
              <p className="kicker mb-[3px] flex items-center gap-2 pr-8">
                <span
                  className="h-[13px] w-[13px] shrink-0 rounded-[3px] border"
                  style={{ backgroundColor: spotGroup.color, borderColor: INK }}
                  aria-hidden="true"
                />
                {spot.label}
              </p>
              <div className="space-y-3">
                {typesOf(spotGroup).map((ht) => {
                  const a = freeCount(ht);
                  const soldOut = a !== null && a.free <= 0;
                  const plan = getFloorPlan(ht.slug);
                  return (
                    <div key={ht.id}>
                      <p className="text-[17px] font-semibold leading-snug">{ht.name}</p>
                      <p className="text-[14px] leading-[1.5] text-muted-foreground">
                        Bis zu {ht.max_guests} Personen · {formatCurrency(ht.price_per_house)} für{" "}
                        {nightsLabel(nights)}
                        {a && <> · {soldOut ? "ausgebucht" : `${a.free} von ${a.total} frei`}</>}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        <Link
                          href={`/anmeldung?unterkunft=${ht.slug}`}
                          className="btn-primary min-h-0 px-[13px] py-[7px] text-[15px]"
                        >
                          {soldOut ? "Auf die Warteliste" : "Jetzt buchen"}
                          <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </Link>
                        {plan && (
                          <a href={plan} target="_blank" rel="noopener noreferrer" className="text-link text-[14px]">
                            Grundriss
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-2.5 text-[13px] leading-[1.45] text-muted-foreground">
                Ihr bucht eine Unterkunft dieser Art, die Nummer wird automatisch vergeben.
              </p>
            </div>
          )}
        </div>
      </div>
      <p className="text-small mt-2 wide:hidden">Den Plan könnt ihr mit dem Finger seitlich verschieben.</p>

      <ul className="mt-4 grid gap-2.5 sm:grid-cols-2 wide:grid-cols-5">
        {groups.map((group) => {
          const active = filterGroup === group.key || spot?.group === group.key;
          const types = typesOf(group);
          return (
            <li key={group.key}>
              <button
                type="button"
                onClick={() => toggleGroup(group.key)}
                aria-pressed={active}
                className={cn(
                  "flex h-full w-full cursor-pointer items-start gap-2.5 rounded-xl border bg-card p-3 text-left transition-colors",
                  active ? "border-foreground" : "border-border hover:border-[#bcc7b5]"
                )}
              >
                <span
                  className="mt-[3px] h-[17px] w-[17px] shrink-0 rounded-[4px] border"
                  style={{ backgroundColor: group.color, borderColor: INK }}
                  aria-hidden="true"
                />
                <span className="min-w-0">
                  <span className="block text-[15px] font-semibold leading-snug">{titleOf(group)}</span>
                  <span className="block text-[13px] leading-snug text-muted-foreground">{group.where}</span>
                  {types.map((ht) => {
                    const free = availabilityText(ht);
                    if (!free) return null;
                    return (
                      <span key={ht.id} className="mt-1 block text-[13px] leading-snug">
                        {types.length > 1 ? `${ht.name}: ${free}` : free}
                      </span>
                    );
                  })}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
