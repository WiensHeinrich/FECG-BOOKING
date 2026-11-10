"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  bookingFormSchema,
  type BookingFormData,
  type BookingFormInput,
} from "@/lib/validations/booking";
import { sendEmail } from "@/lib/email/send";
import {
  reservationConfirmationEmail,
  adminNewReservationEmail,
  type PriceBreakdown,
} from "@/lib/email/templates";
import { ADMIN_EMAIL } from "@/lib/email/resend";
import type { Reservation } from "@/lib/types/database";

interface ReservationResult {
  id: string;
  payment_reference: string;
  expires_at: string;
  confirmation_token: string;
}

async function sendReservationEmails(data: BookingFormData, result: ReservationResult) {
  const supabase = createAdminClient();

  const [{ data: event }, { data: houseType }, { data: reservation }] = await Promise.all([
    supabase
      .from("events")
      .select("bank_account_holder, bank_iban, bank_bic")
      .eq("id", data.event_id)
      .single(),
    supabase.from("house_types").select("name").eq("id", data.house_type_id).single(),
    supabase
      .from("reservations")
      .select("*, house:houses!inner(house_number, label)")
      .eq("id", result.id)
      .single(),
  ]);

  if (!event || !houseType || !reservation) {
    console.error("[Email] Daten für Reservierungsmail fehlen", {
      event: !!event,
      houseType: !!houseType,
      reservation: !!reservation,
    });
    return;
  }

  const r = reservation as Reservation & { house: { house_number: number; label: string | null } };
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const confirmationUrl = `${siteUrl}/anmeldung/bestaetigung?id=${result.id}&token=${encodeURIComponent(result.confirmation_token)}`;

  const guestData = data.guests.map((g) => ({
    first_name: g.first_name,
    last_name: g.last_name,
    birth_date: g.birth_date || null,
    is_child: g.is_child,
    gender: g.gender || null,
    dietary_notes: g.dietary_notes || null,
  }));

  const breakdown: PriceBreakdown = {
    accommodationPrice: r.accommodation_price,
    touristTax: r.tourist_tax,
    extraBeds: r.extra_beds ?? 0,
    extraBedTotal: r.extra_bed_total,
    nights: r.pricing_nights,
  };

  const email = reservationConfirmationEmail({
    firstName: data.contact_first_name,
    lastName: data.contact_last_name,
    contactEmail: data.contact_email,
    contactPhone: data.contact_phone ?? null,
    contactGender: data.contact_gender ?? null,
    houseTypeName: houseType.name,
    houseLabel: r.house.label || `Haus ${r.house.house_number}`,
    totalPrice: r.total_price,
    breakdown,
    paymentReference: result.payment_reference,
    expiresAt: result.expires_at,
    bankAccountHolder: event.bank_account_holder,
    bankIban: event.bank_iban,
    bankBic: event.bank_bic,
    confirmationUrl,
    guests: guestData,
  });

  await sendEmail({ to: data.contact_email, ...email });

  const adminEmail = adminNewReservationEmail({
    firstName: data.contact_first_name,
    lastName: data.contact_last_name,
    email: data.contact_email,
    phone: data.contact_phone ?? null,
    contactGender: data.contact_gender ?? null,
    houseTypeName: houseType.name,
    totalPrice: r.total_price,
    breakdown,
    paymentReference: result.payment_reference,
    guests: guestData,
  });
  await sendEmail({ to: ADMIN_EMAIL, ...adminEmail });
}

export async function createReservation(formData: BookingFormInput) {
  const parsed = bookingFormSchema.safeParse(formData);

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      error: first?.message
        ? `Bitte überprüfen Sie Ihre Eingaben: ${first.message}`
        : "Ungültige Eingaben. Bitte überprüfen Sie Ihre Daten.",
    };
  }

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("dein-projekt") ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return { error: "Reservierungen sind in dieser Umgebung nicht verfügbar." };
  }

  const data = parsed.data;
  const supabase = await createClient();

  const callRpc = () =>
    supabase.rpc("create_public_reservation", {
      p_event_id: data.event_id,
      p_house_type_id: data.house_type_id,
      p_contact_first_name: data.contact_first_name,
      p_contact_last_name: data.contact_last_name,
      p_contact_email: data.contact_email,
      p_contact_phone: data.contact_phone ?? null,
      p_contact_gender: data.contact_gender ?? null,
      p_contact_birth_date: data.contact_birth_date || null,
      p_contact_dietary_notes: data.contact_dietary_notes ?? null,
      p_guests: data.guests,
      p_extra_beds: data.extra_beds,
      p_rules_accepted: data.rules_accepted,
    });

  // Buchen zwei Familien im selben Moment, greifen beide nach demselben Haus und die
  // Datenbank lehnt die zweite Anfrage ab (23505). Ein neuer Versuch nimmt das nächste freie Haus.
  let { data: result, error } = await callRpc();
  for (let attempt = 0; attempt < 4 && error?.code === "23505"; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 80 + attempt * 120));
    ({ data: result, error } = await callRpc());
  }

  if (error) {
    console.error("RPC create_public_reservation error:", error.message, error.code, error.details);
    return {
      error:
        "Die Reservierung konnte gerade nicht gespeichert werden. Bitte versucht es in einem Moment noch einmal.",
    };
  }

  const reservation = result as (ReservationResult & { error?: string }) | null;

  if (reservation?.error === "Kein Haus verfügbar.") {
    // Die Seite lädt die freien Plätze neu und bietet dann die Warteliste an
    revalidatePath("/", "layout");
    return {
      error:
        "Diese Unterkunft wurde gerade eben vergeben. Ihr könnt euch auf die Warteliste setzen oder eine andere Unterkunft wählen.",
      soldOut: true,
    };
  }

  if (reservation?.error || !reservation?.id || !reservation?.confirmation_token) {
    console.error("RPC result error:", result);
    return {
      error: reservation?.error || "Reservierung fehlgeschlagen. Bitte versuchen Sie es erneut.",
    };
  }

  // E-Mails erst nach der Antwort versenden, damit der Redirect nicht wartet,
  // der Versand aber trotzdem sicher zu Ende läuft.
  after(() => sendReservationEmails(data, reservation).catch(console.error));

  // Verfügbarkeit auf den zwischengespeicherten Seiten sofort aktualisieren
  revalidatePath("/", "layout");

  redirect(
    `/anmeldung/bestaetigung?id=${reservation.id}&token=${encodeURIComponent(reservation.confirmation_token)}`
  );
}
