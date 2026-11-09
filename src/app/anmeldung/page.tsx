import type { Metadata } from "next";
import { getActiveEvent } from "@/lib/queries/events";
import { getAvailability, getHouseTypes } from "@/lib/queries/houses";
import { BookingWizard } from "@/components/booking/booking-wizard";
import { getRegistrationInfo } from "@/lib/utils/registration";
import { ratesFromEvent } from "@/lib/utils/pricing";
import { formatDateBerlin } from "@/lib/utils/format";
import { PageHead } from "@/components/site/section";

export const metadata: Metadata = {
  title: "Anmeldung",
  description: "Melden Sie sich für die Gemeindefreizeit an und reservieren Sie Ihre Unterkunft.",
};

interface Props {
  searchParams: Promise<{ unterkunft?: string }>;
}

export default async function AnmeldungPage({ searchParams }: Props) {
  const event = await getActiveEvent();
  const { unterkunft } = await searchParams;

  if (!event) {
    return (
      <div className="site-container flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Keine aktive Freizeit gefunden.</p>
      </div>
    );
  }

  const registration = getRegistrationInfo(event);

  if (registration.status !== "open") {
    return (
      <div className="site-container flex min-h-[60vh] items-center justify-center">
        <div className="max-w-[60ch] text-center">
          <h1 className="page-title">Anmeldung nicht möglich</h1>
          <p className="mt-3 text-muted-foreground">
            {registration.status === "upcoming"
              ? `Die Anmeldung startet am ${formatDateBerlin(event.registration_start)}.`
              : "Die Anmeldefrist ist leider abgelaufen."}
          </p>
        </div>
      </div>
    );
  }

  const [houseTypes, availability] = await Promise.all([
    getHouseTypes(event.id),
    getAvailability(event.id).catch(() => null),
  ]);

  const rates = ratesFromEvent(event);
  const initial = unterkunft
    ? houseTypes.find((ht) => ht.slug === unterkunft || ht.id === unterkunft)
    : undefined;

  return (
    <div>
      <PageHead
        kicker="Schön, dass ihr dabei seid"
        title="Ein paar Angaben. Dann seid ihr dabei."
        text="Wählt eure Unterkunft und tragt alle Mitreisenden ein. Vor dem Absenden könnt ihr alles noch einmal prüfen."
      />
      <section className="site-container pb-[38px] pt-7">
        <BookingWizard
          eventId={event.id}
          eventStartDate={event.start_date}
          eventEndDate={event.end_date}
          houseTypes={houseTypes}
          availability={availability}
          reservationValidityDays={event.reservation_validity_days}
          rates={rates}
          initialHouseTypeId={initial?.id ?? null}
        />
      </section>
    </div>
  );
}
