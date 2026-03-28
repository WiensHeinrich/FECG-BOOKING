import type { Metadata } from "next";
import { getActiveEvent } from "@/lib/queries/events";
import { getHouseTypes } from "@/lib/queries/houses";
import { getAvailability } from "@/lib/queries/houses";
import { BookingForm } from "@/components/booking/booking-form";

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

  const now = new Date();
  const registrationOpen =
    new Date(event.registration_start) <= now &&
    now <= new Date(event.registration_end);

  if (!registrationOpen) {
    return (
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Anmeldung nicht möglich</h1>
          <p className="mt-2 text-muted-foreground">
            {now < new Date(event.registration_start)
              ? `Die Anmeldung startet am ${new Date(event.registration_start).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" })}.`
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

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold">Anmeldung</h1>
        <p className="mt-2 text-muted-foreground">
          Wählen Sie Ihre Unterkunft und tragen Sie alle Gäste ein.
        </p>

        <div className="mt-8">
          <BookingForm
            eventId={event.id}
            houseTypes={houseTypes}
            availability={availability}
            reservationValidityDays={event.reservation_validity_days}
          />
        </div>
      </div>
    </div>
  );
}
