const NUMBER_WORDS = ["", "eine", "zwei", "drei", "vier", "fünf", "sechs", "sieben"];

/** "zwei Nächte", "eine Nacht" */
export function nightsLabel(nights: number): string {
  const word = NUMBER_WORDS[nights] ?? String(nights);
  return nights === 1 ? `${word} Nacht` : `${word} Nächte`;
}

export type AvailabilityState = "available" | "soldout" | "unknown";

export function availabilityState(count: number | null | undefined): AvailabilityState {
  if (count === null || count === undefined) return "unknown";
  return count > 0 ? "available" : "soldout";
}

export type AvailabilityLevel = "frei" | "knapp" | "voll";

/** frei = grün, knapp = fast ausgebucht (orange), voll = ausgebucht (rot) */
export function availabilityLevel(free: number, total: number): AvailabilityLevel {
  if (free <= 0) return "voll";
  if (total >= 2 && free <= Math.max(1, Math.floor(total * 0.3))) return "knapp";
  return "frei";
}

/** Hinweis zur festen Hauswahl, steht im Lageplan, in der Anmeldung und in der Bestätigung */
export const HOUSE_WISH_NOTE =
  "Wir bemühen uns, euch genau das gewählte Haus zu geben. Ein Anspruch auf eine bestimmte Hausnummer besteht jedoch nicht, in Ausnahmefällen kann sich die Nummer noch ändern.";
