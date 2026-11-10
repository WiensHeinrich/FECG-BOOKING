/** Grundriss je Unterkunftstyp (Slug aus der Datenbank), als PDF oder Bild */
export const floorPlanBySlug: Record<string, string> = {
  "ferienhaus-typ-a": "/docs/grundriss-typ-a.pdf",
  "ferienhaus-typ-b": "/docs/grundriss-typ-b.pdf",
  "ferienhaus-typ-ab": "/docs/grundriss-typ-a.pdf",
  "ferienhaus-typ-c": "/docs/grundriss-typ-c.pdf",
  "gaestehaus-g1-10": "/docs/grundriss-gaestehaus.pdf",
  // G11 ist ein Vierbettzimmer, der Plan der Wohnungen 1 bis 10 passt dafür nicht
  "villa-iii": "/images/grundriss-villa-2-3.webp",
};

export function getFloorPlan(slug: string): string | null {
  return floorPlanBySlug[slug] ?? null;
}
