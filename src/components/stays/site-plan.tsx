"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import { HOUSE_WISH_NOTE, nightsLabel, occupancyRange, stayNoun } from "@/lib/utils/stay";
import { getFloorPlan } from "@/lib/config/floor-plans";
import type { Availability, HouseStatus, HouseType } from "@/lib/types/database";
import { AvailabilityBadge } from "./availability-badge";
import { cn } from "@/lib/utils";

/**
 * Maße des Übersichtsplans, alle Koordinaten unten beziehen sich darauf.
 * Im Planbild (lageplan-eckenhof.webp) sind die braunen Häuser entfernt, sie werden hier farbig gezeichnet.
 */
const PLAN_WIDTH = 847;
const PLAN_HEIGHT = 717;
const INK = "#263e36";
const PAPER = "#fffdf8";
/** vergebene Häuser sind grau */
const TAKEN_FILL = "#dcdad1";
const TAKEN_INK = "#757c77";

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
  /** Hausnummer, wenn die Fläche genau ein buchbares Haus ist */
  houseNumber?: number;
}

const house = (n: number, group: GroupKey, points: string, cx: number, cy: number): Spot => ({
  id: String(n),
  label: `Haus ${n}`,
  group,
  points,
  cx,
  cy,
  text: [String(n)],
  houseNumber: n,
});

const SPOTS: Spot[] = [
  house(1, "a", "293.5,508.8 311.3,518.4 297.6,543.9 279.8,534.3", 295.5, 526.4),
  house(2, "a", "314.3,514.6 332.3,524.3 318.5,550 300.5,540.3", 316.4, 532.3),
  house(3, "a", "334.3,521.6 352.3,531.3 338.5,557 320.5,547.3", 336.4, 539.3),
  house(4, "a", "354.2,528.7 372.3,538.4 358.5,564 340.4,554.3", 356.4, 546.4),
  house(5, "b", "374.5,535.6 400.3,549.5 386.4,575.3 360.6,561.4", 380.5, 555.5),
  house(6, "a", "457.5,519.7 475.1,529.1 461.4,554.8 443.8,545.4", 459.5, 537.3),
  house(7, "a", "473.2,533.5 491.3,543.2 477.6,568.9 459.5,559.2", 475.4, 551.2),
  house(8, "b", "490.2,546.7 514.6,559.7 500.9,585.4 476.5,572.4", 495.6, 566),
  house(9, "a", "449.2,423.7 467.1,433.3 453.4,458.8 435.5,449.2", 451.3, 441.2),
  house(10, "a", "432.3,409.6 450.4,419.3 436.6,445 418.5,435.3", 434.5, 427.3),
  house(11, "a", "415.2,395.7 433.4,405.5 419.7,430.9 401.5,421.2", 417.5, 413.3),
  house(12, "a", "398.6,383.9 416.1,393.3 402.3,418.9 384.9,409.5", 400.5, 401.4),
  house(13, "a", "369.3,353.7 387.2,363.3 373.4,389 355.5,379.4", 371.4, 371.3),
  house(14, "a", "350.4,340.7 369.9,351.2 356.1,376.9 336.6,366.4", 353.2, 358.8),
  house(15, "b", "327.7,323.7 351.3,336.4 337.6,362 314,349.4", 332.7, 342.9),
  house(16, "c", "304.9,182.7 326.8,194.5 315,216.3 293.1,204.5", 309.9, 199.5),
  house(17, "c", "333,203.6 354.8,215.4 343,237.4 321.2,225.6", 338, 220.5),
  house(18, "c", "361.9,227.7 383.8,239.5 372,261.3 350.2,249.5", 367, 244.5),
  house(19, "b", "391.8,270.7 419.9,285.8 406.6,310.7 378.5,295.6", 399.2, 290.7),
  house(20, "b", "415.9,242.8 443.8,257.7 430.5,282.5 402.6,267.6", 423.2, 262.6),
  house(21, "b", "437.8,213.7 465.9,228.7 452.5,253.5 424.5,238.5", 445.2, 233.6),
  house(22, "b", "504.6,346.8 526.7,358.5 515.2,380.3 493.1,368.7", 509.9, 363.6),
  house(23, "b", "537.8,359.7 559.6,371.2 548,393.2 526.2,381.7", 542.9, 376.4),
  house(24, "b", "573.6,369.5 595.7,381.1 584.2,403 562,391.4", 578.9, 386.3),
  house(25, "b", "569.6,433.7 591.7,445.4 580,467.3 557.9,455.5", 574.8, 450.5),
  {
    id: "gaestehaus",
    label: "Gästehaus",
    group: "g",
    points:
      "351.9,629.1 343.9,662.9 357.9,667.9 350.1,701.9 375.1,709.1 380.9,708.1 384.1,698.6 416.1,706.1 424.9,678.4 420.9,673.1 427.1,643.9 400.4,636.6 395.4,646.9 385.1,643.6 382.9,636.1",
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

/** Umschließendes Rechteck eines Umrisses in Plankoordinaten */
function boundsOf(points: string) {
  const xs: number[] = [];
  const ys: number[] = [];
  for (const p of points.split(" ")) {
    const [x, y] = p.split(",").map(Number);
    xs.push(x);
    ys.push(y);
  }
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
}

interface SitePlanProps {
  houseTypes: HouseType[];
  availability: Availability[] | null;
  /** Belegung je Haus, null = feste Hauswahl nicht verfügbar */
  houseStatus: HouseStatus[] | null;
  nights: number;
  /** Zustellbetten je Unterkunft, daraus ergibt sich die Höchstbelegung */
  maxExtraBeds: number;
}

export function SitePlan({ houseTypes, availability, houseStatus, nights, maxExtraBeds }: SitePlanProps) {
  /** über die Farbliste hervorgehobene Art, alle anderen Häuser werden blass */
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

  // Fenster am Haus schließen: Escape oder Klick irgendwo daneben
  useEffect(() => {
    if (!activeSpot) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveSpot(null);
    };
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Element | null;
      if (target?.closest("[data-plan-callout], [data-plan-spot]")) return;
      setActiveSpot(null);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
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

  /** Das einzelne Haus hinter einer Fläche, wenn die feste Hauswahl verfügbar ist */
  function houseOf(s: Spot) {
    if (!houseStatus || s.houseNumber === undefined) return null;
    const type = typesOf(groupByKey.get(s.group)!)[0];
    if (!type) return null;
    return houseStatus.find((h) => h.house_type_id === type.id && h.house_number === s.houseNumber) ?? null;
  }

  /** true = vergeben (grau), false = frei, null = unbekannt */
  function isTaken(s: Spot): boolean | null {
    if (s.houseNumber !== undefined) {
      const h = houseOf(s);
      return h ? !h.is_free : null;
    }
    // Gebäude mit mehreren Wohnungen: erst grau, wenn gar nichts mehr frei ist
    const counts = typesOf(groupByKey.get(s.group)!).map(freeCount);
    if (counts.length === 0 || counts.some((c) => c === null)) return null;
    return counts.every((c) => c!.free <= 0);
  }

  const spotHouse = spot ? houseOf(spot) : null;
  const spotTaken = spot ? isTaken(spot) === true : false;
  const calloutNote = !spot
    ? null
    : !houseStatus
      ? "Ihr bucht eine Unterkunft dieser Art. Ein Anspruch auf genau dieses Haus besteht nicht, die Nummer wird automatisch vergeben."
      : spotHouse
        ? spotHouse.is_free
          ? HOUSE_WISH_NOTE
          : null
        : spot.id === "gaestehaus" && !spotTaken
          ? "Eure Wunschwohnung (G1 bis G10) wählt ihr in der Anmeldung. Ein Anspruch auf eine bestimmte Wohnung besteht jedoch nicht."
          : null;

  function selectSpot(s: Spot) {
    setFilterGroup(null);
    setActiveSpot((prev) => (prev === s.id ? null : s.id));
  }

  function toggleGroup(key: GroupKey) {
    setActiveSpot(null);
    setFilterGroup((prev) => (prev === key ? null : key));
  }

  /**
   * Setzt das Fenster neben das angewählte Haus, und zwar dorthin, wo es möglichst wenige
   * andere Häuser verdeckt und (auf dem Handy) im sichtbaren Teil des Plans liegt.
   */
  function placeCallout(el: HTMLDivElement | null) {
    const scroller = scrollRef.current;
    const plan = el?.offsetParent as HTMLElement | null;
    if (!el || !spot || !scroller || !plan) return;
    const W = plan.clientWidth;
    const H = plan.clientHeight;
    const k = W / PLAN_WIDTH;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const gap = 10;
    const edge = 8;
    const b = boundsOf(spot.points);
    const own = { x0: b.x0 * k, x1: b.x1 * k, y0: b.y0 * k, y1: b.y1 * k };
    const hx = spot.cx * k;
    const hy = spot.cy * k;
    const candidates: [number, number][] = [
      [own.x1 + gap, hy - h / 2],
      [own.x0 - gap - w, hy - h / 2],
      [hx - w / 2, own.y1 + gap],
      [hx - w / 2, own.y0 - gap - h],
      [own.x1 + gap, own.y0],
      [own.x1 + gap, own.y1 - h],
      [own.x0 - gap - w, own.y0],
      [own.x0 - gap - w, own.y1 - h],
      [own.x0, own.y1 + gap],
      [own.x1 - w, own.y1 + gap],
      [own.x0, own.y0 - gap - h],
      [own.x1 - w, own.y0 - gap - h],
    ];
    let best: { x: number; y: number; score: number } | null = null;
    for (const [cx, cy] of candidates) {
      const x = Math.min(Math.max(cx, edge), W - w - edge);
      const y = Math.min(Math.max(cy, edge), H - h - edge);
      let score = 0;
      // verdeckt das eigene Haus
      if (x < own.x1 && x + w > own.x0 && y < own.y1 && y + h > own.y0) score += 100;
      // liegt außerhalb des gerade sichtbaren Ausschnitts
      if (x < scroller.scrollLeft || x + w > scroller.scrollLeft + scroller.clientWidth) score += 50;
      for (const other of spots) {
        if (other.id === spot.id) continue;
        const ox = other.cx * k;
        const oy = other.cy * k;
        if (ox > x - 4 && ox < x + w + 4 && oy > y - 4 && oy < y + h + 4) score += 1;
      }
      if (!best || score < best.score) best = { x, y, score };
    }
    if (!best) return;
    el.style.left = `${(best.x / W) * 100}%`;
    el.style.top = `${(best.y / H) * 100}%`;
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
              href="/images/lageplan-eckenhof.webp"
              width={PLAN_WIDTH}
              height={PLAN_HEIGHT}
              preserveAspectRatio="xMidYMid meet"
            />
            {ordered.map((s) => {
              const group = groupByKey.get(s.group)!;
              const selected = s.id === activeSpot;
              const dimmed = filterGroup !== null && filterGroup !== s.group;
              const taken = isTaken(s) === true;
              const stateLabel = isTaken(s) === null ? "" : taken ? ", vergeben" : ", frei";
              // Text beim Überfahren mit der Maus: Unterkunft, Stand und Belegung
              const spotTypes = typesOf(group);
              const occupancy = (ht: HouseType) => {
                const r = occupancyRange(ht.max_guests, maxExtraBeds);
                return `${stayNoun(ht.slug)} für ${ht.max_guests} Personen (mindestens ${r.min}, höchstens ${r.max})`;
              };
              const tooltip =
                spotTypes.length === 1
                  ? `${s.label}: ${spotTypes[0].name}${stateLabel}. ${occupancy(spotTypes[0])}`
                  : `${s.label}. ${spotTypes.map((ht) => `${ht.name}: ${occupancy(ht)}`).join(". ")}`;
              const fontSize = s.fontSize ?? 12.5;
              const lineHeight = fontSize * 1.15;
              const firstLine = s.cy - ((s.text.length - 1) * lineHeight) / 2;
              return (
                <g
                  key={s.id}
                  role="button"
                  tabIndex={0}
                  data-plan-spot=""
                  aria-pressed={selected}
                  aria-label={`${s.label}: ${titleOf(group)}${stateLabel}`}
                  opacity={dimmed ? 0.3 : 1}
                  onClick={() => selectSpot(s)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      selectSpot(s);
                    }
                  }}
                  className="group/spot cursor-pointer outline-none"
                >
                  <title>{tooltip}</title>
                  {selected && (
                    <polygon points={s.points} fill="none" stroke={INK} strokeWidth={6.5} strokeLinejoin="round" />
                  )}
                  <polygon
                    points={s.points}
                    fill={taken ? TAKEN_FILL : group.color}
                    stroke={selected ? PAPER : taken ? TAKEN_INK : INK}
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
                      fill={taken ? TAKEN_INK : INK}
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
              key={spot.id}
              ref={placeCallout}
              role="dialog"
              data-plan-callout=""
              aria-label={`${spot.label}: ${titleOf(spotGroup)}`}
              className="absolute left-2 top-2 z-10 w-[262px] rounded-xl border border-border bg-card p-[14px] shadow-[0_10px_30px_rgba(38,62,54,.28)]"
            >
              <button
                type="button"
                onClick={() => setActiveSpot(null)}
                aria-label="Schließen"
                className="absolute right-1.5 top-1.5 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
              <p className="kicker mb-[5px] flex flex-wrap items-center gap-x-2 gap-y-1 pr-8">
                <span
                  className="h-[13px] w-[13px] shrink-0 rounded-[3px] border"
                  style={{
                    backgroundColor: spotTaken ? TAKEN_FILL : spotGroup.color,
                    borderColor: spotTaken ? TAKEN_INK : INK,
                  }}
                  aria-hidden="true"
                />
                {spot.label}
                {spotHouse && (
                  <AvailabilityBadge
                    free={spotHouse.is_free ? 1 : 0}
                    total={1}
                    label={spotHouse.is_free ? "frei" : "vergeben"}
                  />
                )}
              </p>
              <div className="space-y-3">
                {typesOf(spotGroup).map((ht) => {
                  const a = freeCount(ht);
                  const soldOut = a !== null && a.free <= 0;
                  const plan = getFloorPlan(ht.slug);
                  // genau dieses Haus buchen, sonst nur die Art
                  const exactHouse = spotHouse?.is_free ? spotHouse : null;
                  const houseTaken = spotHouse !== null && !spotHouse.is_free;
                  return (
                    <div key={ht.id}>
                      <p className="text-[17px] font-semibold leading-snug">{ht.name}</p>
                      <p className="text-[14px] leading-[1.5] text-muted-foreground">
                        {stayNoun(ht.slug)} für {ht.max_guests} Personen · {formatCurrency(ht.price_per_house)}{" "}
                        für {nightsLabel(nights)}
                      </p>
                      <p className="text-[13px] leading-[1.5] text-muted-foreground">
                        Buchbar mit mindestens {occupancyRange(ht.max_guests, maxExtraBeds).min} und
                        höchstens {occupancyRange(ht.max_guests, maxExtraBeds).max} Personen
                      </p>
                      {a && <AvailabilityBadge free={a.free} total={a.total} className="mt-1.5" />}
                      {houseTaken && (
                        <p className="mt-2 text-[14px] leading-[1.45]">
                          {soldOut
                            ? "Alle Häuser dieser Art sind vergeben. Auf der Warteliste melden wir uns, sobald eines frei wird."
                            : `${spot.label} ist schon vergeben. Andere Häuser dieser Art sind noch frei.`}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        <Link
                          href={
                            exactHouse && !soldOut
                              ? `/anmeldung?unterkunft=${ht.slug}&haus=${exactHouse.house_number}`
                              : `/anmeldung?unterkunft=${ht.slug}`
                          }
                          className="btn-primary min-h-0 px-[13px] py-[7px] text-[15px]"
                        >
                          {soldOut
                            ? "Auf die Warteliste"
                            : exactHouse
                              ? `${spot.label} buchen`
                              : houseTaken
                                ? "Freies Haus buchen"
                                : "Jetzt buchen"}
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
              {calloutNote && (
                <p className="mt-2.5 text-[13px] leading-[1.45] text-muted-foreground">
                  <strong className="font-semibold text-foreground">Wichtig:</strong> {calloutNote}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      <p className="text-small mt-2 wide:hidden">Den Plan könnt ihr mit dem Finger seitlich verschieben.</p>
      {houseStatus && (
        <p className="mt-2 flex items-center gap-2 text-[14px] text-muted-foreground">
          <span
            className="h-[15px] w-[15px] shrink-0 rounded-[3px] border"
            style={{ backgroundColor: TAKEN_FILL, borderColor: TAKEN_INK }}
            aria-hidden="true"
          />
          Graue Häuser sind schon vergeben.
        </p>
      )}

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
                    const a = freeCount(ht);
                    const r = occupancyRange(ht.max_guests, maxExtraBeds);
                    return (
                      <span key={ht.id} className="mt-2 block text-[13px] leading-snug" data-occupancy="">
                        {types.length > 1 && <span className="block font-semibold">{ht.name}</span>}
                        <span className="block">
                          {stayNoun(ht.slug)} für {ht.max_guests} Personen
                        </span>
                        <span className="mb-1 block text-muted-foreground">
                          mindestens {r.min}, höchstens {r.max} Personen
                        </span>
                        {a && <AvailabilityBadge free={a.free} total={a.total} />}
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
