"use server";

import { NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Reservation, Guest, House, HouseType } from "@/lib/types/database";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    reserviert: "Reserviert",
    bestaetigt: "Bestätigt",
    storniert: "Storniert",
    abgelaufen: "Abgelaufen",
  };
  return map[status] || status;
}

function paymentLabel(status: string) {
  const map: Record<string, string> = {
    ausstehend: "Ausstehend",
    eingegangen: "Bezahlt",
    erstattet: "Erstattet",
  };
  return map[status] || status;
}

export async function GET() {
  try {
    await requireAdminAccess();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Aktives Event laden
  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("is_active", true)
    .single();

  if (!event) {
    return NextResponse.json({ error: "Kein aktives Event" }, { status: 404 });
  }

  // Reservierungen mit Details laden
  const { data: reservations } = await supabase
    .from("reservations")
    .select(`
      *,
      house:houses!inner(
        *,
        house_type:house_types!inner(*)
      ),
      guests(*)
    `)
    .eq("event_id", event.id)
    .in("status", ["reserviert", "bestaetigt"])
    .order("created_at", { ascending: true });

  const allReservations = (reservations || []) as (Reservation & {
    house: House & { house_type: HouseType };
    guests: Guest[];
  })[];

  const today = new Date().toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const totalAmount = allReservations.reduce((sum, r) => sum + r.total_price, 0);
  const paidAmount = allReservations
    .filter((r) => r.payment_status === "eingegangen")
    .reduce((sum, r) => sum + r.total_price, 0);
  const pendingAmount = totalAmount - paidAmount;

  const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>Zahlungsübersicht – ${event.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
      font-size: 11px;
      color: #1a1a1a;
      line-height: 1.4;
      padding: 20mm 15mm;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 3px solid #6B8F4E;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .header h1 { font-size: 18px; color: #6B8F4E; }
    .header .subtitle { font-size: 12px; color: #666; margin-top: 2px; }
    .header .date { font-size: 10px; color: #999; text-align: right; }
    .summary {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
    }
    .summary-box {
      flex: 1;
      background: #f8f9fa;
      border-radius: 6px;
      padding: 10px 14px;
      border-left: 3px solid #6B8F4E;
    }
    .summary-box .label { font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
    .summary-box .value { font-size: 16px; font-weight: 700; color: #1a1a1a; margin-top: 2px; }
    .summary-box.pending { border-left-color: #d97706; }
    .summary-box.pending .value { color: #d97706; }
    .summary-box.paid { border-left-color: #16a34a; }
    .summary-box.paid .value { color: #16a34a; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
    }
    thead th {
      background: #6B8F4E;
      color: white;
      padding: 6px 8px;
      text-align: left;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    thead th:first-child { border-radius: 4px 0 0 0; }
    thead th:last-child { border-radius: 0 4px 0 0; }
    tbody td {
      padding: 5px 8px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 10.5px;
    }
    tbody tr:nth-child(even) { background: #fafafa; }
    tbody tr:hover { background: #f0f0f0; }
    .mono { font-family: 'Courier New', monospace; font-size: 10px; }
    .paid-badge {
      display: inline-block;
      background: #dcfce7;
      color: #16a34a;
      padding: 1px 6px;
      border-radius: 3px;
      font-size: 9px;
      font-weight: 600;
    }
    .pending-badge {
      display: inline-block;
      background: #fef3c7;
      color: #d97706;
      padding: 1px 6px;
      border-radius: 3px;
      font-size: 9px;
      font-weight: 600;
    }
    .text-right { text-align: right; }
    .footer {
      margin-top: 20px;
      padding-top: 10px;
      border-top: 1px solid #e5e7eb;
      font-size: 9px;
      color: #999;
      text-align: center;
    }
    .bank-info {
      margin-top: 16px;
      background: #f5f0e5;
      border-left: 3px solid #6B8F4E;
      padding: 10px 14px;
      border-radius: 0 6px 6px 0;
      font-size: 10px;
    }
    .bank-info strong { color: #6B8F4E; }
    @media print {
      body { padding: 10mm; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>FECG Trossingen e.V.</h1>
      <div class="subtitle">Zahlungsübersicht – ${event.title}</div>
    </div>
    <div class="date">
      Erstellt am ${today}<br>
      ${allReservations.length} aktive Reservierungen
    </div>
  </div>

  <div class="summary">
    <div class="summary-box">
      <div class="label">Gesamt</div>
      <div class="value">${formatCurrency(totalAmount)}</div>
    </div>
    <div class="summary-box paid">
      <div class="label">Bezahlt</div>
      <div class="value">${formatCurrency(paidAmount)}</div>
    </div>
    <div class="summary-box pending">
      <div class="label">Ausstehend</div>
      <div class="value">${formatCurrency(pendingAmount)}</div>
    </div>
  </div>

  <div class="bank-info">
    <strong>Bankverbindung:</strong>
    ${event.bank_account_holder} · IBAN: ${event.bank_iban}${event.bank_bic ? ` · BIC: ${event.bank_bic}` : ""}
  </div>

  <table>
    <thead>
      <tr>
        <th>Nr.</th>
        <th>Verwendungszweck</th>
        <th>Name</th>
        <th>Unterkunft</th>
        <th>Gäste</th>
        <th>Betrag</th>
        <th>Zahlung</th>
        <th>Datum</th>
      </tr>
    </thead>
    <tbody>
      ${allReservations
        .map(
          (r, i) => `
        <tr>
          <td>${i + 1}</td>
          <td class="mono">${r.payment_reference}</td>
          <td>${r.contact_first_name} ${r.contact_last_name}</td>
          <td>${r.house.house_type.name}<br><span style="color:#666;font-size:9px">${r.house.label || "Haus " + r.house.house_number}</span></td>
          <td>${r.guests.length}</td>
          <td class="text-right"><strong>${formatCurrency(r.total_price)}</strong></td>
          <td>${
            r.payment_status === "eingegangen"
              ? '<span class="paid-badge">Bezahlt</span>'
              : '<span class="pending-badge">Ausstehend</span>'
          }</td>
          <td>${formatDate(r.created_at)}</td>
        </tr>`
        )
        .join("")}
    </tbody>
  </table>

  <div class="footer">
    ${event.title} · ${event.location} · FECG Trossingen e.V. · Erstellt am ${today}
  </div>

  <script>
    // Automatisch Druckdialog öffnen
    window.onload = function() { window.print(); }
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
