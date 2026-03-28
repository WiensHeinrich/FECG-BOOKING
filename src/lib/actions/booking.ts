"use server";

import { createClient } from "@/lib/supabase/server";
import {
  bookingFormSchema,
  type BookingFormData,
} from "@/lib/validations/booking";
import { redirect } from "next/navigation";
import { sendEmail } from "@/lib/email/send";
import { reservationConfirmationEmail } from "@/lib/email/templates";
import { createAdminClient } from "@/lib/supabase/admin";

async function sendReservationEmail(
  data: BookingFormData,
  result: { id: string; payment_reference: string; expires_at: string; confirmation_token: string }
) {
  const supabase = createAdminClient();

  // Event- und Haustyp-Daten fuer die E-Mail laden
  const [{ data: event }, { data: houseType }] = await Promise.all([
    supabase.from("events").select("bank_account_holder, bank_iban, bank_bic").eq("id", data.event_id).single(),
    supabase.from("house_types").select("name, price_per_house").eq("id", data.house_type_id).single(),
  ]);

  if (!event || !houseType) {
    console.error("[Email] Missing data - event:", !!event, "houseType:", !!houseType);
    return;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const confirmationUrl = `${siteUrl}/anmeldung/bestaetigung?id=${result.id}&token=${encodeURIComponent(result.confirmation_token)}`;

  const email = reservationConfirmationEmail({
    firstName: data.contact_first_name,
    lastName: data.contact_last_name,
    houseTypeName: houseType.name,
    houseLabel: `Haus`,
    totalPrice: houseType.price_per_house,
    paymentReference: result.payment_reference,
    expiresAt: result.expires_at,
    bankAccountHolder: event.bank_account_holder,
    bankIban: event.bank_iban,
    bankBic: event.bank_bic,
    confirmationUrl,
  });

  await sendEmail({ to: data.contact_email, ...email });
}

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
    console.error("RPC create_public_reservation error:", error.message, error.code, error.details);
    return { error: `Reservierung fehlgeschlagen: ${error.message}` };
  }

  if (result?.error || !result?.id || !result?.confirmation_token) {
    console.error("RPC result error:", result);
    return {
      error:
        result?.error || "Reservierung fehlgeschlagen. Bitte versuchen Sie es erneut.",
    };
  }

  // E-Mail senden (async, blockiert nicht den Redirect)
  sendReservationEmail(data, result).catch(console.error);

  redirect(
    `/anmeldung/bestaetigung?id=${result.id}&token=${encodeURIComponent(
      result.confirmation_token
    )}`
  );
}
