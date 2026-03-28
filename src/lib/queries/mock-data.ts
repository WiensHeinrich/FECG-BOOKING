import type { Event, HouseType, Availability, Document } from "@/lib/types/database";

const MOCK_EVENT_ID = "00000000-0000-0000-0000-000000000001";

export const mockEvent: Event = {
  id: MOCK_EVENT_ID,
  title: "Gemeindefreizeit 2026",
  slug: "gemeindefreizeit-2026",
  description:
    "Herzlich willkommen zur Gemeindefreizeit 2026 der FECG Trossingen e.V.! Wir freuen uns auf eine wunderbare gemeinsame Zeit mit Gottesdiensten, Gemeinschaft, Wanderungen und vielem mehr.",
  location: "Feriendorf Schwarzwald",
  location_address: "Feriendorfstrasse 1, 78098 Triberg",
  location_url: "https://maps.google.com",
  start_date: "2026-08-01",
  end_date: "2026-08-08",
  registration_start: "2026-01-01T00:00:00Z",
  registration_end: "2026-07-01T23:59:59Z",
  reservation_validity_days: 14,
  bank_account_holder: "FECG Trossingen e.V.",
  bank_iban: "DE89 3704 0044 0532 0130 00",
  bank_bic: "COBADEFFXXX",
  bank_reference_prefix: "GF2026",
  contact_email: "freizeit@fecg-trossingen.de",
  contact_phone: "+49 7425 12345",
  is_active: true,
  hero_image_url: null,
  additional_info: {},
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const mockHouseTypes: HouseType[] = [
  {
    id: "00000000-0000-0000-0000-000000000010",
    event_id: MOCK_EVENT_ID,
    name: "Familienhaus Gross",
    slug: "familienhaus-gross",
    description:
      "Geraeumiges Ferienhaus fuer Familien mit bis zu 6 Personen. Zwei Schlafzimmer, Wohnkueche, Bad mit Dusche.",
    max_guests: 6,
    price_per_house: 850,
    price_per_person: null,
    total_quantity: 4,
    features: ["2 Schlafzimmer", "Wohnkueche", "Bad mit Dusche", "Terrasse", "WLAN"],
    image_url: null,
    sort_order: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-0000-0000-000000000020",
    event_id: MOCK_EVENT_ID,
    name: "Familienhaus Klein",
    slug: "familienhaus-klein",
    description:
      "Gemuetliches Ferienhaus fuer kleine Familien mit bis zu 4 Personen. Ein Schlafzimmer, Wohnkueche, Bad.",
    max_guests: 4,
    price_per_house: 650,
    price_per_person: null,
    total_quantity: 6,
    features: ["1 Schlafzimmer", "Wohnkueche", "Bad mit Dusche", "WLAN"],
    image_url: null,
    sort_order: 2,
    created_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-0000-0000-000000000030",
    event_id: MOCK_EVENT_ID,
    name: "Einzelzimmer",
    slug: "einzelzimmer",
    description:
      "Komfortables Einzelzimmer im Haupthaus. Ideal fuer Einzelpersonen oder Paare.",
    max_guests: 2,
    price_per_house: 350,
    price_per_person: null,
    total_quantity: 8,
    features: ["1 Zimmer", "Eigenes Bad", "WLAN"],
    image_url: null,
    sort_order: 3,
    created_at: new Date().toISOString(),
  },
];

export const mockAvailability: Availability[] = [
  {
    house_type_id: "00000000-0000-0000-0000-000000000010",
    house_type_name: "Familienhaus Gross",
    total_quantity: 4,
    reserved_count: 1,
    available_count: 3,
  },
  {
    house_type_id: "00000000-0000-0000-0000-000000000020",
    house_type_name: "Familienhaus Klein",
    total_quantity: 6,
    reserved_count: 4,
    available_count: 2,
  },
  {
    house_type_id: "00000000-0000-0000-0000-000000000030",
    house_type_name: "Einzelzimmer",
    total_quantity: 8,
    reserved_count: 8,
    available_count: 0,
  },
];

export const mockDocuments: Document[] = [
  {
    id: "00000000-0000-0000-0000-000000000100",
    event_id: MOCK_EVENT_ID,
    title: "Anreise-Informationen",
    description: "Wegbeschreibung und Anfahrtsskizze zum Feriendorf.",
    file_url: "/dokumente/anreise-info.pdf",
    file_size_bytes: 245000,
    sort_order: 1,
    is_published: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-0000-0000-000000000101",
    event_id: MOCK_EVENT_ID,
    title: "Hausordnung",
    description: "Regeln und Hinweise fuer den Aufenthalt im Feriendorf.",
    file_url: "/dokumente/hausordnung.pdf",
    file_size_bytes: 120000,
    sort_order: 2,
    is_published: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-0000-0000-000000000102",
    event_id: MOCK_EVENT_ID,
    title: "Programmuebersicht",
    description: "Vorlaeufiges Programm der Gemeindefreizeit 2026.",
    file_url: "/dokumente/programm.pdf",
    file_size_bytes: 380000,
    sort_order: 3,
    is_published: true,
    created_at: new Date().toISOString(),
  },
];
