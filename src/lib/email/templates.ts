// E-Mail Templates als HTML-Strings
// Einfach und robust - kein React-Email nötig

// HTML-Escape für alle Nutzereingaben, damit nichts ungewollt als HTML gerendert wird
function esc(s: string | number | null | undefined): string {
  if (s === null || s === undefined) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

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
  border-bottom: 3px solid #00ADD6;
  margin-bottom: 24px;
`;

const cardStyle = `
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin: 16px 0;
`;

const highlightStyle = `
  background: #e8f7fb;
  border-left: 4px solid #00ADD6;
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

const guestCardStyle = `
  background: #ffffff;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  padding: 12px 16px;
  margin: 8px 0;
`;

function row(label: string, value: string) {
  return `<tr>
    <td style="padding: 6px 0; color: #666;">${label}</td>
    <td style="padding: 6px 0; font-weight: 600; text-align: right;">${value}</td>
  </tr>`;
}

function formatIban(iban: string) {
  return iban.replace(/\s/g, "").replace(/(.{4})/g, "$1 ").trim();
}

function formatEuro(amount: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

function greeting(firstName: string, gender: string | undefined | null) {
  const name = esc(firstName);
  if (gender === "weiblich") return `Liebe ${name}`;
  if (gender === "maennlich") return `Lieber ${name}`;
  return `Liebe/r ${name}`;
}

function formatGender(gender: string | undefined | null) {
  if (gender === "maennlich") return "Männlich";
  if (gender === "weiblich") return "Weiblich";
  return "–";
}

function formatBirthDate(date: string | undefined | null) {
  if (!date) return "–";
  return new Date(date).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export interface PriceBreakdown {
  accommodationPrice: number | null;
  touristTax: number | null;
  extraBeds: number;
  extraBedTotal: number | null;
  nights: number | null;
}

/** Preiszeilen für E-Mails: Hauspreis, Zustellbetten, Kurtaxe, Gesamtbetrag */
function priceRows(totalPrice: number, breakdown?: PriceBreakdown | null) {
  if (!breakdown || breakdown.accommodationPrice === null || breakdown.accommodationPrice === undefined) {
    return row("Gesamtbetrag", `<strong>${formatEuro(totalPrice)}</strong>`);
  }
  const nights = breakdown.nights ?? 1;
  return [
    row("Hauspreis", formatEuro(breakdown.accommodationPrice)),
    breakdown.extraBeds > 0
      ? row(`Zustellbetten (${breakdown.extraBeds} x ${nights} ${nights === 1 ? "Tag" : "Tage"})`, formatEuro(breakdown.extraBedTotal ?? 0))
      : "",
    row(`Kurtaxe (${nights} ${nights === 1 ? "Tag" : "Tage"})`, formatEuro(breakdown.touristTax ?? 0)),
    row("Gesamtbetrag", `<strong>${formatEuro(totalPrice)}</strong>`),
  ].join("");
}

export interface GuestEmailData {
  first_name: string;
  last_name: string;
  birth_date?: string | null;
  is_child?: boolean;
  gender?: string | null;
  dietary_notes?: string | null;
}

function renderGuestList(guests: GuestEmailData[]) {
  if (!guests || guests.length === 0) return "";

  return `
    <div style="${cardStyle}">
      <h3 style="margin-top: 0; color: #00ADD6;">Angemeldete Gäste (${guests.length})</h3>
      ${guests
        .map(
          (g, i) => `
        <div style="${guestCardStyle}">
          <strong>${i + 1}. ${esc(g.first_name)} ${esc(g.last_name)}</strong>
          ${g.is_child ? ' <span style="background: #fef3c7; color: #92400e; padding: 1px 6px; border-radius: 3px; font-size: 11px;">Kind</span>' : ""}
          <div style="margin-top: 4px; font-size: 13px; color: #666;">
            Geb.: ${formatBirthDate(g.birth_date)} · Geschlecht: ${formatGender(g.gender)}${g.dietary_notes ? ` · Hinweise: ${esc(g.dietary_notes)}` : ""}
          </div>
        </div>`
        )
        .join("")}
    </div>`;
}

// 1. Reservierungsbestätigung (nach Buchung)
export function reservationConfirmationEmail(data: {
  firstName: string;
  lastName: string;
  contactEmail: string;
  contactPhone: string | null;
  contactGender: string | null;
  houseTypeName: string;
  houseLabel: string;
  totalPrice: number;
  breakdown?: PriceBreakdown | null;
  paymentReference: string;
  expiresAt: string;
  bankAccountHolder: string;
  bankIban: string;
  bankBic: string | null;
  confirmationUrl: string;
  guests: GuestEmailData[];
}) {
  const expiryDate = new Date(data.expiresAt).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return {
    subject: `Reservierung bestätigt - ${data.houseTypeName}`,
    html: `<div style="${baseStyle}">
      <div style="${headerStyle}">
        <h1 style="color: #00ADD6; margin: 0; font-size: 24px;">FECG Gemeindefreizeit 2027</h1>
      </div>

      <h2 style="margin-top: 0;">${greeting(data.firstName, data.contactGender)},</h2>
      <p>Eure Reservierung wurde erfolgreich erstellt! Bitte überweist den Gesamtbetrag (Hauspreis und Kurtaxe) bis zum <strong>${expiryDate}</strong>.</p>

      <div style="${cardStyle}">
        <h3 style="margin-top: 0; color: #00ADD6;">Eure Reservierung</h3>
        <table style="width: 100%; border-collapse: collapse;">
          ${row("Unterkunft", `${esc(data.houseTypeName)} - ${esc(data.houseLabel)}`)}
          ${priceRows(data.totalPrice, data.breakdown)}
          ${row("Gültig bis", expiryDate)}
        </table>
        <p style="margin: 12px 0 0; font-size: 13px; color: #666;">Wir bemühen uns, euch genau dieses Haus zu geben. Ein Anspruch auf eine bestimmte Hausnummer besteht jedoch nicht, in Ausnahmefällen kann sich die Nummer noch ändern.</p>
      </div>

      <div style="${cardStyle}">
        <h3 style="margin-top: 0; color: #00ADD6;">Kontaktperson</h3>
        <table style="width: 100%; border-collapse: collapse;">
          ${row("Name", `${esc(data.firstName)} ${esc(data.lastName)}`)}
          ${row("E-Mail", esc(data.contactEmail))}
          ${data.contactPhone ? row("Telefon", esc(data.contactPhone)) : ""}
          ${data.contactGender ? row("Geschlecht", formatGender(data.contactGender)) : ""}
        </table>
      </div>

      ${renderGuestList(data.guests)}

      <div style="${highlightStyle}">
        <h3 style="margin-top: 0; color: #00ADD6;">Überweisungsdaten</h3>
        <table style="width: 100%; border-collapse: collapse;">
          ${row("Empfänger", esc(data.bankAccountHolder))}
          ${row("IBAN", esc(formatIban(data.bankIban)))}
          ${data.bankBic ? row("BIC", esc(data.bankBic)) : ""}
          ${row("Verwendungszweck", `<strong>${esc(data.paymentReference)}</strong>`)}
          ${row("Betrag", `<strong>${formatEuro(data.totalPrice)}</strong>`)}
        </table>
      </div>

      <p style="font-size: 13px; color: #666;">
        Bitte gebt unbedingt den <strong>Verwendungszweck</strong> an, damit wir eure Zahlung zuordnen können.
      </p>

      <p style="font-size: 13px; color: #666;">
        <a href="${data.confirmationUrl}" style="color: #00ADD6;">Bestätigungsseite nochmal öffnen</a>
        &nbsp;&middot;&nbsp;
        <a href="${data.confirmationUrl}" style="color: #999;">Reservierung stornieren</a>
      </p>

      <div style="${footerStyle}">
        <p>Mit freundlichen Grüßen,<br/>Das Organisationsteam<br/>FECG Trossingen e.V. &middot; Gemeindefreizeit</p>
      </div>
    </div>`,
  };
}

// 1b. Admin-Benachrichtigung bei neuer Reservierung
export function adminNewReservationEmail(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  contactGender: string | null;
  houseTypeName: string;
  totalPrice: number;
  breakdown?: PriceBreakdown | null;
  paymentReference: string;
  guests: GuestEmailData[];
}) {
  return {
    subject: `Neue Reservierung: ${data.firstName} ${data.lastName} - ${data.houseTypeName}`,
    html: `<div style="${baseStyle}">
      <div style="${headerStyle}">
        <h1 style="color: #00ADD6; margin: 0; font-size: 24px;">Neue Reservierung eingegangen</h1>
      </div>

      <p>Es wurde eine neue Reservierung erstellt:</p>

      <div style="${cardStyle}">
        <h3 style="margin-top: 0; color: #00ADD6;">Kontaktperson</h3>
        <table style="width: 100%; border-collapse: collapse;">
          ${row("Name", `${esc(data.firstName)} ${esc(data.lastName)}`)}
          ${row("E-Mail", esc(data.email))}
          ${data.phone ? row("Telefon", esc(data.phone)) : ""}
          ${data.contactGender ? row("Geschlecht", formatGender(data.contactGender)) : ""}
          ${row("Unterkunft", esc(data.houseTypeName))}
          ${priceRows(data.totalPrice, data.breakdown)}
          ${row("Verwendungszweck", `<strong>${esc(data.paymentReference)}</strong>`)}
        </table>
      </div>

      ${renderGuestList(data.guests)}

      <div style="${footerStyle}">
        <p>Mit freundlichen Grüßen,<br/>Das Organisationsteam<br/>FECG Trossingen e.V. &middot; Gemeindefreizeit</p>
      </div>
    </div>`,
  };
}

// 2. Buchungsbestätigung (nach Zahlungseingang)
export function bookingConfirmedEmail(data: {
  firstName: string;
  contactGender: string | null;
  houseTypeName: string;
  houseLabel: string;
  totalPrice: number;
}) {
  return {
    subject: `Zahlung bestätigt - eure Buchung ist sicher!`,
    html: `<div style="${baseStyle}">
      <div style="${headerStyle}">
        <h1 style="color: #00ADD6; margin: 0; font-size: 24px;">FECG Gemeindefreizeit 2027</h1>
      </div>

      <h2 style="margin-top: 0;">${greeting(data.firstName, data.contactGender)},</h2>
      <p>Eure Zahlung ist eingegangen. Eure Buchung ist damit bestätigt! 🎉</p>

      <div style="${cardStyle}">
        <table style="width: 100%; border-collapse: collapse;">
          ${row("Unterkunft", `${esc(data.houseTypeName)} - ${esc(data.houseLabel)}`)}
          ${row("Betrag", formatEuro(data.totalPrice))}
          ${row("Status", '<span style="color: #16a34a; font-weight: bold;">Bestätigt</span>')}
        </table>
      </div>

      <p>Wir freuen uns auf eine wunderbare und gesegnete Zeit!</p>

      <div style="${footerStyle}">
        <p>Mit freundlichen Grüßen,<br/>Das Organisationsteam<br/>FECG Trossingen e.V. &middot; Gemeindefreizeit</p>
      </div>
    </div>`,
  };
}

// 3. Zahlungserinnerung (3 Tage vor Ablauf)
export function paymentReminderEmail(data: {
  firstName: string;
  contactGender: string | null;
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
    subject: `Erinnerung: Zahlung bis ${expiryDate} fällig`,
    html: `<div style="${baseStyle}">
      <div style="${headerStyle}">
        <h1 style="color: #00ADD6; margin: 0; font-size: 24px;">FECG Gemeindefreizeit 2027</h1>
      </div>

      <h2 style="margin-top: 0;">${greeting(data.firstName, data.contactGender)},</h2>
      <p>Eure Reservierung für <strong>${esc(data.houseTypeName)}</strong> läuft am <strong>${expiryDate}</strong> ab. Bitte überweist den Betrag rechtzeitig, damit eure Buchung nicht verfällt.</p>

      <div style="${highlightStyle}">
        <h3 style="margin-top: 0; color: #00ADD6;">Überweisungsdaten</h3>
        <table style="width: 100%; border-collapse: collapse;">
          ${row("Empfänger", esc(data.bankAccountHolder))}
          ${row("IBAN", esc(formatIban(data.bankIban)))}
          ${data.bankBic ? row("BIC", esc(data.bankBic)) : ""}
          ${row("Verwendungszweck", `<strong>${esc(data.paymentReference)}</strong>`)}
          ${row("Betrag", `<strong>${formatEuro(data.totalPrice)}</strong>`)}
        </table>
      </div>

      <div style="${footerStyle}">
        <p>Mit freundlichen Grüßen,<br/>Das Organisationsteam<br/>FECG Trossingen e.V. &middot; Gemeindefreizeit</p>
      </div>
    </div>`,
  };
}

// 4. Warteliste-Bestätigung (an den Gast)
export function waitlistConfirmationEmail(data: {
  firstName: string;
  contactGender: string | null;
  houseTypeName: string;
  position: number;
  guests: GuestEmailData[];
}) {
  return {
    subject: `Warteliste bestätigt - ${data.houseTypeName} (Platz ${data.position})`,
    html: `<div style="${baseStyle}">
      <div style="${headerStyle}">
        <h1 style="color: #00ADD6; margin: 0; font-size: 24px;">FECG Gemeindefreizeit 2027</h1>
      </div>

      <h2 style="margin-top: 0;">${greeting(data.firstName, data.contactGender)},</h2>
      <p>Ihr wurdet erfolgreich auf die <strong>Warteliste</strong> für <strong>${esc(data.houseTypeName)}</strong> gesetzt.</p>

      <div style="${cardStyle}">
        <h3 style="margin-top: 0; color: #00ADD6;">Euer Platz auf der Warteliste</h3>
        <table style="width: 100%; border-collapse: collapse;">
          ${row("Unterkunftstyp", esc(data.houseTypeName))}
          ${row("Position", `<strong>Platz ${data.position}</strong>`)}
        </table>
      </div>

      ${renderGuestList(data.guests)}

      <div style="${highlightStyle}">
        <p style="margin: 0;"><strong>Wie geht es weiter?</strong></p>
        <p style="margin: 8px 0 0 0;">Sobald eine Unterkunft dieses Typs frei wird, benachrichtigen wir euch und überführen eure Anmeldung in eine verbindliche Reservierung. Ihr erhaltet dann eine E-Mail mit allen Zahlungsdaten.</p>
      </div>

      <div style="${footerStyle}">
        <p>Mit freundlichen Grüßen,<br/>Das Organisationsteam<br/>FECG Trossingen e.V. &middot; Gemeindefreizeit</p>
      </div>
    </div>`,
  };
}

// 5. Warteliste-Benachrichtigung (an Admin)
export function adminNewWaitlistEmail(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  contactGender: string | null;
  houseTypeName: string;
  position: number;
  guestCount: number;
  guests: GuestEmailData[];
}) {
  return {
    subject: `Neue Warteliste: ${data.firstName} ${data.lastName} - ${data.houseTypeName} (Platz ${data.position})`,
    html: `<div style="${baseStyle}">
      <div style="${headerStyle}">
        <h1 style="color: #00ADD6; margin: 0; font-size: 24px;">Neuer Warteliste-Eintrag</h1>
      </div>

      <p>Es wurde ein neuer Warteliste-Eintrag erstellt:</p>

      <div style="${cardStyle}">
        <h3 style="margin-top: 0; color: #00ADD6;">Kontaktperson</h3>
        <table style="width: 100%; border-collapse: collapse;">
          ${row("Name", `${esc(data.firstName)} ${esc(data.lastName)}`)}
          ${row("E-Mail", esc(data.email))}
          ${data.phone ? row("Telefon", esc(data.phone)) : ""}
          ${data.contactGender ? row("Geschlecht", formatGender(data.contactGender)) : ""}
          ${row("Unterkunftstyp", esc(data.houseTypeName))}
          ${row("Gästeanzahl", String(data.guestCount))}
          ${row("Warteliste-Position", `<strong>Platz ${data.position}</strong>`)}
        </table>
      </div>

      ${renderGuestList(data.guests)}

      <div style="${footerStyle}">
        <p>FECG Trossingen e.V. &middot; Gemeindefreizeit</p>
      </div>
    </div>`,
  };
}

// 6. Stornierungsbenachrichtigung (an den Gast)
export function cancellationEmail(data: {
  firstName: string;
  contactGender: string | null;
  houseTypeName: string;
  reason: string;
}) {
  return {
    subject: `Reservierung storniert - ${data.houseTypeName}`,
    html: `<div style="${baseStyle}">
      <div style="${headerStyle}">
        <h1 style="color: #00ADD6; margin: 0; font-size: 24px;">FECG Gemeindefreizeit 2027</h1>
      </div>

      <h2 style="margin-top: 0;">${greeting(data.firstName, data.contactGender)},</h2>
      <p>Eure Reservierung für <strong>${esc(data.houseTypeName)}</strong> wurde leider storniert.</p>

      <div style="${highlightStyle}">
        <p style="margin: 0;"><strong>Grund der Stornierung:</strong></p>
        <p style="margin: 8px 0 0 0;">${esc(data.reason)}</p>
      </div>

      <p>Falls ihr Fragen habt, wendet euch bitte an das Organisationsteam.</p>
      <p>Falls noch Unterkünfte verfügbar sind, könnt ihr euch gerne erneut anmelden.</p>

      <div style="${footerStyle}">
        <p>Mit freundlichen Grüßen,<br/>Das Organisationsteam<br/>FECG Trossingen e.V. &middot; Gemeindefreizeit</p>
      </div>
    </div>`,
  };
}

// 7. Reservierung abgelaufen
export function reservationExpiredEmail(data: {
  firstName: string;
  contactGender: string | null;
  houseTypeName: string;
}) {
  return {
    subject: `Reservierung abgelaufen - ${data.houseTypeName}`,
    html: `<div style="${baseStyle}">
      <div style="${headerStyle}">
        <h1 style="color: #00ADD6; margin: 0; font-size: 24px;">FECG Gemeindefreizeit 2027</h1>
      </div>

      <h2 style="margin-top: 0;">${greeting(data.firstName, data.contactGender)},</h2>
      <p>Leider ist eure Reservierung für <strong>${esc(data.houseTypeName)}</strong> abgelaufen, da keine Zahlung eingegangen ist.</p>
      <p>Falls noch Unterkünfte verfügbar sind, könnt ihr euch gerne erneut anmelden.</p>

      <div style="${footerStyle}">
        <p>Mit freundlichen Grüßen,<br/>Das Organisationsteam<br/>FECG Trossingen e.V. &middot; Gemeindefreizeit</p>
      </div>
    </div>`,
  };
}
