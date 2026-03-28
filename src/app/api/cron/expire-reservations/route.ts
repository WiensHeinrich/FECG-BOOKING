import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import {
  reservationExpiredEmail,
  paymentReminderEmail,
} from "@/lib/email/templates";

export async function GET(request: NextRequest) {
  // Cron-Secret pruefen
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  let expired = 0;
  let reminders = 0;

  // 1. Abgelaufene Reservierungen markieren
  const { data: expiredReservations } = await supabase
    .from("reservations")
    .select(
      "id, contact_first_name, contact_email, house_id, house:houses!inner(house_type:house_types!inner(name))"
    )
    .eq("status", "reserviert")
    .lt("expires_at", new Date().toISOString());

  if (expiredReservations && expiredReservations.length > 0) {
    for (const r of expiredReservations) {
      // Status auf abgelaufen setzen
      await supabase
        .from("reservations")
        .update({ status: "abgelaufen" })
        .eq("id", r.id);

      // Haus freigeben
      await supabase
        .from("houses")
        .update({ is_available: true })
        .eq("id", r.house_id);

      // E-Mail senden
      const ht = r.house as unknown as { house_type: { name: string } };
      const email = reservationExpiredEmail({
        firstName: r.contact_first_name,
        houseTypeName: ht.house_type.name,
      });
      sendEmail({ to: r.contact_email, ...email }).catch(console.error);
      expired++;
    }
  }

  // 2. Zahlungserinnerungen (3 Tage vor Ablauf)
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

  const { data: soonExpiring } = await supabase
    .from("reservations")
    .select(
      `id, contact_first_name, contact_email, total_price, payment_reference, expires_at, admin_notes,
       house:houses!inner(house_type:house_types!inner(name)),
       event:events!inner(bank_account_holder, bank_iban, bank_bic)`
    )
    .eq("status", "reserviert")
    .eq("payment_status", "ausstehend")
    .lt("expires_at", threeDaysFromNow.toISOString())
    .gt("expires_at", new Date().toISOString());

  if (soonExpiring && soonExpiring.length > 0) {
    for (const r of soonExpiring) {
      // Nur einmal erinnern (admin_notes als Flag nutzen)
      if (r.admin_notes?.includes("[reminder-sent]")) continue;

      const ht = r.house as unknown as { house_type: { name: string } };
      const ev = r.event as unknown as {
        bank_account_holder: string;
        bank_iban: string;
        bank_bic: string | null;
      };

      const email = paymentReminderEmail({
        firstName: r.contact_first_name,
        houseTypeName: ht.house_type.name,
        totalPrice: r.total_price,
        paymentReference: r.payment_reference,
        expiresAt: r.expires_at,
        bankAccountHolder: ev.bank_account_holder,
        bankIban: ev.bank_iban,
        bankBic: ev.bank_bic,
      });

      sendEmail({ to: r.contact_email, ...email }).catch(console.error);

      // Flag setzen
      await supabase
        .from("reservations")
        .update({
          admin_notes: [r.admin_notes, "[reminder-sent]"]
            .filter(Boolean)
            .join(" "),
        })
        .eq("id", r.id);

      reminders++;
    }
  }

  return NextResponse.json({
    ok: true,
    expired,
    reminders,
    timestamp: new Date().toISOString(),
  });
}
