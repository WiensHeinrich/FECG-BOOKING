export const siteConfig = {
  name: "Gemeindefreizeit 2027",
  church: "FECG Trossingen e.V.",
  description:
    "Gemeindefreizeit der FECG Trossingen e.V. im Feriendorf Eckenhof Schramberg. Alle Informationen zur Freizeit und die Online-Anmeldung.",
  contactEmail: "kontakt@fecg-trossingen-gemeindefreizeit.de",
  navigation: [
    { title: "Startseite", href: "/" },
    { title: "Informationen", href: "/informationen" },
    { title: "Anmeldung", href: "/anmeldung" },
  ] as const,
};
