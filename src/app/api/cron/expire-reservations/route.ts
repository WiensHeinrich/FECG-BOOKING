import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { paymentReminderEmail } from "@/lib/email/templates";
import { ADMIN_EMAIL } from "@/lib/email/resend";

export async function GET(request: NextRequest) {
  // Cron-Secret pruefen
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  let reminders = 0;
  let overdueNotifications = 0;

  // 1. Zahlungserinnerungen an Gäste (3 Tage vor Ablauf der Frist)
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

  const { data: soonExpiring } = await supabase
    .from("reservations")
    .select(
      `id, contact_first_name, contact_email, contact_gender, total_price, payment_reference, expires_at, admin_notes,
       house:houses!inner(house_type:house_types!inner(name)),
       event:events!inner(bank_account_holder, bank_iban, bank_bic)`
    )
    .eq("status", "reserviert")
    .eq("payment_status", "ausstehend")
    .lt("expires_at", threeDaysFromNow.toISOString())
    .gt("expires_at", new Date().toISOString());

  if (soonExpiring && soonExpiring.length > 0) {
    for (const r of soonExpiring) {
      if (r.admin_notes?.includes("[reminder-sent]")) continue;

      const ht = r.house as unknown as { house_type: { name: string } };
      const ev = r.event as unknown as {
        bank_account_holder: string;
        bank_iban: string;
        bank_bic: string | null;
      };

      const email = paymentReminderEmail({
        firstName: r.contact_first_name,
        contactGender: (r as unknown as { contact_gender: string | null }).contact_gender ?? null,
        houseTypeName: ht.house_type.name,
        totalPrice: r.total_price,
        paymentReference: r.payment_reference,
        expiresAt: r.expires_at,
        bankAccountHolder: ev.bank_account_holder,
        bankIban: ev.bank_iban,
        bankBic: ev.bank_bic,
      });

      sendEmail({ to: r.contact_email, ...email }).catch(console.error);

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

  // 2. Admin-Benachrichtigung über überfällige Reservierungen (Frist abgelaufen, noch nicht bezahlt)
  const { data: overdueReservations } = await supabase
    .from("reservations")
    .select(
      `id, contact_first_name, contact_last_name, contact_email, total_price, payment_reference, expires_at, admin_notes,
       house:houses!inner(house_type:house_types!inner(name))`
    )
    .eq("status", "reserviert")
    .eq("payment_status", "ausstehend")
    .lt("expires_at", new Date().toISOString());

  if (overdueReservations && overdueReservations.length > 0) {
    // Nur einmal pro Tag benachrichtigen
    const overdueToNotify = overdueReservations.filter(
      (r) => !r.admin_notes?.includes("[overdue-notified]")
    );

    if (overdueToNotify.length > 0) {
      const lines = overdueToNotify.map((r) => {
        const ht = r.house as unknown as { house_type: { name: string } };
        const expiryDate = new Date(r.expires_at).toLocaleDateString("de-DE");
        return `<tr>
          <td style="padding:6px;border-bottom:1px solid #eee;">${r.contact_first_name} ${r.contact_last_name}</td>
          <td style="padding:6px;border-bottom:1px solid #eee;">${r.contact_email}</td>
          <td style="padding:6px;border-bottom:1px solid #eee;">${ht.house_type.name}</td>
          <td style="padding:6px;border-bottom:1px solid #eee;">${expiryDate}</td>
        </tr>`;
      });

      await sendEmail({
        to: ADMIN_EMAIL,
        subject: `⚠️ ${overdueToNotify.length} überfällige Reservierung(en) — Zahlung ausstehend`,
        html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
          <h2 style="color:#b45309;">Überfällige Reservierungen</h2>
          <p>Die folgenden Reservierungen haben die Zahlungsfrist überschritten und wurden <strong>nicht automatisch storniert</strong>. Bitte prüfe den Zahlungseingang und storniere ggf. manuell im Admin-Dashboard.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <tr style="background:#f5f0e5;">
              <th style="padding:8px;text-align:left;">Name</th>
              <th style="padding:8px;text-align:left;">E-Mail</th>
              <th style="padding:8px;text-align:left;">Unterkunft</th>
              <th style="padding:8px;text-align:left;">Frist</th>
            </tr>
            ${lines.join("")}
          </table>
          <p style="color:#666;font-size:13px;">FECG Trossingen e.V. · Gemeindefreizeit</p>
        </div>`,
      });

      // Flag setzen damit nicht nochmal benachrichtigt wird
      for (const r of overdueToNotify) {
        await supabase
          .from("reservations")
          .update({
            admin_notes: [r.admin_notes, "[overdue-notified]"]
              .filter(Boolean)
              .join(" "),
          })
          .eq("id", r.id);
      }

      overdueNotifications = overdueToNotify.length;
    }
  }

  return NextResponse.json({
    ok: true,
    reminders,
    overdueNotifications,
    timestamp: new Date().toISOString(),
  });
}
