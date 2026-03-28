import { z } from "zod/v4";

export const guestSchema = z.object({
  first_name: z.string().min(1, "Vorname ist erforderlich"),
  last_name: z.string().min(1, "Nachname ist erforderlich"),
  birth_date: z.string().optional(),
  is_child: z.boolean().default(false),
  dietary_notes: z.string().optional(),
  sort_order: z.number().default(0),
});

export const bookingFormSchema = z.object({
  event_id: z.string().uuid(),
  house_type_id: z.string().uuid(),
  contact_first_name: z.string().min(1, "Vorname ist erforderlich"),
  contact_last_name: z.string().min(1, "Nachname ist erforderlich"),
  contact_email: z.email("Bitte gueltige E-Mail-Adresse eingeben"),
  contact_phone: z.string().optional(),
  guests: z.array(guestSchema).min(1, "Mindestens ein Gast erforderlich"),
});

export type BookingFormData = z.infer<typeof bookingFormSchema>;
export type GuestData = z.infer<typeof guestSchema>;
