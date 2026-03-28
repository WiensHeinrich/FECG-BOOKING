"use server";

import { requireAdminAccess } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/email/send";
import { bookingConfirmedEmail } from "@/lib/email/templates";

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
    return { error: "Zahlung konnte nicht bestaetigt werden." };
  }

  // Bestaetigungs-E-Mail senden
  const { data: reservation } = await supabase
    .from("reservations")
    .select("contact_first_name, contact_email, total_price, house:houses!inner(house_number, house_type:house_types!inner(name))")
    .eq("id", reservationId)
    .single();

  if (reservation) {
    const ht = reservation.house as unknown as { house_number: number; house_type: { name: string } };
    const email = bookingConfirmedEmail({
      firstName: reservation.contact_first_name,
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
    return { error: "Verlaengerung fehlgeschlagen." };
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
