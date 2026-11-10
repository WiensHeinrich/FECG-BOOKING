import type { Metadata } from "next";
import Image from "next/image";
import { getActiveEvent } from "@/lib/queries/events";
import { getAvailability, getHouseTypes } from "@/lib/queries/houses";
import { getNights, ratesFromEvent } from "@/lib/utils/pricing";
import { PageHead } from "@/components/site/section";
import { StayComparison } from "@/components/stays/stay-comparison";

export const metadata: Metadata = {
  title: "Unterkünfte",
  description:
    "Ferienhäuser, Gästehaus und Apartments im Feriendorf Eckenhof Schramberg im Vergleich: Belegung, Ausstattung und Hauspreise für die Gemeindefreizeit.",
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
        text="Ferienhaus, Gästehaus oder Apartment: Vergleicht die Unterkünfte in Ruhe und nehmt eure Auswahl direkt mit in die Anmeldung."
      />

      <section className="site-container mt-6 wide:mt-[26px]">
        <div className="grid items-center gap-5 rounded-2xl bg-sage p-5 wide:grid-cols-2 wide:gap-7 wide:p-[30px]">
          <Image
            src="/images/ferienhaus.webp"
            alt="Illustration: Ferienhaus im Feriendorf Eckenhof"
            width={1000}
            height={1501}
            sizes="(min-width: 721px) 50vw, 100vw"
            className="h-[180px] w-full rounded-xl object-cover object-[center_45%] wide:h-[205px]"
          />
          <div>
            <h2 className="font-serif text-[31px] font-normal leading-[1.15] tracking-[-0.5px]">
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
    </div>
  );
}
