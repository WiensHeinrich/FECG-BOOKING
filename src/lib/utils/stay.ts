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
