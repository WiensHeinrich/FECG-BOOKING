import type { Metadata } from "next";
import { CoverImage } from "@/components/site/cover-image";
import { getActiveEvent } from "@/lib/queries/events";
import { getAvailability, getHouseTypes } from "@/lib/queries/houses";
import { getNights, ratesFromEvent } from "@/lib/utils/pricing";
import { PageHead } from "@/components/site/section";
import { StayComparison } from "@/components/stays/stay-comparison";
import { SitePlan } from "@/components/stays/site-plan";

export const metadata: Metadata = {
  title: "Unterkünfte",
  description:
    "Ferienhäuser, Gästehaus und Villa im Feriendorf Eckenhof Schramberg im Vergleich: Belegung, Ausstattung und Hauspreise für die Gemeindefreizeit.",
};

export default async function UnterkuenftePage() {
  const event = await getActiveEvent();

  if (!event) {
    return (
      <div className="site-container flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Keine aktive Freizeit gefunden.</p>
      </div>
    );
  }

  const [houseTypes, availability] = await Promise.all([
    getHouseTypes(event.id),
    getAvailability(event.id).catch(() => null),
  ]);
  const nights = getNights(event.start_date, event.end_date);
  const rates = ratesFromEvent(event);

  return (
    <div>
      <PageHead
        kicker="Euer Wochenende im Schwarzwald"
        title="Hier ist Platz für euch."
        text="Ferienhaus, Gästehaus oder Villa: Vergleicht die Unterkünfte in Ruhe und nehmt eure Auswahl direkt mit in die Anmeldung."
      />

      <section className="site-container mt-6 wide:mt-[26px]">
        <div className="grid items-center gap-5 rounded-2xl bg-sage p-5 wide:grid-cols-2 wide:gap-7 wide:p-[30px]">
          <CoverImage
            src="/images/ferienhaus.webp"
            alt="Holzveranda mit Sitzplatz und Blick ins Grüne."
            sizes="(min-width: 1120px) 500px, (min-width: 721px) 50vw, 100vw"
            className="h-[180px] rounded-xl wide:h-[205px]"
            imageClassName="object-[50%_75%]"
          />
          <div>
            <h2 className="cta-title">
              Ein Dorf. Viele Möglichkeiten.
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
              Eigene Küche, ein Bad und kurze Wege zueinander. Bettwäsche ist inklusive. Alle
              Unterkünfte liegen im autofreien Feriendorf Eckenhof in {event.location.replace("Feriendorf Eckenhof ", "")}.
            </p>
          </div>
        </div>
      </section>

      <section className="site-container py-[30px] wide:py-[37px]">
        <StayComparison
          houseTypes={houseTypes}
          availability={availability}
          rates={rates}
          nights={nights}
        />
      </section>

      <section id="lageplan" className="site-container scroll-mt-6 border-t border-border py-[30px] wide:py-[37px]">
        <p className="kicker mb-[9px]">Lageplan</p>
        <h2 className="display-2 mb-[9px]">Wo liegt welches Haus?</h2>
        <p className="mb-[22px] max-w-[62ch] text-muted-foreground">
          Tippt ein Haus im Plan an: Ihr seht sofort, welche Unterkunft es ist, und könnt sie direkt
          buchen. Über die Farben unter dem Plan lassen sich alle Häuser einer Art hervorheben.
        </p>
        <SitePlan houseTypes={houseTypes} availability={availability} nights={nights} />
      </section>
    </div>
  );
}
