"use server";

import { createClient } from "@/lib/supabase/server";
import {
  bookingFormSchema,
  type BookingFormData,
} from "@/lib/validations/booking";
import { redirect } from "next/navigation";

export async function createReservation(formData: BookingFormData) {
  const parsed = bookingFormSchema.safeParse(formData);

  if (!parsed.success) {
    return { error: "Ungueltige Eingaben. Bitte ueberpruefen Sie Ihre Daten." };
  }

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("dein-projekt") ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return { error: "Reservierungen sind in dieser Umgebung nicht verfuegbar." };
  }

  const data = parsed.data;
  const supabase = await createClient();

  const { data: result, error } = await supabase.rpc(
    "create_public_reservation",
    {
      p_event_id: data.event_id,
      p_house_type_id: data.house_type_id,
      p_contact_first_name: data.contact_first_name,
      p_contact_last_name: data.contact_last_name,
      p_contact_email: data.contact_email,
      p_contact_phone: data.contact_phone ?? null,
      p_guests: data.guests,
    }
  );

  if (error) {
    return { error: "Reservierung fehlgeschlagen. Bitte versuchen Sie es erneut." };
  }

  if (result?.error || !result?.id || !result?.confirmation_token) {
    return {
      error:
        result?.error || "Reservierung fehlgeschlagen. Bitte versuchen Sie es erneut.",
    };
  }

  redirect(
    `/anmeldung/bestaetigung?id=${result.id}&token=${encodeURIComponent(
      result.confirmation_token
    )}`
  );
}
