import type { Metadata } from "next";
import { getActiveEvent } from "@/lib/queries/events";
import { getHouseTypes } from "@/lib/queries/houses";
import { getAvailability } from "@/lib/queries/houses";
import { BookingForm } from "@/components/booking/booking-form";
import { getRegistrationInfo } from "@/lib/utils/registration";
import { ratesFromEvent } from "@/lib/utils/pricing";
import { formatCurrency, formatDateBerlin } from "@/lib/utils/format";

export const metadata: Metadata = {
  title: "Anmeldung",
  description: "Melden Sie sich für die Gemeindefreizeit an und reservieren Sie Ihr Ferienhaus.",
};

export default async function AnmeldungPage() {
  const event = await getActiveEvent();

  if (!event) {
    return (
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4">
        <p className="text-muted-foreground">Keine aktive Freizeit gefunden.</p>
      </div>
    );
  }

  const registration = getRegistrationInfo(event);

  if (registration.status !== "open") {
    return (
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Anmeldung nicht möglich</h1>
          <p className="mt-2 text-muted-foreground">
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
    getAvailability(event.id),
  ]);

  const rates = ratesFromEvent(event);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold">Anmeldung</h1>
        <p className="mt-2 text-muted-foreground">
          Wählen Sie Ihre Unterkunft und tragen Sie alle Gäste ein. Zum Hauspreis kommt die
          Kurtaxe von {formatCurrency(rates.adultRate)} pro Person und Tag ab {rates.adultMinAge} Jahren
          und {formatCurrency(rates.childRate)} für Kinder von {rates.childMinAge} bis {rates.adultMinAge - 1} Jahren.
          Beides wird zusammen vorab überwiesen.
        </p>

        <div className="mt-8">
          <BookingForm
            eventId={event.id}
            eventStartDate={event.start_date}
            eventEndDate={event.end_date}
            houseTypes={houseTypes}
            availability={availability}
            reservationValidityDays={event.reservation_validity_days}
            rates={rates}
          />
        </div>
      </div>
    </div>
  );
}
