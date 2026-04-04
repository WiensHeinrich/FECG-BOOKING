"use server";

import { requireAdminAccess } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/email/send";
import { bookingConfirmedEmail, reservationConfirmationEmail } from "@/lib/email/templates";
import { ADMIN_EMAIL } from "@/lib/email/resend";

export async function confirmPayment(reservationId: string) {
  await requireAdminAccess();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("reservations")
    .update({
      status: "bestaetigt",
      payment_status: "eingegangen",
      payment_confirmed_at: new Date().toISOString(),
    })
    .eq("id", reservationId);

  if (error) {
    return { error: "Zahlung konnte nicht bestätigt werden." };
  }

  // Bestätigungs-E-Mail senden
  const { data: reservation } = await supabase
    .from("reservations")
    .select("contact_first_name, contact_email, contact_gender, total_price, house:houses!inner(house_number, house_type:house_types!inner(name))")
    .eq("id", reservationId)
    .single();

  if (reservation) {
    const ht = reservation.house as unknown as { house_number: number; house_type: { name: string } };
    const email = bookingConfirmedEmail({
      firstName: reservation.contact_first_name,
      contactGender: reservation.contact_gender ?? null,
      houseTypeName: ht.house_type.name,
      houseLabel: `Haus ${ht.house_number}`,
      totalPrice: reservation.total_price,
    });
    sendEmail({ to: reservation.contact_email, ...email }).catch(console.error);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/reservierungen");
  return { success: true };
}

export async function cancelReservation(
  reservationId: string,
  notes?: string
) {
  await requireAdminAccess();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("reservations")
    .update({
      status: "storniert",
      cancelled_at: new Date().toISOString(),
      admin_notes: notes || null,
    })
    .eq("id", reservationId);

  if (error) {
    return { error: "Stornierung fehlgeschlagen." };
  }

  // Haus wieder freigeben
  const { data: reservation } = await supabase
    .from("reservations")
    .select("house_id")
    .eq("id", reservationId)
    .single();

  if (reservation) {
    await supabase
      .from("houses")
      .update({ is_available: true })
      .eq("id", reservation.house_id);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/reservierungen");
  revalidatePath("/admin/haeuser");
  return { success: true };
}

export async function deleteReservation(reservationId: string) {
  await requireAdminAccess();
  const supabase = createAdminClient();

  // 1. Haus-ID laden, damit wir es danach freigeben können
  const { data: reservation } = await supabase
    .from("reservations")
    .select("house_id")
    .eq("id", reservationId)
    .single();

  // 2. Gäste löschen
  await supabase
    .from("guests")
    .delete()
    .eq("reservation_id", reservationId);

  // 3. Reservierung löschen
  const { error } = await supabase
    .from("reservations")
    .delete()
    .eq("id", reservationId);

  if (error) {
    console.error("Delete reservation error:", error);
    return { error: "Reservierung konnte nicht gelöscht werden." };
  }

  // 4. Haus wieder freigeben
  if (reservation?.house_id) {
    await supabase
      .from("houses")
      .update({ is_available: true })
      .eq("id", reservation.house_id);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/reservierungen");
  revalidatePath("/admin/haeuser");
  revalidatePath("/admin/warteliste");
  revalidatePath("/anmeldung");
  return { success: true };
}

export async function extendReservation(reservationId: string, days: number) {
  await requireAdminAccess();
  const supabase = createAdminClient();

  const { data: reservation } = await supabase
    .from("reservations")
    .select("expires_at")
    .eq("id", reservationId)
    .single();

  if (!reservation) {
    return { error: "Reservierung nicht gefunden." };
  }

  const newExpiry = new Date(reservation.expires_at);
  newExpiry.setDate(newExpiry.getDate() + days);

  const { error } = await supabase
    .from("reservations")
    .update({ expires_at: newExpiry.toISOString() })
    .eq("id", reservationId);

  if (error) {
    return { error: "Verlängerung fehlgeschlagen." };
  }

  revalidatePath("/admin/reservierungen");
  return { success: true };
}

export async function updateAdminNotes(
  reservationId: string,
  notes: string
) {
  await requireAdminAccess();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("reservations")
    .update({ admin_notes: notes })
    .eq("id", reservationId);

  if (error) {
    return { error: "Notiz konnte nicht gespeichert werden." };
  }

  revalidatePath("/admin/reservierungen");
  return { success: true };
}

export async function updateEventSettings(
  eventId: string,
  data: {
    title?: string;
    description?: string;
    location?: string;
    location_address?: string;
    start_date?: string;
    end_date?: string;
    registration_start?: string;
    registration_end?: string;
    contact_email?: string;
    contact_phone?: string;
    bank_account_holder?: string;
    bank_iban?: string;
    bank_bic?: string;
    bank_reference_prefix?: string;
  }
) {
  await requireAdminAccess();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("events")
    .update(data)
    .eq("id", eventId);

  if (error) {
    return { error: "Einstellungen konnten nicht gespeichert werden." };
  }

  revalidatePath("/admin/einstellungen");
  revalidatePath("/");
  return { success: true };
}

export async function removeFromWaitlist(entryId: string) {
  await requireAdminAccess();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("waitlist")
    .delete()
    .eq("id", entryId);

  if (error) {
    return { error: "Eintrag konnte nicht entfernt werden." };
  }

  revalidatePath("/admin/warteliste");
  return { success: true };
}

export async function convertWaitlistToReservation(waitlistEntryId: string) {
  await requireAdminAccess();
  const supabase = createAdminClient();

  // 1. Warteliste-Eintrag laden
  const { data: entry, error: entryError } = await supabase
    .from("waitlist")
    .select("*, house_type:house_types!inner(name, price_per_house)")
    .eq("id", waitlistEntryId)
    .single();

  if (entryError || !entry) {
    return { error: "Wartelisteneintrag nicht gefunden." };
  }

  if (entry.status !== "wartend") {
    return { error: "Dieser Eintrag ist nicht mehr wartend." };
  }

  // 2. Freies Haus suchen
  const { data: house } = await supabase
    .from("houses")
    .select("id, house_number, label")
    .eq("house_type_id", entry.house_type_id)
    .eq("is_available", true)
    .order("house_number")
    .limit(100);

  if (!house || house.length === 0) {
    return { error: "Keine freien Häuser für diesen Unterkunftstyp." };
  }

  // Prüfe welches Haus keine aktive Reservierung hat
  let freeHouse = null;
  for (const h of house) {
    const { data: existing } = await supabase
      .from("reservations")
      .select("id")
      .eq("house_id", h.id)
      .in("status", ["reserviert", "bestaetigt"])
      .limit(1);

    if (!existing || existing.length === 0) {
      freeHouse = h;
      break;
    }
  }

  if (!freeHouse) {
    return { error: "Alle Häuser dieses Typs sind belegt." };
  }

  // 3. Event-Daten laden
  const { data: event } = await supabase
    .from("events")
    .select("bank_account_holder, bank_iban, bank_bic, bank_reference_prefix, reservation_validity_days")
    .eq("id", entry.event_id)
    .single();

  if (!event) {
    return { error: "Event nicht gefunden." };
  }

  // 4. Reservierung erstellen
  const reservationId = crypto.randomUUID();
  const confirmationToken = crypto.randomUUID().replace(/-/g, "");
  const paymentReference =
    (event.bank_reference_prefix || "GF") + "-" + reservationId.split("-")[0].toUpperCase();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (event.reservation_validity_days || 14));

  const ht = entry.house_type as unknown as { name: string; price_per_house: number };

  const { error: insertError } = await supabase
    .from("reservations")
    .insert({
      id: reservationId,
      event_id: entry.event_id,
      house_id: freeHouse.id,
      contact_first_name: entry.contact_first_name,
      contact_last_name: entry.contact_last_name,
      contact_email: entry.contact_email,
      contact_phone: entry.contact_phone,
      contact_gender: entry.contact_gender ?? null,
      total_price: ht.price_per_house,
      payment_reference: paymentReference,
      expires_at: expiresAt.toISOString(),
      confirmation_token_hash: await hashToken(confirmationToken),
      status: "reserviert",
      payment_status: "ausstehend",
    });

  if (insertError) {
    console.error("Insert reservation error:", insertError);
    return { error: `Reservierung konnte nicht erstellt werden: ${insertError.message}` };
  }

  // 5. Gäste aus guests_json übernehmen
  const guestsJson = (entry as unknown as { guests_json: unknown[] }).guests_json;
  if (guestsJson && Array.isArray(guestsJson) && guestsJson.length > 0) {
    const guestRows = guestsJson.map((rawG: unknown, i: number) => {
      const g = rawG as Record<string, unknown>;
      return ({
      reservation_id: reservationId,
      first_name: (g.first_name as string) || "",
      last_name: (g.last_name as string) || "",
      birth_date: g.birth_date && g.birth_date !== "" ? g.birth_date : null,
      is_child: g.is_child ?? false,
      gender: g.gender || null,
      dietary_notes: g.dietary_notes || null,
      sort_order: i,
    });
    });

    await supabase.from("guests").insert(guestRows);
  }

  // 6. Warteliste-Eintrag als umgewandelt markieren
  await supabase
    .from("waitlist")
    .update({
      status: "umgewandelt",
      converted_reservation_id: reservationId,
    })
    .eq("id", waitlistEntryId);

  // 7. Bestätigungs-E-Mail an den Gast senden
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const confirmationUrl = `${siteUrl}/anmeldung/bestaetigung?id=${reservationId}&token=${encodeURIComponent(confirmationToken)}`;

  const emailGuests = (guestsJson || []).map((rawG: unknown) => {
    const g = rawG as Record<string, unknown>;
    return {
      first_name: (g.first_name as string) || "",
      last_name: (g.last_name as string) || "",
      birth_date: (g.birth_date as string) || null,
      is_child: (g.is_child as boolean) ?? false,
      gender: (g.gender as string) || null,
      dietary_notes: (g.dietary_notes as string) || null,
    };
  });

  const email = reservationConfirmationEmail({
    firstName: entry.contact_first_name,
    lastName: entry.contact_last_name,
    contactEmail: entry.contact_email,
    contactPhone: entry.contact_phone,
    contactGender: entry.contact_gender ?? null,
    houseTypeName: ht.name,
    houseLabel: freeHouse.label || `Haus ${freeHouse.house_number}`,
    totalPrice: ht.price_per_house,
    paymentReference,
    expiresAt: expiresAt.toISOString(),
    bankAccountHolder: event.bank_account_holder,
    bankIban: event.bank_iban,
    bankBic: event.bank_bic,
    confirmationUrl,
    guests: emailGuests,
  });

  sendEmail({ to: entry.contact_email, ...email }).catch(console.error);

  revalidatePath("/admin");
  revalidatePath("/admin/warteliste");
  revalidatePath("/admin/reservierungen");
  revalidatePath("/admin/haeuser");
  revalidatePath("/anmeldung");
  return { success: true };
}

// Hilfsfunktion: Token hashen (SHA-256)
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
