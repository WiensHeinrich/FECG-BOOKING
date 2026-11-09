import type { Metadata } from "next";
import { PageHead } from "@/components/site/section";
import { siteConfig } from "@/lib/config/site";
import { getActiveEvent } from "@/lib/queries/events";

export const metadata: Metadata = {
  title: "Datenschutz",
  robots: { index: false },
};

export default async function DatenschutzPage() {
  const event = await getActiveEvent();
  const email = event?.contact_email ?? siteConfig.contactEmail;
  const validity = event?.reservation_validity_days ?? 14;

  return (
    <div>
      <PageHead
        kicker="Rechtliches"
        title="Datenschutzhinweise."
        text="Welche Daten wir bei der Anmeldung zur Gemeindefreizeit verarbeiten, wofür und wie lange."
      />
      <section className="site-container py-[30px] wide:py-[37px]">
        <div className="panel max-w-[760px] space-y-6 text-[14px] leading-relaxed">
          <Block title="Verantwortlicher">
            <p>
              {siteConfig.churchLong}, {siteConfig.churchAddress.join(", ")}.
              <br />
              E-Mail:{" "}
              <a href={`mailto:${email}`} className="text-link text-[14px]">
                {email}
              </a>
            </p>
          </Block>

          <Block title="Welche Daten wir bei der Anmeldung erheben">
            <p>
              Zur Reservierung einer Unterkunft erfassen wir von der Kontaktperson Vorname, Nachname,
              E-Mail-Adresse, Geschlecht sowie optional Telefonnummer, Geburtsdatum und Hinweise. Von
              allen Mitreisenden erfassen wir Vorname, Nachname, Geschlecht und Geburtsdatum sowie
              optional Hinweise, zum Beispiel zu Unverträglichkeiten.
            </p>
          </Block>

          <Block title="Wofür wir die Daten brauchen">
            <ul className="list-disc space-y-1 pl-5">
              <li>Zuteilung der Unterkünfte und Organisation der Freizeit (Vertragserfüllung, Art. 6 Abs. 1 lit. b DSGVO).</li>
              <li>Berechnung der Kurtaxe nach dem Alter der Mitreisenden und Abführung an das Feriendorf (rechtliche Verpflichtung gegenüber dem Vermieter, Art. 6 Abs. 1 lit. b und c DSGVO).</li>
              <li>Versand von Reservierungs-, Zahlungs- und Erinnerungsmails an die Kontaktperson.</li>
              <li>Hinweise zu Unverträglichkeiten oder besonderem Bedarf verarbeiten wir nur, soweit ihr sie freiwillig angebt (Art. 9 Abs. 2 lit. a DSGVO). Sie sind ausschließlich für das Organisationsteam sichtbar.</li>
            </ul>
          </Block>

          <Block title="Wer die Daten verarbeitet">
            <p>
              Die Website wird bei Vercel Inc. betrieben, die Buchungsdaten liegen in einer Datenbank
              bei Supabase Inc. im Rechenzentrum Frankfurt am Main (EU). E-Mails versenden wir über den
              Dienst Resend. Mit diesen Dienstleistern bestehen Auftragsverarbeitungsverträge. Eine
              Weitergabe an das Feriendorf erfolgt nur in Form der Teilnehmerzahl je Altersgruppe für
              die Kurtaxe und der Belegungsliste der Häuser.
            </p>
          </Block>

          <Block title="Wie lange wir die Daten speichern">
            <p>
              Reservierungen, die nicht innerhalb von {validity} Tagen bezahlt werden, verfallen.
              Buchungs- und Zahlungsdaten bewahren wir nach der Freizeit so lange auf, wie es die
              steuer- und vereinsrechtlichen Aufbewahrungspflichten verlangen, Teilnehmerlisten mit
              Hinweisen löschen wir spätestens drei Monate nach der Freizeit.
            </p>
          </Block>

          <Block title="Cookies und Zugriffsdaten">
            <p>
              Die öffentlichen Seiten setzen keine Cookies und verwenden keine Analyse- oder
              Werbedienste. Nur der Verwaltungsbereich nutzt ein technisch notwendiges Sitzungs-Cookie
              für die Anmeldung des Organisationsteams. Beim Aufruf der Seiten speichert der
              Hosting-Dienstleister technisch bedingt Zugriffsdaten wie IP-Adresse, Zeitpunkt und
              aufgerufene Seite für kurze Zeit in Protokolldateien.
            </p>
          </Block>

          <Block title="Eure Rechte">
            <p>
              Ihr habt das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung
              und Datenübertragbarkeit sowie ein Widerspruchsrecht. Eine erteilte Einwilligung könnt
              ihr jederzeit widerrufen. Wendet euch dafür an die oben genannte E-Mail-Adresse. Außerdem
              könnt ihr euch bei der zuständigen Aufsichtsbehörde beschweren, für Baden-Württemberg ist
              das der Landesbeauftragte für den Datenschutz und die Informationsfreiheit.
            </p>
          </Block>
        </div>
      </section>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-[17px] font-semibold">{title}</h2>
      <div className="mt-2 text-foreground/85">{children}</div>
    </div>
  );
}
