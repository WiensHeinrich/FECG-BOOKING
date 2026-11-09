"use client";

import { useState, useTransition, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Plus, Trash2, AlertCircle, X, UserCheck, BedDouble } from "lucide-react";
import { HouseTypeCard } from "./house-type-card";
import { createReservation } from "@/lib/actions/booking";
import { joinWaitlist } from "@/lib/actions/waitlist";
import { formatCurrency } from "@/lib/utils/format";
import {
  calculateBookingPrice,
  getAgeAtDate,
  type PricingRates,
} from "@/lib/utils/pricing";
import type { HouseType, Availability } from "@/lib/types/database";
import type { GuestData } from "@/lib/validations/booking";

interface BookingFormProps {
  eventId: string;
  eventStartDate: string;
  eventEndDate: string;
  houseTypes: HouseType[];
  availability: Availability[];
  reservationValidityDays: number;
  rates: PricingRates;
}

const CHILD_AGE_LIMIT = 14;

const emptyGuest: GuestData = {
  first_name: "",
  last_name: "",
  birth_date: "",
  is_child: false,
  gender: undefined,
  dietary_notes: "",
  sort_order: 0,
};

export function BookingForm({
  eventId,
  eventStartDate,
  eventEndDate,
  houseTypes,
  availability,
  reservationValidityDays,
  rates,
}: BookingFormProps) {
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [contact, setContact] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    gender: "" as "" | "maennlich" | "weiblich",
    birth_date: "",
    dietary_notes: "",
  });
  const [guests, setGuests] = useState<GuestData[]>([{ ...emptyGuest }]);
  const [extraBeds, setExtraBeds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const contactSectionRef = useRef<HTMLElement>(null);

  // Sanfter Scroll zur Kontaktsektion nach Auswahl, nicht ganz nach oben,
  // damit die ausgewählte Unterkunft noch sichtbar bleibt
  function scrollToContactSection() {
    setTimeout(() => {
      const el = contactSectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const offset = window.scrollY + rect.top - 120;
      window.scrollTo({ top: offset, behavior: "smooth" });
    }, 100);
  }

  const selectedType = houseTypes.find((ht) => ht.id === selectedTypeId);
  const selectedAvailability = availability.find(
    (a) => a.house_type_id === selectedTypeId
  );
  const isSoldOut = (selectedAvailability?.available_count ?? 0) <= 0;

  const maxGuests = selectedType ? selectedType.max_guests + rates.maxExtraBeds : 1;
  const minGuests = selectedType ? Math.max(selectedType.max_guests - 1, 1) : 1;

  function selectHouseType(houseType: HouseType) {
    setSelectedTypeId(houseType.id);
    setError(null);
    setExtraBeds(0);
    scrollToContactSection();
    const min = Math.max(houseType.max_guests - 1, 1);
    const max = houseType.max_guests + rates.maxExtraBeds;
    setGuests((prev) => {
      const trimmed = prev.slice(0, max);
      if (trimmed.length >= min) return trimmed;
      const padded = [...trimmed];
      while (padded.length < min) {
        padded.push({ ...emptyGuest, sort_order: padded.length });
      }
      return padded;
    });
  }

  function addGuest() {
    if (guests.length >= maxGuests) return;
    setGuests((prev) => [...prev, { ...emptyGuest, sort_order: prev.length }]);
  }

  function removeGuest(index: number) {
    if (guests.length <= minGuests) return;
    setGuests((prev) => prev.filter((_, i) => i !== index));
  }

  function updateGuest(index: number, field: keyof GuestData, value: string | boolean) {
    setGuests((prev) =>
      prev.map((g, i) => (i === index ? { ...g, [field]: value } : g))
    );
  }

  function updateGuestBirthDate(index: number, value: string) {
    const age = getAgeAtDate(value, eventStartDate);
    setGuests((prev) =>
      prev.map((g, i) =>
        i === index
          ? { ...g, birth_date: value, is_child: age !== null && age < CHILD_AGE_LIMIT }
          : g
      )
    );
  }

  const price = selectedType
    ? calculateBookingPrice({
        housePrice: selectedType.price_per_house,
        startDate: eventStartDate,
        endDate: eventEndDate,
        guests,
        extraBeds,
        rates,
      })
    : null;

  const guestsWithoutBirthDate = guests.filter((g) => !g.birth_date).length;

  async function handleReservationSubmit() {
    setError(null);

    if (!selectedTypeId || !selectedType) {
      setError("Bitte wählen Sie einen Haustyp aus.");
      return;
    }

    // Kontaktperson muss mindestens 18 Jahre alt sein
    if (contact.birth_date) {
      const contactAge = getAgeAtDate(contact.birth_date, eventStartDate);
      if (contactAge !== null && contactAge < 18) {
        setError("Die Kontaktperson muss mindestens 18 Jahre alt sein.");
        return;
      }
    }

    if (guests.length < minGuests) {
      setError(
        `Bitte tragen Sie mindestens ${minGuests} Gäste ein. Das ${selectedType.name} ist für ${selectedType.max_guests} Personen ausgelegt.`
      );
      return;
    }

    const futureBirthDate = guests.find(
      (g) => g.birth_date && getAgeAtDate(g.birth_date, eventStartDate) === null
    );
    if (futureBirthDate) {
      setError(
        `Bitte prüfen Sie das Geburtsdatum von ${futureBirthDate.first_name || "einem Gast"}.`
      );
      return;
    }

    if (!rulesAccepted) {
      setError("Bitte akzeptieren Sie die Regeln der Gemeindefreizeit.");
      return;
    }

    const data = {
      event_id: eventId,
      house_type_id: selectedTypeId,
      contact_first_name: contact.first_name,
      contact_last_name: contact.last_name,
      contact_email: contact.email,
      contact_phone: contact.phone || undefined,
      contact_gender: (contact.gender as "maennlich" | "weiblich") || undefined,
      contact_birth_date: contact.birth_date || undefined,
      contact_dietary_notes: contact.dietary_notes || undefined,
      guests: guests.map((g, i) => ({ ...g, sort_order: i })),
      extra_beds: extraBeds,
      rules_accepted: true as const,
    };

    startTransition(async () => {
      const result = await createReservation(data);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  async function handleWaitlistSubmit() {
    setError(null);

    if (!selectedTypeId || !selectedType) {
      setError("Bitte wählen Sie einen Haustyp aus.");
      return;
    }

    startTransition(async () => {
      const result = await joinWaitlist({
        event_id: eventId,
        house_type_id: selectedTypeId,
        contact_first_name: contact.first_name,
        contact_last_name: contact.last_name,
        contact_email: contact.email,
        contact_phone: contact.phone || undefined,
        contact_gender: (contact.gender as "maennlich" | "weiblich") || undefined,
        guest_count: guests.length,
        guests: guests.map((g, i) => ({ ...g, sort_order: i })),
      });

      if (result?.error) {
        setError(result.error);
      }
    });
  }

  const childAgeLabel = `${rates.childMinAge} bis ${rates.adultMinAge - 1} J.`;

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xl font-semibold">1. Unterkunft wählen</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Wählen Sie Ihren gewünschten Unterkunftstyp aus.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {houseTypes.map((ht) => {
            const avail = availability.find((a) => a.house_type_id === ht.id);
            return (
              <HouseTypeCard
                key={ht.id}
                houseType={ht}
                availableCount={avail?.available_count ?? 0}
                isSelected={selectedTypeId === ht.id}
                onSelect={() => selectHouseType(ht)}
              />
            );
          })}
        </div>
      </section>

      {selectedType && selectedAvailability && (
        <form action={isSoldOut ? handleWaitlistSubmit : handleReservationSubmit}>
          <section ref={contactSectionRef}>
            <h2 className="text-xl font-semibold">2. Kontaktdaten</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isSoldOut
                ? "Wir verwenden diese Angaben für Ihren Wartelisteneintrag."
                : "Die Kontaktperson wird für die Reservierung gespeichert."}
            </p>
            <Card className="mt-4">
              <CardContent className="grid gap-5 pt-6 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="contact_first_name">Vorname *</Label>
                  <Input
                    id="contact_first_name"
                    autoComplete="given-name"
                    value={contact.first_name}
                    onChange={(e) => setContact((c) => ({ ...c, first_name: e.target.value }))}
                    maxLength={100}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contact_last_name">Nachname *</Label>
                  <Input
                    id="contact_last_name"
                    autoComplete="family-name"
                    value={contact.last_name}
                    onChange={(e) => setContact((c) => ({ ...c, last_name: e.target.value }))}
                    maxLength={100}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contact_email">E-Mail *</Label>
                  <Input
                    id="contact_email"
                    autoComplete="email"
                    value={contact.email}
                    onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
                    type="email"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contact_phone">Telefon</Label>
                  <Input
                    id="contact_phone"
                    autoComplete="tel"
                    value={contact.phone}
                    onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))}
                    type="tel"
                    maxLength={50}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Geschlecht *</Label>
                  <div className="flex gap-4 pt-1">
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name="contact_gender"
                        checked={contact.gender === "maennlich"}
                        onChange={() => setContact((c) => ({ ...c, gender: "maennlich" }))}
                        required
                        className="h-4 w-4 accent-primary"
                      />
                      <span className="text-sm">Männlich</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name="contact_gender"
                        checked={contact.gender === "weiblich"}
                        onChange={() => setContact((c) => ({ ...c, gender: "weiblich" }))}
                        className="h-4 w-4 accent-primary"
                      />
                      <span className="text-sm">Weiblich</span>
                    </label>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contact_birth_date">Geburtsdatum</Label>
                  <Input
                    id="contact_birth_date"
                    type="date"
                    autoComplete="bday"
                    value={contact.birth_date}
                    onChange={(e) => setContact((c) => ({ ...c, birth_date: e.target.value }))}
                  />
                  {contact.birth_date && (() => {
                    const age = getAgeAtDate(contact.birth_date, eventStartDate);
                    if (age === null) return null;
                    if (age < 18) {
                      return (
                        <p className="mt-1 text-xs font-medium text-red-600">
                          Die Kontaktperson muss mindestens 18 Jahre alt sein ({age} Jahre zum Freizeitbeginn).
                        </p>
                      );
                    }
                    return (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {age} Jahre zum Freizeitbeginn
                      </p>
                    );
                  })()}
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="contact_notes">Hinweise / Bemerkungen</Label>
                  <Textarea
                    id="contact_notes"
                    value={contact.dietary_notes}
                    onChange={(e) => setContact((c) => ({ ...c, dietary_notes: e.target.value }))}
                    placeholder="z.B. Kinderbett wird benötigt, vegetarisch, Allergien..."
                    rows={2}
                    maxLength={500}
                  />
                </div>
              </CardContent>
            </Card>
          </section>

          <Separator className="my-8" />

          <section>
            <h2 className="text-xl font-semibold">
              3. Gäste eintragen{isSoldOut ? " (Warteliste)" : ""}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isSoldOut
                ? "Dieser Unterkunftstyp ist aktuell ausgebucht. Tragen Sie trotzdem alle Gäste ein, so können wir Ihre Anmeldung direkt übernehmen, sobald eine Unterkunft frei wird."
                : `Tragen Sie alle Personen ein, die im ${selectedType.name} übernachten (mind. ${minGuests}, max. ${maxGuests} Personen). Das Geburtsdatum brauchen wir für die Kurtaxe.`}
            </p>

            <div className="mt-4 space-y-4">
              {guests.map((guest, index) => (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">Gast {index + 1}</CardTitle>
                      <div className="flex items-center gap-1">
                        {index === 0 && (
                          <Button
                            type="button"
                            size="sm"
                            className="h-8 gap-1.5 text-xs"
                            onClick={() => {
                              const age = getAgeAtDate(contact.birth_date, eventStartDate);
                              setGuests((prev) =>
                                prev.map((g, i) =>
                                  i === 0
                                    ? {
                                        ...g,
                                        first_name: contact.first_name,
                                        last_name: contact.last_name,
                                        gender:
                                          (contact.gender as "maennlich" | "weiblich") || undefined,
                                        birth_date: contact.birth_date || "",
                                        is_child: age !== null && age < CHILD_AGE_LIMIT,
                                        dietary_notes: contact.dietary_notes || "",
                                      }
                                    : g
                                )
                              );
                            }}
                          >
                            <UserCheck className="h-3.5 w-3.5" />
                            Aus Kontaktperson übernehmen
                          </Button>
                        )}
                        {guests.length > minGuests && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label={`Gast ${index + 1} entfernen`}
                            onClick={() => removeGuest(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-5 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor={`guest_${index}_first_name`}>Vorname *</Label>
                      <Input
                        id={`guest_${index}_first_name`}
                        value={guest.first_name}
                        onChange={(e) => updateGuest(index, "first_name", e.target.value)}
                        maxLength={100}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`guest_${index}_last_name`}>Nachname *</Label>
                      <Input
                        id={`guest_${index}_last_name`}
                        value={guest.last_name}
                        onChange={(e) => updateGuest(index, "last_name", e.target.value)}
                        maxLength={100}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Geschlecht *</Label>
                      <div className="flex gap-4 pt-1">
                        <label className="flex cursor-pointer items-center gap-2">
                          <input
                            type="radio"
                            name={`guest_gender_${index}`}
                            checked={guest.gender === "maennlich"}
                            onChange={() => updateGuest(index, "gender", "maennlich")}
                            required
                            className="h-4 w-4 accent-primary"
                          />
                          <span className="text-sm">Männlich</span>
                        </label>
                        <label className="flex cursor-pointer items-center gap-2">
                          <input
                            type="radio"
                            name={`guest_gender_${index}`}
                            checked={guest.gender === "weiblich"}
                            onChange={() => updateGuest(index, "gender", "weiblich")}
                            className="h-4 w-4 accent-primary"
                          />
                          <span className="text-sm">Weiblich</span>
                        </label>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`guest_${index}_birth_date`}>Geburtsdatum *</Label>
                      <Input
                        id={`guest_${index}_birth_date`}
                        type="date"
                        value={guest.birth_date ?? ""}
                        max={eventStartDate}
                        onChange={(e) => updateGuestBirthDate(index, e.target.value)}
                        required={!isSoldOut}
                      />
                      {guest.birth_date && (() => {
                        const age = getAgeAtDate(guest.birth_date, eventStartDate);
                        if (age === null) {
                          return (
                            <p className="mt-1 text-xs font-medium text-red-600">
                              Das Geburtsdatum liegt nach dem Freizeitbeginn.
                            </p>
                          );
                        }
                        return (
                          <p className={`mt-1 text-xs ${age < CHILD_AGE_LIMIT ? "text-amber-700" : "text-muted-foreground"}`}>
                            {age < CHILD_AGE_LIMIT
                              ? `Kind, ${age} Jahre zum Freizeitbeginn`
                              : `${age} Jahre zum Freizeitbeginn`}
                          </p>
                        );
                      })()}
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <Label htmlFor={`guest_${index}_notes`}>Hinweise / Bemerkungen</Label>
                      <Textarea
                        id={`guest_${index}_notes`}
                        value={guest.dietary_notes ?? ""}
                        onChange={(e) => updateGuest(index, "dietary_notes", e.target.value)}
                        placeholder="z.B. Kinderbett wird benötigt, vegetarisch, Allergien..."
                        rows={2}
                        maxLength={500}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}

              {guests.length < maxGuests && (
                <Button type="button" variant="outline" className="w-full gap-2" onClick={addGuest}>
                  <Plus className="h-4 w-4" />
                  Weiteren Gast hinzufügen
                </Button>
              )}
            </div>

            {/* Zustellbetten */}
            {!isSoldOut && rates.maxExtraBeds > 0 && (
              <Card className="mt-4">
                <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-start">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <BedDouble className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <Label htmlFor="extra_beds">Zustellbetten</Label>
                    <p className="text-sm text-muted-foreground">
                      Das {selectedType.name} hat {selectedType.max_guests} feste Schlafplätze.
                      Brauchen Sie mehr, können Sie bis zu {rates.maxExtraBeds} Zustellbetten für{" "}
                      {formatCurrency(rates.extraBedPricePerDay)} pro Bett und Tag dazubuchen.
                      Ein Doppelbett kann auch von zwei Personen genutzt werden, dann ist kein
                      Zustellbett nötig.
                    </p>
                  </div>
                  <select
                    id="extra_beds"
                    value={extraBeds}
                    onChange={(e) => setExtraBeds(Number(e.target.value))}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm sm:w-40"
                  >
                    {Array.from({ length: rates.maxExtraBeds + 1 }, (_, n) => (
                      <option key={n} value={n}>
                        {n === 0 ? "Kein Zustellbett" : `${n} Zustellbett${n > 1 ? "en" : ""}`}
                      </option>
                    ))}
                  </select>
                </CardContent>
              </Card>
            )}
          </section>

          <Separator className="my-8" />

          <section>
            <h2 className="text-xl font-semibold">Zusammenfassung</h2>
            <Card className="mt-4">
              <CardContent className="pt-6">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Unterkunft</span>
                    <span className="font-medium">{selectedType.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Anzahl Gäste</span>
                    <span className="font-medium">{guests.length}</span>
                  </div>

                  {!isSoldOut && price && (
                    <>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Hauspreis ({price.nights} {price.nights === 1 ? "Nacht" : "Nächte"})
                        </span>
                        <span className="font-medium">{formatCurrency(price.accommodationPrice)}</span>
                      </div>
                      {price.extraBeds > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            {price.extraBeds}x Zustellbett ({formatCurrency(rates.extraBedPricePerDay)}/Tag)
                          </span>
                          <span className="font-medium">{formatCurrency(price.extraBedTotal)}</span>
                        </div>
                      )}

                      <div className="space-y-1.5 rounded-lg bg-muted/50 p-3">
                        <p className="text-xs font-semibold text-foreground">
                          Kurtaxe ({price.nights} {price.nights === 1 ? "Tag" : "Tage"})
                        </p>
                        {price.adults > 0 && (
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>
                              {price.adults}x ab {rates.adultMinAge} J. ({formatCurrency(rates.adultRate)}/Tag)
                            </span>
                            <span>{formatCurrency(price.adultTax)}</span>
                          </div>
                        )}
                        {price.children > 0 && (
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>
                              {price.children}x Kinder {childAgeLabel} ({formatCurrency(rates.childRate)}/Tag)
                            </span>
                            <span>{formatCurrency(price.childTax)}</span>
                          </div>
                        )}
                        {price.exempt > 0 && (
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{price.exempt}x Kinder unter {rates.childMinAge} J.</span>
                            <span>frei</span>
                          </div>
                        )}
                        <div className="flex justify-between border-t border-border/50 pt-1 text-xs font-medium">
                          <span>Kurtaxe gesamt</span>
                          <span>{formatCurrency(price.touristTax)}</span>
                        </div>
                        {guestsWithoutBirthDate > 0 && (
                          <p className="text-xs text-amber-700">
                            Ohne Geburtsdatum rechnen wir mit dem Erwachsenentarif.
                          </p>
                        )}
                      </div>

                      <Separator />
                      <div className="flex justify-between text-base font-semibold">
                        <span>Gesamtbetrag</span>
                        <span>{formatCurrency(price.total)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Der Gesamtbetrag aus Hauspreis
                        {price.extraBeds > 0 ? ", Zustellbetten" : ""} und Kurtaxe ist vorab zu
                        überweisen. Die Kurtaxe führt der Verein gesammelt an das Feriendorf ab.
                      </p>
                    </>
                  )}

                  <p className="mt-4 text-xs text-muted-foreground">
                    {isSoldOut
                      ? "Der Eintrag wird auf der Warteliste gespeichert. Sobald eine passende Unterkunft frei wird, kann das Freizeitteam Sie kontaktieren."
                      : `Nach dem Absenden werden die Zahlungsdaten direkt auf der Bestätigungsseite angezeigt. Die Reservierung bleibt ${reservationValidityDays} Tage gültig.`}
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Regeln akzeptieren */}
          <div className="mt-6 flex items-start gap-3">
            <input
              type="checkbox"
              id="rules-accepted"
              checked={rulesAccepted}
              onChange={(e) => setRulesAccepted(e.target.checked)}
              className="mt-1 h-5 w-5 shrink-0 cursor-pointer rounded border-border accent-primary"
            />
            <label htmlFor="rules-accepted" className="cursor-pointer text-sm text-muted-foreground">
              Hiermit akzeptiere ich die{" "}
              <button
                type="button"
                onClick={() => setShowRules(true)}
                className="font-semibold text-primary underline underline-offset-4 hover:text-primary/80"
              >
                Regeln der Gemeindefreizeit
              </button>
              .
            </label>
          </div>

          <div className="mt-4">
            <Button type="submit" size="lg" className="w-full" disabled={isPending || !rulesAccepted}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isSoldOut ? "Wartelisteneintrag wird erstellt..." : "Reservierung wird erstellt..."}
                </>
              ) : isSoldOut ? (
                "Auf Warteliste setzen"
              ) : (
                "Verbindlich reservieren"
              )}
            </Button>
          </div>

          {/* Regeln-Modal */}
          {showRules && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
              onClick={() => setShowRules(false)}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="rules-title"
                className="relative flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl bg-card shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b px-6 py-4">
                  <h3 id="rules-title" className="text-lg font-semibold">
                    Regeln der Gemeindefreizeit
                  </h3>
                  <Button variant="ghost" size="icon" aria-label="Schließen" onClick={() => setShowRules(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4 text-sm leading-relaxed text-foreground/80">
                  <p className="font-semibold text-foreground">Die Teilnahmebedingungen zur Gemeindefreizeit sind für jeden Teilnehmer verbindlich. Mit der Anmeldung erklären sich die Teilnehmer mit den folgenden Regeln einverstanden.</p>

                  <h4 className="font-bold text-foreground">&sect;1 Freizeitleitung</h4>
                  <p>Die Freizeitleitung besteht aus den Jugendleitern und ggf. weitere bestimmte Leiter. Den Anweisungen der Freizeitleitung ist in jedem Fall Folge zu leisten.</p>

                  <h4 className="font-bold text-foreground">&sect;2 Haftung</h4>
                  <p>Für verlorene Gegenstände wird keinerlei Haftung übernommen. Die Teilnahme an der Gemeindefreizeit erfolgt auf eigene Verantwortung.</p>

                  <h4 className="font-bold text-foreground">&sect;3 Nachtruhe</h4>
                  <p>Die festgelegte Nachtruhe muss eingehalten werden.</p>

                  <h4 className="font-bold text-foreground">&sect;4 Unterkünfte</h4>
                  <p>Die Unterkünfte sind pfleglich zu behandeln und bei Abreise sauber und ordentlich zu hinterlassen.</p>

                  <h4 className="font-bold text-foreground">&sect;5 Kleidung</h4>
                  <p>Auf freizügige oder unanständige Kleidung ist zu verzichten.</p>

                  <h4 className="font-bold text-foreground">&sect;6 Ausflüge und Aktivitäten</h4>
                  <p>Besichtigungen und Ausflüge werden in definierten Kleingruppen erfolgen. Es ist nicht gestattet, sich ohne Zustimmung der Freizeitleitung von der Gruppe zu entfernen.</p>

                  <h4 className="font-bold text-foreground">&sect;7 Alkohol, Drogen und Rauschmittel</h4>
                  <p>Jeglicher Alkoholkonsum ist verboten. Das Konsumieren und Mitführen von Drogen und Rauschmitteln ist ausnahmslos verboten. Rauchen ist in allen Gebäuden untersagt.</p>

                  <h4 className="font-bold text-foreground">&sect;8 Waffen</h4>
                  <p>Es ist verboten, Waffen mitzunehmen. Was als Waffe gilt, liegt in der Entscheidungsmacht der Freizeitleitung.</p>

                  <h4 className="font-bold text-foreground">&sect;9 Verbotene Aktivitäten</h4>
                  <p>Der Besuch von Kinos, Spielstätten, Diskotheken etc. ist strengstens untersagt.</p>

                  <h4 className="font-bold text-foreground">&sect;10 Besuche</h4>
                  <p>Tagesbesuche oder Besuche von außenstehenden Personen sind nicht gestattet, da die Planbarkeit der Freizeit (Verpflegung, Unterkünfte, Programm) dadurch nicht mehr gewährleistet werden kann. Sollte in begründeten Ausnahmefällen dennoch jemand kommen müssen, ist dies zwingend im Voraus mit der Freizeitleitung abzustimmen.</p>

                  <h4 className="font-bold text-foreground">&sect;11 Ordnung und Ausschluss</h4>
                  <p>Teilnehmer, die sich nicht an die Ordnung halten, werden zurechtgewiesen. Bei mehrfachen oder groben Zuwiderhandlungen haben die Leiter das Recht, Teilnehmer von der Freizeit auszuschließen. Die Folgekosten für die evtl. Rückreise müssen die Teilnehmer selbst tragen. Die Erstattung der Reisekosten ist nicht möglich.</p>

                  <h4 className="font-bold text-foreground">&sect;12 Regeländerungen</h4>
                  <p>Nur durch die Erlaubnis der Freizeitleitung dürfen die Regeln geändert werden. Hierbei handelt es sich jedoch nicht um grundlegende Regeln.</p>

                  <h4 className="font-bold text-foreground">&sect;13 Zahlung</h4>
                  <p>Die Zahlung des Hausbeitrags und der Kurtaxe erfolgt per Überweisung innerhalb von {reservationValidityDays} Tagen nach Reservierung. Die Kurtaxe führt der Verein gesammelt an das Feriendorf ab.</p>

                  <h4 className="font-bold text-foreground">&sect;14 Stornierung</h4>
                  <p>Eine Stornierung ist grundsätzlich nicht möglich. Sollte ein Teilnehmer nicht mehr teilnehmen können, muss er eigenständig für Ersatz sorgen. Alternativ kann die Freizeitleitung kontaktiert werden, wir werden gemeinsam versuchen, einen Ersatz zu finden.</p>

                  <h4 className="font-bold text-foreground">&sect;15 Kinder und Jugendliche</h4>
                  <p>Kinder unter 12 Jahren müssen von einem Erziehungsberechtigten begleitet werden. Die Aufsichtspflicht liegt bei den Eltern bzw. Erziehungsberechtigten.</p>
                </div>
                <div className="flex justify-end gap-2 border-t px-6 py-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setRulesAccepted(true);
                      setShowRules(false);
                    }}
                  >
                    Gelesen und akzeptieren
                  </Button>
                </div>
              </div>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
