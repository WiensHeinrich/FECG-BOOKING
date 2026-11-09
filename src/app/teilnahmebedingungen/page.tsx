import type { Metadata } from "next";
import { PageHead } from "@/components/site/section";
import { RulesContent } from "@/components/booking/rules-content";
import { getActiveEvent } from "@/lib/queries/events";

export const metadata: Metadata = {
  title: "Teilnahmebedingungen",
  description: "Regeln und Teilnahmebedingungen der Gemeindefreizeit der FECG Trossingen e.V.",
};

export default async function TeilnahmebedingungenPage() {
  const event = await getActiveEvent();
  return (
    <div>
      <PageHead
        kicker="Regeln der Gemeindefreizeit"
        title="Teilnahmebedingungen."
        text="Diese Regeln gelten für alle Teilnehmenden und werden mit der Anmeldung anerkannt."
      />
      <section className="site-container py-[30px] wide:py-[37px]">
        <div className="panel max-w-[760px]">
          <RulesContent reservationValidityDays={event?.reservation_validity_days ?? 14} />
        </div>
      </section>
    </div>
  );
}
