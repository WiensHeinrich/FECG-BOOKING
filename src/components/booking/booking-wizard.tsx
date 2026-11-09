"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { AlertCircle, ArrowRight, CalendarDays, Loader2, Plus, Trash2 } from "lucide-react";
import { createReservation } from "@/lib/actions/booking";
import { joinWaitlist } from "@/lib/actions/waitlist";
import { formatCurrency, formatDateRange } from "@/lib/utils/format";
import {
  calculateBookingPrice,
  getAgeAtDate,
  type PricingRates,
} from "@/lib/utils/pricing";
import type { Availability, HouseType } from "@/lib/types/database";
import type { GuestData } from "@/lib/validations/booking";
import { StayComparison } from "@/components/stays/stay-comparison";
import { nightsLabel } from "@/lib/utils/stay";
import { RulesContent } from "./rules-content";
import { cn } from "@/lib/utils";

interface BookingWizardProps {
  eventId: string;
  eventStartDate: string;
  eventEndDate: string;
  houseTypes: HouseType[];
  availability: Availability[] | null;
  reservationValidityDays: number;
  rates: PricingRates;
  initialHouseTypeId?: string | null;
}

type Gender = "" | "maennlich" | "weiblich";
type Step = 1 | 2 | 3;

const CHILD_AGE_LIMIT = 14;
const STEPS = ["Unterkunft", "Kontakt & Gäste", "Prüfen", "Bestätigung"];

const emptyGuest: GuestData = {
  first_name: "",
  last_name: "",
  birth_date: "",
  is_child: false,
  gender: undefined,
  dietary_notes: "",
  sort_order: 0,
};

function guestRange(houseType: HouseType, maxExtraBeds: number) {
  return { min: Math.max(houseType.max_guests - 1, 1), max: houseType.max_guests + maxExtraBeds };
}

export function BookingWizard({
  eventId,
  eventStartDate,
  eventEndDate,
  houseTypes,
  availability,
  reservationValidityDays,
  rates,
  initialHouseTypeId = null,
}: BookingWizardProps) {
  const initialType = houseTypes.find((ht) => ht.id === initialHouseTypeId) ?? null;

  const [step, setStep] = useState<Step>(initialType ? 2 : 1);
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(initialType?.id ?? null);
  const [contact, setContact] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    gender: "" as Gender,
    birth_date: "",
    dietary_notes: "",
  });
  const [contactIsGuest, setContactIsGuest] = useState(true);
  const [guests, setGuests] = useState<GuestData[]>(() => {
    const count = initialType ? guestRange(initialType, rates.maxExtraBeds).min : 1;
    return Array.from({ length: count }, (_, i) => ({ ...emptyGuest, sort_order: i }));
  });
  const [openGuests, setOpenGuests] = useState<Set<number>>(() => new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]));
  const [extraBeds, setExtraBeds] = useState(0);
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const formRef = useRef<HTMLFormElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const selectedType = houseTypes.find((ht) => ht.id === selectedTypeId) ?? null;
  const availableCount = selectedType
    ? availability
      ? (availability.find((a) => a.house_type_id === selectedType.id)?.available_count ?? 0)
      : null
    : null;
  const isSoldOut = availableCount !== null && availableCount <= 0;
  const range = selectedType ? guestRange(selectedType, rates.maxExtraBeds) : { min: 1, max: 1 };

  // Gast 1 wird aus der Kontaktperson abgeleitet, solange das Häkchen gesetzt ist
  const contactAge = getAgeAtDate(contact.birth_date, eventStartDate);
  const contactGuest: GuestData = {
    ...(guests[0] ?? emptyGuest),
    first_name: contact.first_name,
    last_name: contact.last_name,
    gender: (contact.gender as "maennlich" | "weiblich") || undefined,
    birth_date: contact.birth_date || "",
    is_child: contactAge !== null && contactAge < CHILD_AGE_LIMIT,
    dietary_notes: contact.dietary_notes || "",
    sort_order: 0,
  };
  const effectiveGuests: GuestData[] =
    contactIsGuest && guests.length > 0 ? [contactGuest, ...guests.slice(1)] : guests;

  const price = selectedType
    ? calculateBookingPrice({
        housePrice: selectedType.price_per_house,
        startDate: eventStartDate,
        endDate: eventEndDate,
        guests: effectiveGuests,
        extraBeds,
        rates,
      })
    : null;


  function scrollToTop() {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function goTo(next: Step) {
    setError(null);
    setStep(next);
    setTimeout(scrollToTop, 50);
  }

  function selectHouseType(houseType: HouseType) {
    setSelectedTypeId(houseType.id);
    setExtraBeds(0);
    const { min, max } = guestRange(houseType, rates.maxExtraBeds);
    setGuests((prev) => {
      const trimmed = prev.slice(0, max);
      while (trimmed.length < min) trimmed.push({ ...emptyGuest, sort_order: trimmed.length });
      return trimmed.map((g, i) => ({ ...g, sort_order: i }));
    });
    goTo(2);
  }

  function updateGuest(index: number, field: keyof GuestData, value: string | boolean) {
    setGuests((prev) => prev.map((g, i) => (i === index ? { ...g, [field]: value } : g)));
  }

  function updateGuestBirthDate(index: number, value: string) {
    const age = getAgeAtDate(value, eventStartDate);
    setGuests((prev) =>
      prev.map((g, i) =>
        i === index ? { ...g, birth_date: value, is_child: age !== null && age < CHILD_AGE_LIMIT } : g
      )
    );
  }

  function addGuest() {
    if (guests.length >= range.max) return;
    setGuests((prev) => [...prev, { ...emptyGuest, sort_order: prev.length }]);
    setOpenGuests((prev) => new Set(prev).add(guests.length));
  }

  function removeGuest(index: number) {
    if (guests.length <= range.min) return;
    if (index === 0 && contactIsGuest) setContactIsGuest(false);
    setGuests((prev) => prev.filter((_, i) => i !== index).map((g, i) => ({ ...g, sort_order: i })));
  }

  function toggleGuest(index: number, open: boolean) {
    setOpenGuests((prev) => {
      const next = new Set(prev);
      if (open) next.add(index);
      else next.delete(index);
      return next;
    });
  }

  function guestSummary(g: GuestData, index: number) {
    const name = [g.first_name, g.last_name].filter(Boolean).join(" ");
    const age = getAgeAtDate(g.birth_date, eventStartDate);
    const parts = [
      index === 0 && contactIsGuest ? "Kontaktperson" : null,
      age !== null ? `${age} Jahre` : null,
    ].filter(Boolean);
    return { name: name || `Gast ${index + 1}`, meta: parts.join(" · ") };
  }

  /** Schritt 2 prüfen: native Pflichtfelder plus fachliche Regeln */
  function reviewStep() {
    setError(null);
    const form = formRef.current;
    if (!selectedType || !form) return;

    // Zugeklappte Gäste mit fehlenden Angaben zuerst öffnen, damit der Browser das Feld anzeigen kann
    const invalid = Array.from(form.querySelectorAll<HTMLElement>(":invalid"));
    if (invalid.length > 0) {
      const toOpen = new Set(openGuests);
      for (const el of invalid) {
        const idx = el.closest<HTMLElement>("[data-guest-index]")?.dataset.guestIndex;
        if (idx !== undefined) toOpen.add(Number(idx));
      }
      setOpenGuests(toOpen);
      setTimeout(() => form.reportValidity(), 60);
      return;
    }

    if (contact.birth_date) {
      const contactAge = getAgeAtDate(contact.birth_date, eventStartDate);
      if (contactAge !== null && contactAge < 18) {
        setError("Die Kontaktperson muss mindestens 18 Jahre alt sein.");
        return;
      }
    }
    if (guests.length < range.min) {
      setError(`Bitte tragt mindestens ${range.min} Gäste ein. ${selectedType.name} ist für ${selectedType.max_guests} Personen ausgelegt.`);
      return;
    }
    const badBirth = effectiveGuests.find((g) => g.birth_date && getAgeAtDate(g.birth_date, eventStartDate) === null);
    if (badBirth) {
      setError(`Bitte prüft das Geburtsdatum von ${badBirth.first_name || "einem Gast"}.`);
      return;
    }
    goTo(3);
  }

  function submit() {
    setError(null);
    if (!selectedType) return;
    if (!isSoldOut && !rulesAccepted) {
      setError("Bitte akzeptiert die Teilnahmebedingungen.");
      return;
    }
    const guestPayload = effectiveGuests.map((g, i) => ({ ...g, sort_order: i }));
    startTransition(async () => {
      const result = isSoldOut
        ? await joinWaitlist({
            event_id: eventId,
            house_type_id: selectedType.id,
            contact_first_name: contact.first_name,
            contact_last_name: contact.last_name,
            contact_email: contact.email,
            contact_phone: contact.phone || undefined,
            contact_gender: (contact.gender as "maennlich" | "weiblich") || undefined,
            guest_count: guests.length,
            guests: guestPayload,
          })
        : await createReservation({
            event_id: eventId,
            house_type_id: selectedType.id,
            contact_first_name: contact.first_name,
            contact_last_name: contact.last_name,
            contact_email: contact.email,
            contact_phone: contact.phone || undefined,
            contact_gender: (contact.gender as "maennlich" | "weiblich") || undefined,
            contact_birth_date: contact.birth_date || undefined,
            contact_dietary_notes: contact.dietary_notes || undefined,
            guests: guestPayload,
            extra_beds: extraBeds,
            rules_accepted: true as const,
          });
      if (result?.error) {
        setError(result.error);
        setTimeout(scrollToTop, 50);
      }
    });
  }

  const nights = price?.nights ?? 1;
  const dateLabel = formatDateRange(eventStartDate, eventEndDate);

  return (
    <div ref={topRef} className="scroll-mt-6">
      {/* Fortschritt */}
      <ol className="mb-[27px] grid grid-cols-4 gap-[7px] wide:gap-[10px]" aria-label="Schritte der Anmeldung">
        {STEPS.map((label, i) => {
          const n = (i + 1) as 1 | 2 | 3 | 4;
          const active = n === step;
          const done = n < step;
          return (
            <li
              key={label}
              aria-current={active ? "step" : undefined}
              className={cn(
                "border-b-2 pb-[13px] text-[12px] text-muted-foreground",
                active ? "border-brand font-semibold text-foreground" : "border-border",
                done && "text-foreground"
              )}
            >
              <span
                className={cn(
                  "mb-[7px] inline-flex h-6 w-6 items-center justify-center rounded-full bg-sage text-[11px] wide:mb-0 wide:mr-[5px]",
                  active && "bg-primary text-primary-foreground"
                )}
                aria-hidden="true"
              >
                {n}
              </span>
              <span className="block wide:inline">{label}</span>
            </li>
          );
        })}
      </ol>

      {error && (
        <div role="alert" className="mb-5 flex items-start gap-2 rounded-lg border border-destructive/40 bg-card px-4 py-3 text-[14px] text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {step === 1 && (
        <StayComparison
          houseTypes={houseTypes}
          availability={availability}
          rates={rates}
          nights={nights}
          selectedId={selectedTypeId}
          onSelect={selectHouseType}
          title="Welche Unterkunft passt zu euch?"
        />
      )}

      {step !== 1 && selectedType && (
        <div className="grid items-start gap-[25px] wide:grid-cols-[minmax(0,1.4fr)_minmax(240px,1fr)]">
          {/* Zusammenfassung */}
          <aside className="panel order-first wide:order-last" aria-label="Zusammenfassung">
            <p className="kicker mb-3 tracking-[0.12em]">Euer Wochenende</p>
            <h3 className="text-[17px] font-semibold leading-[1.35]">{selectedType.name}</h3>
            <p className="text-small mt-2">
              {dateLabel} · {guests.length} {guests.length === 1 ? "Gast" : "Gäste"}
              {extraBeds > 0 && <> · {extraBeds} {extraBeds === 1 ? "Zustellbett" : "Zustellbetten"}</>}
            </p>
            <Image
              src="/images/ferienhaus.webp"
              alt=""
              width={1000}
              height={1501}
              sizes="(min-width: 721px) 30vw, 0px"
              className="my-[13px] hidden h-[120px] w-full rounded-[9px] object-cover object-[center_45%] wide:block"
            />

            {isSoldOut ? (
              <div className="mt-[18px] border-t border-border pt-[14px] text-[13px] text-muted-foreground">
                Dieser Unterkunftstyp ist aktuell ausgebucht. Ihr werdet auf die Warteliste gesetzt und
                vom Freizeitteam benachrichtigt, sobald eine Unterkunft frei wird. Es entstehen jetzt
                keine Kosten.
              </div>
            ) : (
              price && (
                <>
                  <div className="mt-[18px] grid gap-[10px] border-t border-border pt-[14px] text-[13px]">
                    <Row label={`Hauspreis · ${nightsLabel(nights)}`} value={formatCurrency(price.accommodationPrice)} />
                    {price.extraBeds > 0 && (
                      <Row
                        label={`${price.extraBeds}x Zustellbett · ${formatCurrency(rates.extraBedPricePerDay)}/Tag`}
                        value={formatCurrency(price.extraBedTotal)}
                      />
                    )}
                    {price.adults > 0 && (
                      <Row
                        label={`Kurtaxe · ${price.adults}x ab ${rates.adultMinAge} Jahren`}
                        value={formatCurrency(price.adultTax)}
                      />
                    )}
                    {price.children > 0 && (
                      <Row
                        label={`Kurtaxe · ${price.children}x ${rates.childMinAge}–${rates.adultMinAge - 1} Jahre`}
                        value={formatCurrency(price.childTax)}
                      />
                    )}
                    {price.exempt > 0 && (
                      <Row label={`${price.exempt}x Kinder unter ${rates.childMinAge} Jahren`} value="kostenfrei" />
                    )}
                  </div>
                  <div className="mt-[15px] flex items-center justify-between gap-4 border-t border-border pt-4">
                    <span>Gesamtbetrag</span>
                    <strong className="text-[27px] font-medium tracking-[-0.7px]">{formatCurrency(price.total)}</strong>
                  </div>
                  <p className="pt-3 text-[12px] leading-[1.7] text-muted-foreground">
                    Inklusive Kurtaxe. Der Gesamtbetrag wird vorab überwiesen, die Kurtaxe führt das
                    Freizeitteam gesammelt an das Feriendorf ab.
                    {effectiveGuests.some((g) => !g.birth_date) && (
                      <> Ohne Geburtsdatum rechnen wir mit dem Erwachsenentarif.</>
                    )}
                  </p>
                </>
              )
            )}
          </aside>

          {/* Formularspalte */}
          <div className="min-w-0">
            {step === 2 && (
              <form
                ref={formRef}
                className="panel"
                onSubmit={(e) => {
                  e.preventDefault();
                  reviewStep();
                }}
                noValidate={false}
              >
                <h2 className="panel-title mb-[11px]">Wer kommt mit?</h2>
                <p className="text-small">
                  Die Kontaktperson bekommt die Bestätigung und alle wichtigen Informationen.
                </p>

                <div className="my-5 grid gap-4 wide:grid-cols-2">
                  <Field id="contact_first_name" label="Vorname *">
                    <input
                      id="contact_first_name"
                      className="field-input"
                      autoComplete="given-name"
                      value={contact.first_name}
                      onChange={(e) => setContact((c) => ({ ...c, first_name: e.target.value }))}
                      maxLength={100}
                      required
                    />
                  </Field>
                  <Field id="contact_last_name" label="Nachname *">
                    <input
                      id="contact_last_name"
                      className="field-input"
                      autoComplete="family-name"
                      value={contact.last_name}
                      onChange={(e) => setContact((c) => ({ ...c, last_name: e.target.value }))}
                      maxLength={100}
                      required
                    />
                  </Field>
                  <Field id="contact_email" label="E-Mail *">
                    <input
                      id="contact_email"
                      className="field-input"
                      type="email"
                      autoComplete="email"
                      value={contact.email}
                      onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
                      required
                    />
                  </Field>
                  <Field id="contact_phone" label="Telefon (optional)">
                    <input
                      id="contact_phone"
                      className="field-input"
                      type="tel"
                      autoComplete="tel"
                      value={contact.phone}
                      onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))}
                      maxLength={50}
                    />
                  </Field>
                  <fieldset>
                    <legend className="field-label mb-1.5">Geschlecht *</legend>
                    <div className="flex gap-5 pt-1">
                      <RadioOption name="contact_gender" label="Männlich" checked={contact.gender === "maennlich"} onChange={() => setContact((c) => ({ ...c, gender: "maennlich" }))} required />
                      <RadioOption name="contact_gender" label="Weiblich" checked={contact.gender === "weiblich"} onChange={() => setContact((c) => ({ ...c, gender: "weiblich" }))} />
                    </div>
                  </fieldset>
                  <Field id="contact_birth_date" label="Geburtsdatum" hint={ageHint(contact.birth_date, eventStartDate, true)}>
                    <input
                      id="contact_birth_date"
                      className="field-input"
                      type="date"
                      autoComplete="bday"
                      max={eventStartDate}
                      value={contact.birth_date}
                      onChange={(e) => setContact((c) => ({ ...c, birth_date: e.target.value }))}
                    />
                  </Field>
                  <Field id="contact_notes" label="Hinweise (optional)" className="wide:col-span-2">
                    <textarea
                      id="contact_notes"
                      className="field-input min-h-[70px]"
                      rows={2}
                      maxLength={500}
                      placeholder="z.B. Kinderbett wird benötigt, vegetarisch, Allergien"
                      value={contact.dietary_notes}
                      onChange={(e) => setContact((c) => ({ ...c, dietary_notes: e.target.value }))}
                    />
                  </Field>
                </div>

                <label className="my-[14px] flex items-center gap-[9px] text-[13px]">
                  <input
                    type="checkbox"
                    className="h-[17px] w-[17px] shrink-0 accent-primary"
                    checked={contactIsGuest}
                    onChange={(e) => setContactIsGuest(e.target.checked)}
                  />
                  Ich reise selbst mit und bin Gast 1.
                </label>

                <p className="mb-2 mt-[25px] text-[17px] font-semibold">Eure Mitreisenden</p>
                <p className="text-small">
                  {isSoldOut
                    ? "Tragt trotzdem alle Gäste ein, dann können wir euch direkt übernehmen, sobald eine Unterkunft frei wird."
                    : `Alle Personen, die im ${selectedType.name} übernachten: mindestens ${range.min}, höchstens ${range.max}. Das Geburtsdatum brauchen wir für die Kurtaxe.`}
                </p>

                <div className="mt-3">
                  {effectiveGuests.map((guest, index) => {
                    const { name, meta } = guestSummary(guest, index);
                    const open = openGuests.has(index);
                    return (
                      <details
                        key={index}
                        data-guest-index={index}
                        open={open}
                        onToggle={(e) => toggleGuest(index, (e.target as HTMLDetailsElement).open)}
                        className="border-t border-border py-[13px] last:border-b"
                      >
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[13px] [&::-webkit-details-marker]:hidden">
                          <span className="flex min-w-0 items-center gap-3">
                            <strong className="truncate">{name}</strong>
                            {meta && <span className="text-[11px] text-muted-foreground">{meta}</span>}
                          </span>
                          <span className="flex items-center gap-2">
                            {guests.length > range.min && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  removeGuest(index);
                                }}
                                aria-label={`${name} entfernen`}
                                className="rounded-md p-1 text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                              </button>
                            )}
                            <span className="text-[19px] leading-none text-primary" aria-hidden="true">
                              {open ? "−" : "+"}
                            </span>
                          </span>
                        </summary>
                        <div className="mt-3 grid gap-4 wide:grid-cols-2">
                          <Field id={`guest_${index}_first_name`} label="Vorname *">
                            <input
                              id={`guest_${index}_first_name`}
                              className="field-input"
                              value={guest.first_name}
                              onChange={(e) => updateGuest(index, "first_name", e.target.value)}
                              maxLength={100}
                              required
                              disabled={index === 0 && contactIsGuest}
                            />
                          </Field>
                          <Field id={`guest_${index}_last_name`} label="Nachname *">
                            <input
                              id={`guest_${index}_last_name`}
                              className="field-input"
                              value={guest.last_name}
                              onChange={(e) => updateGuest(index, "last_name", e.target.value)}
                              maxLength={100}
                              required
                              disabled={index === 0 && contactIsGuest}
                            />
                          </Field>
                          <fieldset>
                            <legend className="field-label mb-1.5">Geschlecht *</legend>
                            <div className="flex gap-5 pt-1">
                              <RadioOption name={`guest_gender_${index}`} label="Männlich" checked={guest.gender === "maennlich"} onChange={() => updateGuest(index, "gender", "maennlich")} required disabled={index === 0 && contactIsGuest} />
                              <RadioOption name={`guest_gender_${index}`} label="Weiblich" checked={guest.gender === "weiblich"} onChange={() => updateGuest(index, "gender", "weiblich")} disabled={index === 0 && contactIsGuest} />
                            </div>
                          </fieldset>
                          <Field id={`guest_${index}_birth_date`} label="Geburtsdatum *" hint={ageHint(guest.birth_date, eventStartDate)}>
                            <input
                              id={`guest_${index}_birth_date`}
                              className="field-input"
                              type="date"
                              max={eventStartDate}
                              value={guest.birth_date ?? ""}
                              onChange={(e) => updateGuestBirthDate(index, e.target.value)}
                              required={!isSoldOut}
                              disabled={index === 0 && contactIsGuest}
                            />
                          </Field>
                          <Field id={`guest_${index}_notes`} label="Hinweise (optional)" className="wide:col-span-2">
                            <textarea
                              id={`guest_${index}_notes`}
                              className="field-input min-h-[60px]"
                              rows={2}
                              maxLength={500}
                              placeholder="z.B. Kinderbett wird benötigt, vegetarisch, Allergien"
                              value={guest.dietary_notes ?? ""}
                              onChange={(e) => updateGuest(index, "dietary_notes", e.target.value)}
                              disabled={index === 0 && contactIsGuest}
                            />
                          </Field>
                          {index === 0 && contactIsGuest && (
                            <p className="text-small wide:col-span-2">
                              Die Angaben werden von der Kontaktperson übernommen. Zum Bearbeiten das Häkchen oben entfernen.
                            </p>
                          )}
                        </div>
                      </details>
                    );
                  })}
                </div>

                {guests.length < range.max && (
                  <button type="button" className="btn-secondary mt-4 w-full" onClick={addGuest}>
                    <Plus className="h-[17px] w-[17px]" aria-hidden="true" />
                    Weiteren Gast hinzufügen
                  </button>
                )}

                {!isSoldOut && rates.maxExtraBeds > 0 && (
                  <div className="mt-5 rounded-lg bg-sage p-4">
                    <label htmlFor="extra_beds" className="field-label">
                      Zustellbetten
                    </label>
                    <p className="text-small mt-1">
                      {selectedType.name} hat {selectedType.max_guests} feste Schlafplätze. Bis zu{" "}
                      {rates.maxExtraBeds} Zustellbetten für {formatCurrency(rates.extraBedPricePerDay)} pro
                      Bett und Tag könnt ihr dazubuchen. Ein Doppelbett kann auch von zwei Personen genutzt
                      werden, dann ist kein Zustellbett nötig.
                    </p>
                    <select
                      id="extra_beds"
                      className="field-input mt-3 w-full wide:w-60"
                      value={extraBeds}
                      onChange={(e) => setExtraBeds(Number(e.target.value))}
                    >
                      {Array.from({ length: rates.maxExtraBeds + 1 }, (_, n) => (
                        <option key={n} value={n}>
                          {n === 0 ? "Kein Zustellbett" : `${n} ${n === 1 ? "Zustellbett" : "Zustellbetten"}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <button type="submit" className="btn-primary mt-6 w-full">
                  Angaben prüfen
                  <ArrowRight className="h-[17px] w-[17px]" aria-hidden="true" />
                </button>
                <button type="button" className="text-link mt-3" onClick={() => goTo(1)}>
                  ← Andere Unterkunft wählen
                </button>
              </form>
            )}

            {step === 3 && (
              <div className="panel">
                <h2 className="panel-title mb-[11px]">Passt alles?</h2>
                <p className="text-small">
                  {isSoldOut
                    ? "Vor dem Eintrag auf die Warteliste seht ihr eure Angaben noch einmal."
                    : "Vor dem Abschluss seht ihr eure Angaben und den vollständigen Überweisungsbetrag."}
                </p>

                <ul className="my-5 list-disc space-y-1.5 pl-5 text-[14px] text-muted-foreground">
                  <li>
                    <CalendarDays className="mr-1.5 inline h-4 w-4 text-primary" aria-hidden="true" />
                    {dateLabel} · {nightsLabel(nights)}
                  </li>
                  <li>{selectedType.name}</li>
                  <li>
                    {guests.length} {guests.length === 1 ? "Mitreisender" : "Mitreisende"}:{" "}
                    {effectiveGuests.map((g, i) => guestSummary(g, i).name).join(", ")}
                  </li>
                  {extraBeds > 0 && <li>{extraBeds} {extraBeds === 1 ? "Zustellbett" : "Zustellbetten"}</li>}
                  <li>
                    Kontakt: {contact.first_name} {contact.last_name}, {contact.email}
                    {contact.phone && <>, {contact.phone}</>}
                  </li>
                  {!isSoldOut && <li>Hauspreis und Kurtaxe werden zusammen überwiesen.</li>}
                </ul>

                {!isSoldOut && (
                  <div className="my-[18px] rounded-lg bg-sage p-[14px] text-[12px] leading-relaxed">
                    Die Kurtaxe ist im Gesamtbetrag enthalten. Das Freizeitteam übernimmt die Abführung vor
                    Ort. Nach dem Absenden seht ihr Bankverbindung, Verwendungszweck und Zahlungsfrist. Die
                    Reservierung bleibt {reservationValidityDays} Tage gültig und wird mit dem Zahlungseingang
                    verbindlich.
                  </div>
                )}

                {!isSoldOut && (
                  <>
                    <details className="rounded-lg border border-border px-4 py-3 text-[13px]">
                      <summary className="cursor-pointer font-semibold">Teilnahmebedingungen lesen</summary>
                      <div className="mt-3 max-h-[320px] overflow-y-auto pr-2">
                        <RulesContent reservationValidityDays={reservationValidityDays} />
                      </div>
                    </details>
                    <label className="my-[14px] flex items-start gap-[9px] text-[13px]">
                      <input
                        type="checkbox"
                        className="mt-0.5 h-[17px] w-[17px] shrink-0 accent-primary"
                        checked={rulesAccepted}
                        onChange={(e) => setRulesAccepted(e.target.checked)}
                        required
                      />
                      <span>
                        Ich akzeptiere die{" "}
                        <Link href="/teilnahmebedingungen" target="_blank" className="text-link text-[13px]">
                          Teilnahmebedingungen
                        </Link>{" "}
                        und habe die{" "}
                        <Link href="/datenschutz" target="_blank" className="text-link text-[13px]">
                          Datenschutzhinweise
                        </Link>{" "}
                        zur Kenntnis genommen.
                      </span>
                    </label>
                  </>
                )}

                <button
                  type="button"
                  className="btn-primary mt-2 w-full"
                  disabled={isPending || (!isSoldOut && !rulesAccepted)}
                  onClick={submit}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      {isSoldOut ? "Wartelisteneintrag wird erstellt" : "Reservierung wird gesendet"}
                    </>
                  ) : isSoldOut ? (
                    "Auf Warteliste setzen"
                  ) : (
                    "Reservierung absenden"
                  )}
                </button>
                <button type="button" className="text-link mt-3" onClick={() => goTo(2)} disabled={isPending}>
                  ← Angaben bearbeiten
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-[18px]">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function Field({
  id,
  label,
  hint,
  className,
  children,
}: {
  id: string;
  label: string;
  hint?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      {children}
      {hint}
    </div>
  );
}

function RadioOption({
  name,
  label,
  checked,
  onChange,
  required,
  disabled,
}: {
  name: string;
  label: string;
  checked: boolean;
  onChange: () => void;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-[14px]">
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className="h-4 w-4 accent-primary"
      />
      {label}
    </label>
  );
}

function ageHint(birthDate: string | undefined, startDate: string, isContact = false) {
  if (!birthDate) return null;
  const age = getAgeAtDate(birthDate, startDate);
  if (age === null) {
    return <p className="text-[12px] font-medium text-destructive">Das Geburtsdatum liegt nach dem Freizeitbeginn.</p>;
  }
  if (isContact && age < 18) {
    return <p className="text-[12px] font-medium text-destructive">Die Kontaktperson muss mindestens 18 Jahre alt sein ({age} Jahre zum Freizeitbeginn).</p>;
  }
  return <p className="text-[12px] text-muted-foreground">{age} Jahre zum Freizeitbeginn</p>;
}
