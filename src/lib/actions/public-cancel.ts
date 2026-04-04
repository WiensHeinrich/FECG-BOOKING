"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/email/send";
import { cancellationEmail } from "@/lib/email/templates";
import { ADMIN_EMAIL } from "@/lib/email/resend";

async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function publicCancelReservation(
  reservationId: string,
  token: string,
  reason: string,
  details?: string
) {
  const supabase = createAdminClient();

  // 1. Token validieren
  const tokenHash = await hashToken(token);

  const { data: reservation } = await supabase
    .from("reservations")
    .select(
      "id, status, confirmation_token_hash, house_id, contact_first_name, contact_email, contact_gender, house:houses!inner(house_type:house_types!inner(name))"
    )
    .eq("id", reservationId)
    .single();

  if (!reservation) {
    return { error: "Reservierung nicht gefunden." };
  }

  if (reservation.confirmation_token_hash !== tokenHash) {
    return { error: "Ungültiger Zugangslink." };
  }

  if (reservation.status !== "reserviert") {
    return { error: "Diese Reservierung kann nicht mehr storniert werden." };
  }

  // 2. Stornierungsgrund aufbereiten
  const reasonText =
    reason === "terminlich_verhindert"
      ? "Terminlich verhindert"
      : reason === "persoenliche_gruende"
      ? "Persönliche Gründe"
      : details || "Sonstiger Grund";

  const fullReason = details && reason !== "sonstiges"
    ? `${reasonText} — ${details}`
    : reasonText;

  // 3. Reservierung stornieren
  const { error } = await supabase
    .from("reservations")
    .update({
      status: "storniert",
      cancelled_at: new Date().toISOString(),
      admin_notes: `Selbst storniert: ${fullReason}`,
    })
    .eq("id", reservationId);

  if (error) {
    return { error: "Stornierung fehlgeschlagen." };
  }

  // 4. Haus freigeben
  if (reservation.house_id) {
    await supabase
      .from("houses")
      .update({ is_available: true })
      .eq("id", reservation.house_id);
  }

  // 5. Stornierungs-E-Mail an den Gast
  const ht = reservation.house as unknown as { house_type: { name: string } };
  const email = cancellationEmail({
    firstName: reservation.contact_first_name,
    contactGender: reservation.contact_gender ?? null,
    houseTypeName: ht.house_type.name,
    reason: fullReason,
  });
  sendEmail({ to: reservation.contact_email, ...email }).catch(console.error);

  // 6. Info-E-Mail an Admin
  sendEmail({
    to: ADMIN_EMAIL,
    subject: `Selbst-Stornierung: ${reservation.contact_first_name} — ${ht.house_type.name}`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
      <h2 style="color:#b45309;">Reservierung vom Gast storniert</h2>
      <p><strong>${reservation.contact_first_name}</strong> (${reservation.contact_email}) hat die Reservierung für <strong>${ht.house_type.name}</strong> selbst storniert.</p>
      <p><strong>Grund:</strong> ${fullReason}</p>
      <p style="color:#666;font-size:13px;">Das Haus wurde automatisch wieder freigegeben.</p>
    </div>`,
  }).catch(console.error);

  revalidatePath("/admin");
  revalidatePath("/admin/reservierungen");
  revalidatePath("/admin/haeuser");
  revalidatePath("/admin/warteliste");
  revalidatePath("/anmeldung");

  return { success: true };
}
