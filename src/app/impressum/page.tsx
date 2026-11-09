import type { Metadata } from "next";
import { PageHead } from "@/components/site/section";
import { siteConfig } from "@/lib/config/site";
import { getActiveEvent } from "@/lib/queries/events";

export const metadata: Metadata = {
  title: "Impressum",
  robots: { index: false },
};

export default async function ImpressumPage() {
  const event = await getActiveEvent();
  const email = event?.contact_email ?? siteConfig.contactEmail;

  return (
    <div>
      <PageHead kicker="Rechtliches" title="Impressum." />
      <section className="site-container py-[30px] wide:py-[37px]">
        <div className="panel max-w-[760px] space-y-6 text-[14px] leading-relaxed">
          <div>
            <h2 className="text-[17px] font-semibold">Angaben gemäß § 5 DDG</h2>
            <p className="mt-2">
              {siteConfig.churchLong}
              <br />
              {siteConfig.churchAddress.map((line) => (
                <span key={line}>
                  {line}
                  <br />
                </span>
              ))}
            </p>
          </div>

          <div>
            <h2 className="text-[17px] font-semibold">Vertreten durch</h2>
            <p className="mt-2 text-muted-foreground">
              Den vertretungsberechtigten Vorstand des Vereins. Namen der Vorstandsmitglieder,
              Registergericht und Vereinsregisternummer werden vor dem Start der Anmeldung ergänzt.
            </p>
          </div>

          <div>
            <h2 className="text-[17px] font-semibold">Kontakt</h2>
            <p className="mt-2">
              E-Mail:{" "}
              <a href={`mailto:${email}`} className="text-link text-[14px]">
                {email}
              </a>
              {event?.contact_phone && (
                <>
                  <br />
                  Telefon: {event.contact_phone}
                </>
              )}
            </p>
          </div>

          <div>
            <h2 className="text-[17px] font-semibold">Verantwortlich für den Inhalt</h2>
            <p className="mt-2">
              Das Organisationsteam der Gemeindefreizeit, erreichbar über die oben genannte
              E-Mail-Adresse.
            </p>
          </div>

          <div>
            <h2 className="text-[17px] font-semibold">Haftung für Inhalte und Links</h2>
            <p className="mt-2 text-muted-foreground">
              Die Inhalte dieser Seite wurden mit Sorgfalt erstellt. Für Richtigkeit, Vollständigkeit
              und Aktualität übernehmen wir keine Gewähr. Für Inhalte verlinkter externer Seiten sind
              ausschließlich deren Betreiber verantwortlich.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
