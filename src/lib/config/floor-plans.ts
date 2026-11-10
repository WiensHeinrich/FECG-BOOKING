/** Grundriss-PDFs je Unterkunftstyp (Slug aus der Datenbank) */
export const floorPlanBySlug: Record<string, string> = {
  "ferienhaus-typ-a": "/docs/grundriss-typ-a.pdf",
  "ferienhaus-typ-b": "/docs/grundriss-typ-b.pdf",
  "ferienhaus-typ-ab": "/docs/grundriss-typ-a.pdf",
  "ferienhaus-typ-c": "/docs/grundriss-typ-c.pdf",
  "gaestehaus-g1-10": "/docs/grundriss-gaestehaus.pdf",
  "gaestehaus-g11": "/docs/grundriss-gaestehaus.pdf",
};

export function getFloorPlan(slug: string): string | null {
  return floorPlanBySlug[slug] ?? null;
}
