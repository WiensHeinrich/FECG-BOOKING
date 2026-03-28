"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Plus, Trash2, AlertCircle } from "lucide-react";
import { HouseTypeCard } from "./house-type-card";
import { createReservation } from "@/lib/actions/booking";
import { joinWaitlist } from "@/lib/actions/waitlist";
import { formatCurrency } from "@/lib/utils/format";
import type { HouseType, Availability } from "@/lib/types/database";
import type { GuestData } from "@/lib/validations/booking";

interface BookingFormProps {
  eventId: string;
  eventStartDate: string;
  eventEndDate: string;
  houseTypes: HouseType[];
  availability: Availability[];
  reservationValidityDays: number;
}

function getAgeAtDate(birthDate: string, targetDate: string): number | null {
  const birth = new Date(birthDate);
  const target = new Date(targetDate);
  if (isNaN(birth.getTime()) || isNaN(target.getTime())) return null;
  let age = target.getFullYear() - birth.getFullYear();
  const monthDiff = target.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && target.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

const emptyGuest: GuestData = {
  first_name: "",
  last_name: "",
  birth_date: "",
  is_child: false,
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
}: BookingFormProps) {
  const nights = Math.max(1, Math.round(
    (new Date(eventEndDate).getTime() - new Date(eventStartDate).getTime()) / (1000 * 60 * 60 * 24)
  ));
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [guests, setGuests] = useState<GuestData[]>([{ ...emptyGuest }]);
  const [waitlistGuestCount, setWaitlistGuestCount] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedType = houseTypes.find((ht) => ht.id === selectedTypeId);
  const selectedAvailability = availability.find(
    (a) => a.house_type_id === selectedTypeId
  );
  const isSoldOut = (selectedAvailability?.available_count ?? 0) <= 0;

  function selectHouseType(houseType: HouseType) {
    setSelectedTypeId(houseType.id);
    setError(null);
    const min = Math.max(houseType.max_guests - 1, 1);
    const max = houseType.max_guests + 2;
    setGuests((prev) => {
      const trimmed = prev.slice(0, max);
      if (trimmed.length >= min) return trimmed;
      const padded = [...trimmed];
      while (padded.length < min) {
        padded.push({ ...emptyGuest, sort_order: padded.length });
      }
      return padded;
    });
    setWaitlistGuestCount((prev) =>
      Math.min(Math.max(prev, min), max)
    );
  }

  const maxGuests = selectedType ? selectedType.max_guests + 2 : 1;
  const minGuests = selectedType ? Math.max(selectedType.max_guests - 1, 1) : 1;

  function addGuest() {
    if (guests.length >= maxGuests) return;
    setGuests((prev) => [...prev, { ...emptyGuest, sort_order: prev.length }]);
  }

  function removeGuest(index: number) {
    if (guests.length <= minGuests) return;
    setGuests((prev) => prev.filter((_, i) => i !== index));
  }

  function updateGuest(
    index: number,
    field: keyof GuestData,
    value: string | boolean
  ) {
    setGuests((prev) =>
      prev.map((g, i) => (i === index ? { ...g, [field]: value } : g))
    );
  }

  async function handleReservationSubmit(formData: FormData) {
    setError(null);

    if (!selectedTypeId || !selectedType) {
      setError("Bitte wählen Sie einen Haustyp aus.");
      return;
    }

    const requiredMin = Math.max(selectedType.max_guests - 1, 1);
    if (guests.length < requiredMin) {
      setError(
        `Bitte tragen Sie mindestens ${requiredMin} Gäste ein. Das ${selectedType.name} ist für ${selectedType.max_guests} Personen ausgelegt.`
      );
      return;
    }

    const data = {
      event_id: eventId,
      house_type_id: selectedTypeId,
      contact_first_name: formData.get("contact_first_name") as string,
      contact_last_name: formData.get("contact_last_name") as string,
      contact_email: formData.get("contact_email") as string,
      contact_phone: (formData.get("contact_phone") as string) || undefined,
      guests: guests.map((g, i) => ({ ...g, sort_order: i })),
    };

    startTransition(async () => {
      const result = await createReservation(data);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  async function handleWaitlistSubmit(formData: FormData) {
    setError(null);

    if (!selectedTypeId || !selectedType) {
      setError("Bitte wählen Sie einen Haustyp aus.");
      return;
    }

    startTransition(async () => {
      const result = await joinWaitlist({
        event_id: eventId,
        house_type_id: selectedTypeId,
        contact_first_name: formData.get("contact_first_name") as string,
        contact_last_name: formData.get("contact_last_name") as string,
        contact_email: formData.get("contact_email") as string,
        contact_phone: (formData.get("contact_phone") as string) || undefined,
        guest_count: Math.min(waitlistGuestCount, selectedType.max_guests),
      });

      if (result?.error) {
        setError(result.error);
      }
    });
  }

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
          <section>
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
                  <Input id="contact_first_name" name="contact_first_name" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contact_last_name">Nachname *</Label>
                  <Input id="contact_last_name" name="contact_last_name" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contact_email">E-Mail *</Label>
                  <Input
                    id="contact_email"
                    name="contact_email"
                    type="email"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contact_phone">Telefon</Label>
                  <Input id="contact_phone" name="contact_phone" type="tel" />
                </div>
              </CardContent>
            </Card>
          </section>

          <Separator className="my-8" />

          {isSoldOut ? (
            <section>
              <h2 className="text-xl font-semibold">3. Warteliste</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Dieser Unterkunftstyp ist aktuell ausgebucht. Sie können sich
                für {selectedType.name} auf die Warteliste setzen lassen.
              </p>

              <Card className="mt-4">
                <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
                  <div>
                    <Label htmlFor="guest_count">Anzahl Gäste *</Label>
                    <Input
                      id="guest_count"
                      name="guest_count"
                      type="number"
                      min={1}
                      max={selectedType.max_guests}
                      value={waitlistGuestCount}
                      onChange={(e) =>
                        setWaitlistGuestCount(
                          Math.min(
                            Math.max(Number(e.target.value) || 1, 1),
                            selectedType.max_guests
                          )
                        )
                      }
                      required
                    />
                  </div>
                  <div className="flex items-end text-sm text-muted-foreground">
                    Maximal {selectedType.max_guests} Personen für diesen
                    Unterkunftstyp.
                  </div>
                </CardContent>
              </Card>
            </section>
          ) : (
            <section>
              <h2 className="text-xl font-semibold">3. Gäste eintragen</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Tragen Sie alle Personen ein, die im {selectedType.name} übernachten
                (mind. {Math.max(selectedType.max_guests - 1, 1)}, max. {selectedType.max_guests + 2} Personen).
              </p>

              <div className="mt-4 space-y-4">
                {guests.map((guest, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium">
                          Gast {index + 1}
                        </CardTitle>
                        {guests.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => removeGuest(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="grid gap-5 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label>Vorname *</Label>
                        <Input
                          value={guest.first_name}
                          onChange={(e) =>
                            updateGuest(index, "first_name", e.target.value)
                          }
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Nachname *</Label>
                        <Input
                          value={guest.last_name}
                          onChange={(e) =>
                            updateGuest(index, "last_name", e.target.value)
                          }
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Geburtsdatum</Label>
                        <Input
                          type="date"
                          value={guest.birth_date ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateGuest(index, "birth_date", val);
                            const age = getAgeAtDate(val, eventStartDate);
                            updateGuest(index, "is_child", age !== null && age < 14);
                          }}
                        />
                        {guest.birth_date && (() => {
                          const age = getAgeAtDate(guest.birth_date, eventStartDate);
                          if (age === null) return null;
                          return (
                            <p className={`mt-1 text-xs ${age < 14 ? "text-amber-700" : "text-muted-foreground"}`}>
                              {age < 14
                                ? `Kind — ${age} Jahre zum Freizeitbeginn`
                                : `${age} Jahre zum Freizeitbeginn`}
                            </p>
                          );
                        })()}
                      </div>
                      <div className="md:col-span-2 space-y-1.5">
                        <Label>Ernährungshinweise / Allergien</Label>
                        <Textarea
                          value={guest.dietary_notes ?? ""}
                          onChange={(e) =>
                            updateGuest(index, "dietary_notes", e.target.value)
                          }
                          placeholder="z.B. vegetarisch, Laktoseintoleranz..."
                          rows={2}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {guests.length < selectedType.max_guests + 2 && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2"
                    onClick={addGuest}
                  >
                    <Plus className="h-4 w-4" />
                    Weiteren Gast hinzufügen
                  </Button>
                )}
              </div>
            </section>
          )}

          <Separator className="my-8" />

          <section>
            <h2 className="text-xl font-semibold">Zusammenfassung</h2>
            <Card className="mt-4">
              <CardContent className="pt-6">
                {(() => {
                  const guestAges = (isSoldOut ? [] : guests).map((g) =>
                    g.birth_date ? getAgeAtDate(g.birth_date, eventStartDate) : null
                  );
                  const adults = guestAges.filter((a) => a === null || a >= 18).length;
                  const children10to17 = guestAges.filter((a) => a !== null && a >= 10 && a < 18).length;
                  const childrenUnder10 = guestAges.filter((a) => a !== null && a >= 0 && a < 10).length;

                  const kurtaxeAdults = adults * 1.80 * nights;
                  const kurtaxeChildren = children10to17 * 0.90 * nights;
                  const kurtaxeTotal = kurtaxeAdults + kurtaxeChildren;

                  return (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Unterkunft</span>
                        <span className="font-medium">{selectedType.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Anzahl Gäste</span>
                        <span className="font-medium">
                          {isSoldOut ? waitlistGuestCount : guests.length}
                        </span>
                      </div>
                      {!isSoldOut && (
                        <>
                          <Separator />
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Hauspreis</span>
                            <span className="font-medium">{formatCurrency(selectedType.price_per_house)}</span>
                          </div>

                          {/* Kurtaxe Aufschlüsselung */}
                          <div className="rounded-lg bg-muted/50 p-3 space-y-1.5">
                            <p className="text-xs font-semibold text-foreground">
                              Kurtaxe ({nights} {nights === 1 ? "Tag" : "Tage"}, vor Ort zu zahlen)
                            </p>
                            {adults > 0 && (
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{adults}x Erwachsene (1,80 €/Tag)</span>
                                <span>{formatCurrency(kurtaxeAdults)}</span>
                              </div>
                            )}
                            {children10to17 > 0 && (
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{children10to17}x Kinder 10–17 J. (0,90 €/Tag)</span>
                                <span>{formatCurrency(kurtaxeChildren)}</span>
                              </div>
                            )}
                            {childrenUnder10 > 0 && (
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{childrenUnder10}x Kinder unter 10</span>
                                <span>frei</span>
                              </div>
                            )}
                            <div className="flex justify-between text-xs font-medium pt-1 border-t border-border/50">
                              <span>Kurtaxe gesamt</span>
                              <span>{formatCurrency(kurtaxeTotal)}</span>
                            </div>
                          </div>

                          <Separator />
                          <div className="flex justify-between text-base font-semibold">
                            <span>Gesamtkosten</span>
                            <span>{formatCurrency(selectedType.price_per_house + kurtaxeTotal)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Hauspreis {formatCurrency(selectedType.price_per_house)} (vorab zu überweisen) + Kurtaxe {formatCurrency(kurtaxeTotal)} (vor Ort)
                          </p>
                        </>
                      )}

                      <p className="mt-4 text-xs text-muted-foreground">
                        {isSoldOut
                          ? "Der Eintrag wird auf der Warteliste gespeichert. Sobald eine passende Unterkunft frei wird, kann das Freizeitteam Sie kontaktieren."
                          : `Nach dem Absenden werden die Zahlungsdaten direkt auf der Bestätigungsseite angezeigt. Die Reservierung bleibt ${reservationValidityDays} Tage gültig.`}
                      </p>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </section>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="mt-6">
            <Button type="submit" size="lg" className="w-full" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isSoldOut
                    ? "Wartelisteneintrag wird erstellt..."
                    : "Reservierung wird erstellt..."}
                </>
              ) : isSoldOut ? (
                "Auf Warteliste setzen"
              ) : (
                "Verbindlich reservieren"
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
