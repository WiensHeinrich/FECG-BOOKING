"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Plus, Trash2, AlertCircle, X, FileDown } from "lucide-react";
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
}: BookingFormProps) {
  const nights = Math.max(1, Math.round(
    (new Date(eventEndDate).getTime() - new Date(eventStartDate).getTime()) / (1000 * 60 * 60 * 24)
  ));
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [guests, setGuests] = useState<GuestData[]>([{ ...emptyGuest }]);
  const [waitlistGuestCount, setWaitlistGuestCount] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const contactSectionRef = useRef<HTMLElement>(null);
  const [shouldScroll, setShouldScroll] = useState(false);

  // Sanfter Scroll zur Kontaktsektion nach Auswahl — nicht ganz nach oben,
  // damit die ausgewählte Unterkunft noch sichtbar bleibt
  useEffect(() => {
    if (shouldScroll && selectedTypeId && contactSectionRef.current) {
      setTimeout(() => {
        const el = contactSectionRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const offset = window.scrollY + rect.top - 120; // 120px Abstand oben
        window.scrollTo({ top: offset, behavior: "smooth" });
      }, 100);
      setShouldScroll(false);
    }
  }, [shouldScroll, selectedTypeId]);

  const selectedType = houseTypes.find((ht) => ht.id === selectedTypeId);
  const selectedAvailability = availability.find(
    (a) => a.house_type_id === selectedTypeId
  );
  const isSoldOut = (selectedAvailability?.available_count ?? 0) <= 0;

  function selectHouseType(houseType: HouseType) {
    setSelectedTypeId(houseType.id);
    setError(null);
    setShouldScroll(true);
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
      contact_gender: (formData.get("contact_gender") as string) || undefined,
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
        contact_gender: (formData.get("contact_gender") as string) || undefined,
        guest_count: guests.length,
        guests: guests.map((g, i) => ({ ...g, sort_order: i })),
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
                <div className="space-y-1.5">
                  <Label>Geschlecht *</Label>
                  <div className="flex gap-4 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="contact_gender" value="maennlich" required className="h-4 w-4 accent-primary" />
                      <span className="text-sm">Männlich</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="contact_gender" value="weiblich" className="h-4 w-4 accent-primary" />
                      <span className="text-sm">Weiblich</span>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <Separator className="my-8" />

          <section>
            <h2 className="text-xl font-semibold">3. Gäste eintragen{isSoldOut ? " (Warteliste)" : ""}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isSoldOut
                ? `Dieser Unterkunftstyp ist aktuell ausgebucht. Tragen Sie trotzdem alle Gäste ein — so können wir Ihre Anmeldung direkt übernehmen, sobald eine Unterkunft frei wird.`
                : `Tragen Sie alle Personen ein, die im ${selectedType.name} übernachten (mind. ${Math.max(selectedType.max_guests - 1, 1)}, max. ${selectedType.max_guests + 2} Personen).`
              }
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
                        <Label>Geschlecht *</Label>
                        <div className="flex gap-4 pt-1">
                          <label className="flex items-center gap-2 cursor-pointer">
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
                          <label className="flex items-center gap-2 cursor-pointer">
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
                        <Label>Hinweise / Bemerkungen</Label>
                        <Textarea
                          value={guest.dietary_notes ?? ""}
                          onChange={(e) =>
                            updateGuest(index, "dietary_notes", e.target.value)
                          }
                          placeholder="z.B. Kinderbett wird benötigt, vegetarisch, Allergien..."
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

          <Separator className="my-8" />

          <section>
            <h2 className="text-xl font-semibold">Zusammenfassung</h2>
            <Card className="mt-4">
              <CardContent className="pt-6">
                {(() => {
                  const guestAges = guests.map((g) =>
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
                        <span className="font-medium">{guests.length}</span>
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
                            Hauspreis {formatCurrency(selectedType.price_per_house)} + Kurtaxe {formatCurrency(kurtaxeTotal)} — der Gesamtbetrag von {formatCurrency(selectedType.price_per_house + kurtaxeTotal)} ist vorab zu überweisen.
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

          {/* Regeln akzeptieren */}
          <div className="mt-6 flex items-start gap-3">
            <input
              type="checkbox"
              id="rules-accepted"
              checked={rulesAccepted}
              onChange={(e) => setRulesAccepted(e.target.checked)}
              className="mt-1 h-5 w-5 shrink-0 cursor-pointer rounded border-border accent-primary"
            />
            <label htmlFor="rules-accepted" className="text-sm text-muted-foreground cursor-pointer">
              Hiermit akzeptiere ich die{" "}
              <button
                type="button"
                onClick={() => setShowRules(true)}
                className="font-semibold text-primary underline underline-offset-4 hover:text-primary/80"
              >
                Regeln der Gemeindefreizeit
              </button>.
            </label>
          </div>

          <div className="mt-4">
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isPending || !rulesAccepted}
            >
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

          {/* Regeln-Modal */}
          {showRules && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
              onClick={() => setShowRules(false)}
            >
              <div
                className="relative flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl bg-card shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b px-6 py-4">
                  <h3 className="text-lg font-semibold">Regeln der Gemeindefreizeit</h3>
                  <Button variant="ghost" size="icon" onClick={() => setShowRules(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-4 text-sm leading-relaxed text-foreground/80 space-y-4">
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

                  <h4 className="font-bold text-foreground">&sect;10 Ordnung und Ausschluss</h4>
                  <p>Teilnehmer, die sich nicht an die Ordnung halten, werden zurechtgewiesen. Bei mehrfachen oder groben Zuwiderhandlungen haben die Leiter das Recht, Teilnehmer von der Freizeit auszuschließen. Die Folgekosten für die evtl. Rückreise müssen die Teilnehmer selbst tragen. Die Erstattung der Reisekosten ist nicht möglich.</p>

                  <h4 className="font-bold text-foreground">&sect;11 Regeländerungen</h4>
                  <p>Nur durch die Erlaubnis der Freizeitleitung dürfen die Regeln geändert werden. Hierbei handelt es sich jedoch nicht um grundlegende Regeln.</p>

                  <h4 className="font-bold text-foreground">&sect;12 Zahlung</h4>
                  <p>Die Zahlung des Hausbeitrags erfolgt per Überweisung innerhalb von 14 Tagen nach Reservierung.</p>

                  <h4 className="font-bold text-foreground">&sect;13 Stornierung</h4>
                  <p>Eine Stornierung ist grundsätzlich nicht möglich. Sollte ein Teilnehmer nicht mehr teilnehmen können, muss er eigenständig für Ersatz sorgen. Alternativ kann die Freizeitleitung kontaktiert werden — wir werden gemeinsam versuchen, einen Ersatz zu finden.</p>

                  <h4 className="font-bold text-foreground">&sect;14 Kinder und Jugendliche</h4>
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
                    Gelesen & Akzeptieren
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
