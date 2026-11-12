import { z } from "zod/v4";
import { HELP_AREA_KEYS, HELP_MIN_COUNT, helpChoiceComplete } from "@/lib/config/help-areas";

const isoDate = z
  .string()
  .max(20)
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Bitte ein gültiges Datum eingeben");

export const guestSchema = z.object({
  first_name: z.string().trim().min(1, "Vorname ist erforderlich").max(100, "Vorname zu lang (max. 100 Zeichen)"),
  last_name: z.string().trim().min(1, "Nachname ist erforderlich").max(100, "Nachname zu lang (max. 100 Zeichen)"),
  birth_date: z.union([isoDate, z.literal("")]).optional(),
  is_child: z.boolean().default(false),
  gender: z.enum(["maennlich", "weiblich"]).optional(),
  dietary_notes: z.string().max(500, "Hinweise dürfen maximal 500 Zeichen lang sein").optional(),
  help_areas: z.array(z.enum(HELP_AREA_KEYS)).max(HELP_AREA_KEYS.length).default([]),
  sort_order: z.number().default(0),
});

export const bookingFormSchema = z.object({
  event_id: z.guid(),
  house_type_id: z.guid(),
  /** Wunschhaus aus dem Lageplan, ohne Angabe teilt das System ein Haus zu */
  house_id: z.guid().optional(),
  contact_first_name: z.string().trim().min(1, "Vorname ist erforderlich").max(100, "Vorname zu lang (max. 100 Zeichen)"),
  contact_last_name: z.string().trim().min(1, "Nachname ist erforderlich").max(100, "Nachname zu lang (max. 100 Zeichen)"),
  contact_email: z.email("Bitte gültige E-Mail-Adresse eingeben").max(254, "E-Mail-Adresse zu lang"),
  contact_phone: z
    .string()
    .trim()
    .min(5, "Bitte gebt eine Telefonnummer an")
    .max(50, "Telefonnummer zu lang"),
  contact_gender: z.enum(["maennlich", "weiblich"]).optional(),
  contact_birth_date: z.union([isoDate, z.literal("")]).optional(),
  contact_dietary_notes: z.string().max(500, "Hinweise dürfen maximal 500 Zeichen lang sein").optional(),
  guests: z.array(guestSchema).min(1, "Mindestens ein Gast erforderlich").max(50, "Zu viele Gäste"),
  extra_beds: z.number().int().min(0).max(5).default(0),
  rules_accepted: z.literal(true, "Bitte akzeptiert die Regeln der Gemeindefreizeit"),
}).refine((data) => data.guests.some((g) => g.help_areas.length > 0), {
  message: "Bitte wählt mindestens einen Bereich, in dem ihr mithelfen könnt",
  path: ["guests"],
}).refine(
  // Kinder unter 14 schicken eine leere Auswahl, die Altersprüfung macht das Formular
  (data) => data.guests.every((g) => g.help_areas.length === 0 || helpChoiceComplete(g.help_areas)),
  {
    message: `Bitte wählt bei jeder Person mindestens ${HELP_MIN_COUNT} Bereiche zum Mithelfen`,
    path: ["guests"],
  }
);

export type BookingFormData = z.infer<typeof bookingFormSchema>;
export type BookingFormInput = z.input<typeof bookingFormSchema>;
export type GuestData = z.infer<typeof guestSchema>;
