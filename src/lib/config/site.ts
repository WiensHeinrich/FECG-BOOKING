export const siteConfig = {
  name: 'FECG Gemeindefreizeit',
  church: 'FECG Trossingen e.V.',
  description: 'Buchungssystem für die Gemeindefreizeit der FECG Trossingen e.V.',
  navigation: [
    { title: 'Startseite', href: '/' },
    { title: 'Informationen', href: '/informationen' },
    { title: 'Anmeldung', href: '/anmeldung' },
  ] as const,
}
