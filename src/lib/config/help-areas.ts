/**
 * Bereiche, in denen Gäste bei der Freizeit mithelfen können.
 * Die Schlüssel stehen so in der Datenbank (guests.help_areas, Migration 016).
 */
export const HELP_AREAS = [
  { key: "kueche", label: "Küche" },
  { key: "spuelen_tischdienst", label: "Spülen und Tischdienst" },
  { key: "grillen", label: "Grillen" },
  { key: "kinderbetreuung", label: "Kinderbetreuung" },
  { key: "kinderprogramm", label: "Kinderprogramm" },
  { key: "spiele_sport", label: "Spiele und Sport" },
  { key: "musik", label: "Musik" },
  { key: "technik", label: "Technik" },
  { key: "aufbau_abbau", label: "Aufbau und Abbau" },
  { key: "erste_hilfe", label: "Erste Hilfe (Arzt, Arzthelferin, Pflegekraft)" },
  { key: "egal", label: "Egal, teilt mich ein" },
] as const;

export type HelpAreaKey = (typeof HELP_AREAS)[number]["key"];

export const HELP_AREA_KEYS = HELP_AREAS.map((a) => a.key) as [HelpAreaKey, ...HelpAreaKey[]];

/** Wer keinen festen Bereich wählt */
export const HELP_ANY: HelpAreaKey = "egal";

/** Ab diesem Alter (am ersten Tag der Freizeit) wählt ein Gast Bereiche */
export const HELP_MIN_AGE = 14;

/**
 * So viele Bereiche muss jeder Gast ab HELP_MIN_AGE mindestens wählen, damit das Freizeitteam
 * am Ende selbst einteilen kann. "Egal, teilt mich ein" genügt allein.
 */
export const HELP_MIN_COUNT = 4;

/** true, wenn die Auswahl eines Gastes ausreicht */
export function helpChoiceComplete(keys: readonly string[] | null | undefined): boolean {
  const list = keys ?? [];
  return list.includes(HELP_ANY) || list.length >= HELP_MIN_COUNT;
}

export function helpAreaLabel(key: string): string {
  return HELP_AREAS.find((a) => a.key === key)?.label ?? key;
}

/** "Küche, Musik" in der Reihenfolge der Liste oben */
export function helpAreaLabels(keys: readonly string[] | null | undefined): string {
  if (!keys || keys.length === 0) return "";
  return HELP_AREAS.filter((a) => keys.includes(a.key))
    .map((a) => a.label)
    .join(", ");
}
