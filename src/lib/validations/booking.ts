import { z } from "zod/v4";

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
  sort_order: z.number().default(0),
});

export const bookingFormSchema = z.object({
  event_id: z.guid(),
  house_type_id: z.guid(),
  contact_first_name: z.string().trim().min(1, "Vorname ist erforderlich").max(100, "Vorname zu lang (max. 100 Zeichen)"),
  contact_last_name: z.string().trim().min(1, "Nachname ist erforderlich").max(100, "Nachname zu lang (max. 100 Zeichen)"),
  contact_email: z.email("Bitte gültige E-Mail-Adresse eingeben").max(254, "E-Mail-Adresse zu lang"),
  contact_phone: z.string().max(50, "Telefonnummer zu lang").optional(),
  contact_gender: z.enum(["maennlich", "weiblich"]).optional(),
  contact_birth_date: z.union([isoDate, z.literal("")]).optional(),
  contact_dietary_notes: z.string().max(500, "Hinweise dürfen maximal 500 Zeichen lang sein").optional(),
  guests: z.array(guestSchema).min(1, "Mindestens ein Gast erforderlich").max(50, "Zu viele Gäste"),
  extra_beds: z.number().int().min(0).max(5).default(0),
  rules_accepted: z.literal(true, "Bitte akzeptieren Sie die Regeln der Gemeindefreizeit"),
});

export type BookingFormData = z.infer<typeof bookingFormSchema>;
export type BookingFormInput = z.input<typeof bookingFormSchema>;
export type GuestData = z.infer<typeof guestSchema>;
