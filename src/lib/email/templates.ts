// E-Mail Templates als HTML-Strings
// Einfach und robust - kein React-Email noetig

const baseStyle = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #1a1a1a;
  line-height: 1.6;
  max-width: 600px;
  margin: 0 auto;
  padding: 24px;
`;

const headerStyle = `
  text-align: center;
  padding: 24px 0;
  border-bottom: 3px solid #29B6D1;
  margin-bottom: 24px;
`;

const cardStyle = `
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin: 16px 0;
`;

const highlightStyle = `
  background: #f0fafb;
  border-left: 4px solid #29B6D1;
  padding: 16px;
  border-radius: 0 8px 8px 0;
  margin: 16px 0;
`;

const footerStyle = `
  margin-top: 32px;
  padding-top: 16px;
  border-top: 1px solid #e5e5e5;
  text-align: center;
  color: #888;
  font-size: 12px;
`;

function row(label: string, value: string) {
  return `<tr>
    <td style="padding: 6px 0; color: #666;">${label}</td>
    <td style="padding: 6px 0; font-weight: 600; text-align: right;">${value}</td>
  </tr>`;
}

function formatEuro(amount: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

// 1. Reservierungsbestaetigung (nach Buchung)
export function reservationConfirmationEmail(data: {
  firstName: string;
  lastName: string;
  houseTypeName: string;
  houseLabel: string;
  totalPrice: number;
  paymentReference: string;
  expiresAt: string;
  bankAccountHolder: string;
  bankIban: string;
  bankBic: string | null;
  confirmationUrl: string;
}) {
  const expiryDate = new Date(data.expiresAt).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return {
    subject: `Reservierung bestaetigt - ${data.houseTypeName}`,
    html: `<div style="${baseStyle}">
      <div style="${headerStyle}">
        <h1 style="color: #29B6D1; margin: 0; font-size: 24px;">FECG Gemeindefreizeit</h1>
      </div>

      <h2 style="margin-top: 0;">Hallo ${data.firstName},</h2>
      <p>Ihre Reservierung wurde erfolgreich erstellt! Bitte ueberweisen Sie den Betrag bis zum <strong>${expiryDate}</strong>.</p>

      <div style="${cardStyle}">
        <h3 style="margin-top: 0; color: #29B6D1;">Ihre Reservierung</h3>
        <table style="width: 100%; border-collapse: collapse;">
          ${row("Unterkunft", `${data.houseTypeName} - ${data.houseLabel}`)}
          ${row("Kontaktperson", `${data.firstName} ${data.lastName}`)}
          ${row("Betrag", formatEuro(data.totalPrice))}
          ${row("Gueltig bis", expiryDate)}
        </table>
      </div>

      <div style="${highlightStyle}">
        <h3 style="margin-top: 0; color: #29B6D1;">Ueberweisungsdaten</h3>
        <table style="width: 100%; border-collapse: collapse;">
          ${row("Empfaenger", data.bankAccountHolder)}
          ${row("IBAN", `<span style="font-family: monospace;">${data.bankIban}</span>`)}
          ${data.bankBic ? row("BIC", `<span style="font-family: monospace;">${data.bankBic}</span>`) : ""}
          ${row("Verwendungszweck", `<strong style="font-family: monospace;">${data.paymentReference}</strong>`)}
          ${row("Betrag", `<strong>${formatEuro(data.totalPrice)}</strong>`)}
        </table>
      </div>

      <p style="font-size: 13px; color: #666;">
        Bitte geben Sie unbedingt den <strong>Verwendungszweck</strong> an, damit wir Ihre Zahlung zuordnen koennen.
      </p>

      <p style="font-size: 13px; color: #666;">
        <a href="${data.confirmationUrl}" style="color: #29B6D1;">Bestaetigungsseite nochmal oeffnen</a>
      </p>

      <div style="${footerStyle}">
        <p>FECG Trossingen e.V. &middot; Gemeindefreizeit</p>
      </div>
    </div>`,
  };
}

// 2. Buchungsbestaetigung (nach Zahlungseingang)
export function bookingConfirmedEmail(data: {
  firstName: string;
  houseTypeName: string;
  houseLabel: string;
  totalPrice: number;
}) {
  return {
    subject: `Zahlung bestaetigt - Ihre Buchung ist sicher!`,
    html: `<div style="${baseStyle}">
      <div style="${headerStyle}">
        <h1 style="color: #29B6D1; margin: 0; font-size: 24px;">FECG Gemeindefreizeit</h1>
      </div>

      <h2 style="margin-top: 0;">Hallo ${data.firstName},</h2>
      <p>Ihre Zahlung ist eingegangen. Ihre Buchung ist damit bestaetigt! 🎉</p>

      <div style="${cardStyle}">
        <table style="width: 100%; border-collapse: collapse;">
          ${row("Unterkunft", `${data.houseTypeName} - ${data.houseLabel}`)}
          ${row("Betrag", formatEuro(data.totalPrice))}
          ${row("Status", '<span style="color: #16a34a; font-weight: bold;">Bestaetigt</span>')}
        </table>
      </div>

      <p>Wir freuen uns auf eine wunderbare gemeinsame Zeit!</p>

      <div style="${footerStyle}">
        <p>FECG Trossingen e.V. &middot; Gemeindefreizeit</p>
      </div>
    </div>`,
  };
}

// 3. Zahlungserinnerung (3 Tage vor Ablauf)
export function paymentReminderEmail(data: {
  firstName: string;
  houseTypeName: string;
  totalPrice: number;
  paymentReference: string;
  expiresAt: string;
  bankAccountHolder: string;
  bankIban: string;
  bankBic: string | null;
}) {
  const expiryDate = new Date(data.expiresAt).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return {
    subject: `Erinnerung: Zahlung bis ${expiryDate} faellig`,
    html: `<div style="${baseStyle}">
      <div style="${headerStyle}">
        <h1 style="color: #29B6D1; margin: 0; font-size: 24px;">FECG Gemeindefreizeit</h1>
      </div>

      <h2 style="margin-top: 0;">Hallo ${data.firstName},</h2>
      <p>Ihre Reservierung fuer <strong>${data.houseTypeName}</strong> laeuft am <strong>${expiryDate}</strong> ab. Bitte ueberweisen Sie den Betrag rechtzeitig, damit Ihre Buchung nicht verfaellt.</p>

      <div style="${highlightStyle}">
        <h3 style="margin-top: 0; color: #29B6D1;">Ueberweisungsdaten</h3>
        <table style="width: 100%; border-collapse: collapse;">
          ${row("Empfaenger", data.bankAccountHolder)}
          ${row("IBAN", `<span style="font-family: monospace;">${data.bankIban}</span>`)}
          ${data.bankBic ? row("BIC", `<span style="font-family: monospace;">${data.bankBic}</span>`) : ""}
          ${row("Verwendungszweck", `<strong style="font-family: monospace;">${data.paymentReference}</strong>`)}
          ${row("Betrag", `<strong>${formatEuro(data.totalPrice)}</strong>`)}
        </table>
      </div>

      <div style="${footerStyle}">
        <p>FECG Trossingen e.V. &middot; Gemeindefreizeit</p>
      </div>
    </div>`,
  };
}

// 4. Reservierung abgelaufen
export function reservationExpiredEmail(data: {
  firstName: string;
  houseTypeName: string;
}) {
  return {
    subject: `Reservierung abgelaufen - ${data.houseTypeName}`,
    html: `<div style="${baseStyle}">
      <div style="${headerStyle}">
        <h1 style="color: #29B6D1; margin: 0; font-size: 24px;">FECG Gemeindefreizeit</h1>
      </div>

      <h2 style="margin-top: 0;">Hallo ${data.firstName},</h2>
      <p>Leider ist Ihre Reservierung fuer <strong>${data.houseTypeName}</strong> abgelaufen, da keine Zahlung eingegangen ist.</p>
      <p>Falls noch Unterkuenfte verfuegbar sind, koennen Sie sich gerne erneut anmelden.</p>

      <div style="${footerStyle}">
        <p>FECG Trossingen e.V. &middot; Gemeindefreizeit</p>
      </div>
    </div>`,
  };
}
