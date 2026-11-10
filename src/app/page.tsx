import { getActiveEvent } from "@/lib/queries/events";
import { getAvailability, getHouseTypes } from "@/lib/queries/houses";
import { getNights } from "@/lib/utils/pricing";
import { ARRIVAL_TIME, DEPARTURE_TIME } from "@/lib/config/stay-times";
import {
  ClosingCta,
  Experiences,
  Hero,
  Prepared,
  StaysPreview,
  Verse,
} from "@/components/home/sections";

export default async function HomePage() {
  const event = await getActiveEvent();

  if (!event) {
    return (
      <div className="site-container flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h1 className="page-title">Aktuell keine Freizeit geplant</h1>
          <p className="mt-3 text-muted-foreground">
            Sobald eine neue Gemeindefreizeit geplant ist, findet ihr hier alle Informationen.
          </p>
        </div>
      </div>
    );
  }

  const [houseTypes, availability] = await Promise.all([
    getHouseTypes(event.id),
    getAvailability(event.id).catch(() => null),
  ]);
  const nights = getNights(event.start_date, event.end_date);

  return (
    <div>
      <Hero event={event} nights={nights} />
      <StaysPreview houseTypes={houseTypes} availability={availability} nights={nights} />
      <Experiences />
      <Verse />
      <Prepared arrival={ARRIVAL_TIME} departure={DEPARTURE_TIME} />
      <ClosingCta
        title="Seid ihr dabei?"
        text="Findet eure Unterkunft und meldet euch gemeinsam an."
        href="/unterkuenfte"
        label="Unterkunft auswählen"
      />
    </div>
  );
}
