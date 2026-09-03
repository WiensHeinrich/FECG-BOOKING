import { getActiveEvent } from "@/lib/queries/events";
import { getAvailability, getHouseTypes } from "@/lib/queries/houses";
import { getRegistrationInfo } from "@/lib/utils/registration";
import { Hero } from "@/components/home/hero";
import { FactBar } from "@/components/home/fact-bar";
import { Highlights } from "@/components/home/highlights";
import { Accommodations } from "@/components/home/accommodations";
import { Steps } from "@/components/home/steps";
import { Verse } from "@/components/home/verse";
import { RegistrationCta } from "@/components/home/registration-cta";

export default async function HomePage() {
  const event = await getActiveEvent();

  if (!event) {
    return (
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Aktuell keine Freizeit geplant</h1>
          <p className="mt-2 text-muted-foreground">
            Sobald eine neue Gemeindefreizeit geplant ist, finden Sie hier alle Informationen.
          </p>
        </div>
      </div>
    );
  }

  const [houseTypes, availability] = await Promise.all([
    getHouseTypes(event.id),
    getAvailability(event.id),
  ]);

  const registration = getRegistrationInfo(event);

  return (
    <div>
      <Hero
        event={event}
        status={registration.status}
        daysUntilStart={registration.daysUntilStart}
      />
      <FactBar event={event} registration={registration} />
      <Highlights />
      <Accommodations
        houseTypes={houseTypes}
        availability={availability}
        registrationOpen={registration.status === "open"}
      />
      <Steps reservationValidityDays={event.reservation_validity_days} />
      <Verse />
      <RegistrationCta event={event} registration={registration} />
    </div>
  );
}
