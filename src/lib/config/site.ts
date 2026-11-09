export const siteConfig = {
  name: "Gemeindefreizeit 2027",
  church: "FECG Trossingen e.V.",
  churchLong: "Freie Evangeliums-Christengemeinde Trossingen e.V.",
  churchAddress: ["Ernst-Hohner-Straße 35/1", "78647 Trossingen"],
  slogan: "Gemeinsam. Glauben. Erleben.",
  description:
    "Gemeindefreizeit der FECG Trossingen e.V. im Feriendorf Eckenhof Schramberg. Alle Informationen zur Freizeit und die Online-Anmeldung.",
  contactEmail: "kontakt@fecg-trossingen-gemeindefreizeit.de",
  navigation: [
    { title: "Die Freizeit", href: "/", hideOnMobile: true },
    { title: "Unterkünfte", href: "/unterkuenfte", hideOnMobile: false },
    { title: "Gut zu wissen", href: "/informationen", hideOnMobile: false },
  ] as const,
};

/** Titel in Bezeichnung und Jahr aufteilen, z. B. "Gemeindefreizeit 2027" */
export function splitEventTitle(title: string): { label: string; year: string | null } {
  const match = title.match(/^(.*?)\s*((?:19|20)\d{2})$/);
  if (!match) return { label: title, year: null };
  return { label: match[1] || title, year: match[2] };
}
