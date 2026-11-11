"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, CalendarDays, Loader2, Plus, Trash2, Users } from "lucide-react";
import { createReservation } from "@/lib/actions/booking";
import { joinWaitlist } from "@/lib/actions/waitlist";
import { formatCurrency, formatDateRange } from "@/lib/utils/format";
import {
  calculateBookingPrice,
  getAgeAtDate,
  getNights,
  type PricingRates,
} from "@/lib/utils/pricing";
import type { Availability, HouseStatus, HouseType } from "@/lib/types/database";
import type { GuestData } from "@/lib/validations/booking";
import { StayComparison } from "@/components/stays/stay-comparison";
import { HOUSE_WISH_NOTE, nightsLabel } from "@/lib/utils/stay";
import { AvailabilityBadge } from "@/components/stays/availability-badge";
import { HELP_ANY, HELP_AREAS, HELP_MIN_AGE, helpAreaLabels, type HelpAreaKey } from "@/lib/config/help-areas";
import { RulesContent } from "./rules-content";
import { ProblemDialog, type FormProblem } from "./problem-dialog";
import { cn } from "@/lib/utils";

interface BookingWizardProps {
  eventId: string;
  eventStartDate: string;
  eventEndDate: string;
  houseTypes: HouseType[];
  availability: Availability[] | null;
  /** Belegung je Haus für die feste Hauswahl, null = Hauswahl nicht verfügbar */
  houseStatus?: HouseStatus[] | null;
  reservationValidityDays: number;
  rates: PricingRates;
  initialHouseTypeId?: string | null;
  /** im Lageplan gewähltes Haus (Hausnummer innerhalb der Unterkunftsart) */
  initialHouseNumber?: number | null;
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
  help_areas: [],
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
  houseStatus = null,
  reservationValidityDays,
  rates,
  initialHouseTypeId = null,
  initialHouseNumber = null,
}: BookingWizardProps) {
  const initialType = houseTypes.find((ht) => ht.id === initialHouseTypeId) ?? null;
  const initialHouse =
    initialType && initialHouseNumber !== null
      ? (houseStatus?.find(
          (h) => h.house_type_id === initialType.id && h.house_number === initialHouseNumber
        ) ?? null)
      : null;

  const [step, setStep] = useState<Step>(initialType ? 2 : 1);
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(initialType?.id ?? null);
  const [selectedHouseId, setSelectedHouseId] = useState<string | null>(
    initialHouse?.is_free ? initialHouse.house_id : null
  );
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
  const [error, setError] = useState<string | null>(
    initialHouse && !initialHouse.is_free
      ? `${initialHouse.label} ist leider schon vergeben. Wählt unter „Wunschhaus“ ein anderes Haus oder lasst euch eines zuteilen.`
      : null
  );
  const [isPending, startTransition] = useTransition();
  /** fehlende Angaben, die das Hinweisfenster auflistet */
  const [problems, setProblems] = useState<FormProblem[] | null>(null);
  /** einzelner Hinweis im Fenster, zum Beispiel nach dem Absenden */
  const [notice, setNotice] = useState<string | null>(null);
  /** Feld, das nach dem Schließen des Fensters den Fokus bekommt */
  const jumpTarget = useRef<HTMLElement | null>(null);
  const router = useRouter();

  const formRef = useRef<HTMLFormElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const selectedType = houseTypes.find((ht) => ht.id === selectedTypeId) ?? null;
  const availableCount = selectedType
    ? availability
      ? (availability.find((a) => a.house_type_id === selectedType.id)?.available_count ?? 0)
      : null
    : null;
  const isSoldOut = availableCount !== null && availableCount <= 0;

  // Feste Hauswahl: nur bei Arten mit mehreren Häusern und solange etwas frei ist
  const typeHouses = selectedType
    ? (houseStatus ?? [])
        .filter((h) => h.house_type_id === selectedType.id)
        .sort((a, b) => a.house_number - b.house_number)
    : [];
  const canPickHouse = !isSoldOut && typeHouses.length > 1;
  const selectedHouse = canPickHouse
    ? (typeHouses.find((h) => h.house_id === selectedHouseId && h.is_free) ?? null)
    : null;
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

  /** Gäste, die mindestens einen Bereich zum Mithelfen gewählt haben (Kinder unter 14 zählen nicht) */
  const helpers = effectiveGuests.filter((g) => {
    const age = getAgeAtDate(g.birth_date, eventStartDate);
    return (age === null || age >= HELP_MIN_AGE) && (g.help_areas ?? []).length > 0;
  });

  // Die Kurtaxe hängt vom Alter ab. Solange beim Ausfüllen Geburtsdaten fehlen, zählen nur die
  // Gäste mit Geburtsdatum, der Rest wird als "folgt" ausgewiesen (statt alle als Erwachsene zu rechnen).
  // Die Kontaktperson ist volljährig und zählt auch ohne Geburtsdatum als Erwachsene.
  const guestsWithBirth = effectiveGuests.filter(
    (g, i) => (i === 0 && contactIsGuest) || getAgeAtDate(g.birth_date, eventStartDate) !== null
  );
  const missingBirth = effectiveGuests.length - guestsWithBirth.length;
  const taxPending = step === 2 && missingBirth > 0;

  const price = selectedType
    ? calculateBookingPrice({
        housePrice: selectedType.price_per_house,
        startDate: eventStartDate,
        endDate: eventEndDate,
        guests: taxPending ? guestsWithBirth : effectiveGuests,
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
    if (houseType.id !== selectedTypeId) setSelectedHouseId(null);
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

  /** Kinder unter 14 Jahren wählen keinen Bereich */
  function canHelp(g: GuestData) {
    const age = getAgeAtDate(g.birth_date, eventStartDate);
    return age === null || age >= HELP_MIN_AGE;
  }

  function toggleHelp(index: number, key: HelpAreaKey) {
    setGuests((prev) =>
      prev.map((g, i) => {
        if (i !== index) return g;
        const current = g.help_areas ?? [];
        if (current.includes(key)) return { ...g, help_areas: current.filter((k) => k !== key) };
        // "Egal" und feste Bereiche schließen sich aus
        const next = key === HELP_ANY ? [key] : [...current.filter((k) => k !== HELP_ANY), key];
        return { ...g, help_areas: next };
      })
    );
  }

  // Familienname der Kontaktperson bei allen Mitreisenden eintragen, deren Nachname noch leer ist
  const familyName = contact.last_name.trim();
  const firstOtherGuest = contactIsGuest ? 1 : 0;
  const guestsWithoutLastName = guests.filter(
    (g, i) => i >= firstOtherGuest && !g.last_name.trim()
  ).length;

  function applyFamilyName() {
    if (!familyName) return;
    setGuests((prev) =>
      prev.map((g, i) =>
        i >= firstOtherGuest && !g.last_name.trim() ? { ...g, last_name: familyName } : g
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

  /** Schritt 2 prüfen: Alles, was fehlt, wird gesammelt und in einem Fenster aufgelistet */
  function reviewStep() {
    setError(null);
    const form = formRef.current;
    if (!selectedType || !form) return;

    const found: FormProblem[] = [];
    const toOpen = new Set(openGuests);
    const seenRadios = new Set<string>();
    const controls = Array.from(
      form.querySelectorAll<FormControl>("input:invalid, select:invalid, textarea:invalid")
    );
    for (const el of controls) {
      // eine Auswahlgruppe (Geschlecht) nur einmal melden
      if (el instanceof HTMLInputElement && el.type === "radio") {
        if (seenRadios.has(el.name)) continue;
        seenRadios.add(el.name);
      }
      const guestIndex = el.closest<HTMLElement>("[data-guest-index]")?.dataset.guestIndex;
      let section = "Kontaktperson";
      if (guestIndex !== undefined) {
        const i = Number(guestIndex);
        toOpen.add(i);
        const g = effectiveGuests[i];
        const fullName = g ? [g.first_name, g.last_name].filter(Boolean).join(" ").trim() : "";
        section = fullName ? `Gast ${i + 1} (${fullName})` : `Gast ${i + 1}`;
      }
      found.push({ section, text: problemText(el), el });
    }

    // Der Browser lässt Adressen ohne Endung durch ("name@firma"), die Buchung würde später scheitern
    const emailEl = form.querySelector<HTMLInputElement>("#contact_email");
    if (emailEl && emailEl.validity.valid && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contact.email.trim())) {
      found.unshift({
        section: "Kontaktperson",
        text: "E-Mail: bitte eine gültige Adresse eingeben",
        el: emailEl,
      });
    }

    if (contact.birth_date) {
      const contactAge = getAgeAtDate(contact.birth_date, eventStartDate);
      if (contactAge !== null && contactAge < 18) {
        found.push({
          section: "Kontaktperson",
          text: "Die Kontaktperson muss mindestens 18 Jahre alt sein",
          el: form.querySelector<HTMLElement>("#contact_birth_date"),
        });
      }
    }
    if (guests.length < range.min) {
      found.push({
        section: "Mitreisende",
        text: `Bitte tragt mindestens ${range.min} Gäste ein. ${selectedType.name} ist für ${selectedType.max_guests} Personen ausgelegt.`,
      });
    }
    if (!isSoldOut && helpers.length === 0) {
      found.push({
        section: "Mithilfe",
        text: `Bitte wählt bei mindestens einer Person ab ${HELP_MIN_AGE} Jahren einen Bereich zum Mithelfen`,
        el: form.querySelector<HTMLElement>("[data-help-index] input"),
      });
    }

    if (found.length > 0) {
      // Zugeklappte Gäste mit fehlenden Angaben öffnen, damit der Sprung zum Feld funktioniert
      setOpenGuests(toOpen);
      setProblems(found);
      return;
    }
    goTo(3);
  }

  /** Aus dem Hinweisfenster zu einem Feld springen */
  function jumpTo(problem: FormProblem) {
    jumpTarget.current = problem.el ?? null;
    setProblems(null);
  }

  /** Nach dem Schließen des Fensters: Feld in die Mitte holen und den Cursor hineinsetzen */
  function afterDialogClosed(event: Event) {
    const el = jumpTarget.current;
    jumpTarget.current = null;
    if (!el || !el.isConnected) return;
    event.preventDefault();
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    el.focus({ preventScroll: true });
  }

  function submit() {
    setError(null);
    if (!selectedType) return;
    if (!isSoldOut && !rulesAccepted) {
      setError("Bitte akzeptiert die Teilnahmebedingungen.");
      return;
    }
    const guestPayload = effectiveGuests.map((g, i) => ({
      ...g,
      help_areas: canHelp(g) ? (g.help_areas ?? []) : [],
      sort_order: i,
    }));
    startTransition(async () => {
      const result = isSoldOut
        ? await joinWaitlist({
            event_id: eventId,
            house_type_id: selectedType.id,
            contact_first_name: contact.first_name,
            contact_last_name: contact.last_name,
            contact_email: contact.email,
            contact_phone: contact.phone,
            contact_gender: (contact.gender as "maennlich" | "weiblich") || undefined,
            guest_count: guests.length,
            guests: guestPayload,
          })
        : await createReservation({
            event_id: eventId,
            house_type_id: selectedType.id,
            house_id: selectedHouse?.house_id,
            contact_first_name: contact.first_name,
            contact_last_name: contact.last_name,
            contact_email: contact.email,
            contact_phone: contact.phone,
            contact_gender: (contact.gender as "maennlich" | "weiblich") || undefined,
            contact_birth_date: contact.birth_date || undefined,
            contact_dietary_notes: contact.dietary_notes || undefined,
            guests: guestPayload,
            extra_beds: extraBeds,
            rules_accepted: true as const,
          });
      if (result?.error) {
        if ("houseTaken" in result && result.houseTaken) {
          // Wunschhaus inzwischen vergeben: Auswahl zurücksetzen und Belegung neu laden
          const taken = `${selectedHouse?.label ?? "Das gewählte Haus"} wurde gerade eben vergeben. Wählt unter „Wunschhaus“ ein anderes Haus oder lasst euch eines zuteilen.`;
          setError(taken);
          setNotice(taken);
          setSelectedHouseId(null);
          router.refresh();
          setTimeout(scrollToTop, 50);
          return;
        }
        setError(result.error);
        setNotice(result.error);
        // Unterkunft inzwischen vergeben: freie Plätze neu laden, dann erscheint die Warteliste
        if ("soldOut" in result && result.soldOut) router.refresh();
        setTimeout(scrollToTop, 50);
      }
    });
  }

  const nights = price?.nights ?? getNights(eventStartDate, eventEndDate);
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
                "border-b-2 pb-[13px] text-[12px] leading-snug text-muted-foreground wide:text-[14px]",
                active ? "border-brand font-semibold text-foreground" : "border-border",
                done && "text-foreground"
              )}
            >
              <span
                className={cn(
                  "mb-[7px] inline-flex h-6 w-6 items-center justify-center rounded-full bg-sage text-[13px] wide:mb-0 wide:mr-[5px]",
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

      <ProblemDialog
        problems={problems}
        message={notice}
        onClose={() => {
          setProblems(null);
          setNotice(null);
        }}
        onJump={jumpTo}
        onClosed={afterDialogClosed}
      />

      {error && (
        <div role="alert" className="mb-5 flex items-start gap-2 rounded-lg border border-destructive/40 bg-card px-4 py-3 text-[16px] text-destructive">
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
            <h3 className="text-[19px] font-semibold leading-[1.35]">{selectedType.name}</h3>
            {availableCount !== null && (
              <AvailabilityBadge
                free={Math.max(availableCount, 0)}
                total={selectedType.total_quantity}
                className="mt-2"
              />
            )}
            <p className="text-small mt-2">
              {dateLabel} · {guests.length} {guests.length === 1 ? "Gast" : "Gäste"}
              {extraBeds > 0 && <> · {extraBeds} {extraBeds === 1 ? "Zustellbett" : "Zustellbetten"}</>}
            </p>
            {canPickHouse && (
              <div className="mt-[14px] rounded-lg bg-sage p-[13px]">
                <label htmlFor="wunschhaus" className="field-label">
                  Wunschhaus
                </label>
                <select
                  id="wunschhaus"
                  className="field-input mt-2 w-full"
                  value={selectedHouse?.house_id ?? ""}
                  onChange={(e) => setSelectedHouseId(e.target.value || null)}
                >
                  <option value="">Kein Wunsch, bitte zuteilen</option>
                  {typeHouses.map((h) => (
                    <option key={h.house_id} value={h.house_id} disabled={!h.is_free}>
                      {h.label}
                      {h.is_free ? "" : " (vergeben)"}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-[13px] leading-[1.5] text-muted-foreground">
                  {HOUSE_WISH_NOTE}{" "}
                  <Link href="/unterkuenfte#lageplan" target="_blank" className="text-link text-[13px]">
                    Lageplan ansehen
                  </Link>
                </p>
              </div>
            )}
            <Image
              src="/images/ferienhaus.webp"
              alt=""
              width={1080}
              height={720}
              sizes="(min-width: 1120px) 330px, (min-width: 721px) 30vw, 1px"
              className="my-[13px] hidden h-[120px] w-full rounded-[9px] object-cover object-[50%_75%] wide:block"
            />

            {isSoldOut ? (
              <div className="mt-[18px] border-t border-border pt-[14px] text-[15px] text-muted-foreground">
                Dieser Unterkunftstyp ist aktuell ausgebucht. Ihr werdet auf die Warteliste gesetzt und
                vom Freizeitteam benachrichtigt, sobald eine Unterkunft frei wird. Es entstehen jetzt
                keine Kosten.
              </div>
            ) : (
              price && (
                <>
                  <div className="mt-[18px] grid gap-[10px] border-t border-border pt-[14px] text-[15px]">
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
                    {taxPending && (
                      <Row
                        label={
                          guestsWithBirth.length === 0
                            ? "Kurtaxe · je nach Alter der Gäste"
                            : `Kurtaxe · ${missingBirth} ${missingBirth === 1 ? "Geburtsdatum fehlt" : "Geburtsdaten fehlen"} noch`
                        }
                        value="folgt"
                      />
                    )}
                  </div>
                  <div className="mt-[15px] flex items-center justify-between gap-4 border-t border-border pt-4">
                    <span>{taxPending ? "Zwischensumme" : "Gesamtbetrag"}</span>
                    <strong className="text-[30px] font-medium tracking-[-0.7px]">{formatCurrency(price.total)}</strong>
                  </div>
                  {taxPending ? (
                    <p className="pt-3 text-[14px] leading-[1.7] text-muted-foreground">
                      Dazu kommt die Kurtaxe. Sie richtet sich nach dem Alter und wird hier ergänzt, sobald
                      ihr die Geburtsdaten eintragt: ab {rates.adultMinAge} Jahren{" "}
                      {formatCurrency(rates.adultRate)}, von {rates.childMinAge} bis {rates.adultMinAge - 1}{" "}
                      Jahren {formatCurrency(rates.childRate)} pro Nacht, jüngere Kinder sind frei.
                    </p>
                  ) : (
                    <p className="pt-3 text-[14px] leading-[1.7] text-muted-foreground">
                      Inklusive Kurtaxe. Der Gesamtbetrag wird vorab überwiesen, die Kurtaxe führt das
                      Freizeitteam gesammelt an das Feriendorf ab.
                    </p>
                  )}
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
                noValidate
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
                  <Field id="contact_phone" label="Handy- oder Telefonnummer *">
                    <input
                      id="contact_phone"
                      className="field-input"
                      type="tel"
                      autoComplete="tel"
                      value={contact.phone}
                      onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))}
                      minLength={5}
                      maxLength={50}
                      required
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

                <label className="my-[14px] flex items-center gap-[9px] text-[15px]">
                  <input
                    type="checkbox"
                    className="h-[17px] w-[17px] shrink-0 accent-primary"
                    checked={contactIsGuest}
                    onChange={(e) => setContactIsGuest(e.target.checked)}
                  />
                  Ich reise selbst mit und bin Gast 1.
                </label>

                <p className="mb-2 mt-[25px] text-[19px] font-semibold">Eure Mitreisenden</p>
                <p className="text-small">
                  {isSoldOut
                    ? "Tragt trotzdem alle Gäste ein, dann können wir euch direkt übernehmen, sobald eine Unterkunft frei wird."
                    : `Alle Personen, die im ${selectedType.name} übernachten: mindestens ${range.min}, höchstens ${range.max}. Das Geburtsdatum brauchen wir für die Kurtaxe.`}
                </p>
                <div className="mt-3 rounded-lg bg-sage p-[13px] text-[15px] leading-[1.55]">
                  <strong className="font-semibold">Mithelfen:</strong> Die Freizeit lebt davon, dass alle
                  mit anpacken. Wählt bei jedem Gast ab {HELP_MIN_AGE} Jahren, wo er oder sie mithelfen
                  kann. {isSoldOut ? "" : "Mindestens ein Bereich pro Haus ist Pflicht."}
                </div>
                {familyName && guestsWithoutLastName > 0 && (
                  <button
                    type="button"
                    className="btn-secondary mt-3 min-h-0 px-[14px] py-[8px] text-[15px]"
                    onClick={applyFamilyName}
                    data-family-name=""
                  >
                    <Users className="h-[17px] w-[17px]" aria-hidden="true" />
                    Nachname „{familyName}“ bei {guestsWithoutLastName === 1 ? "der weiteren Person" : "allen Mitreisenden"} eintragen
                  </button>
                )}

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
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[15px] [&::-webkit-details-marker]:hidden">
                          <span className="flex min-w-0 items-center gap-3">
                            <strong className="truncate">{name}</strong>
                            {meta && <span className="text-[13px] text-muted-foreground">{meta}</span>}
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
                            <span className="text-[21px] leading-none text-primary" aria-hidden="true">
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
                          {canHelp(guest) && (
                            <fieldset className="wide:col-span-2" data-help-index={index}>
                              <legend className="field-label mb-2">
                                Wo kann {guest.first_name.trim() || `Gast ${index + 1}`} mithelfen?
                              </legend>
                              <div className="flex flex-wrap gap-2">
                                {HELP_AREAS.map((area) => {
                                  const checked = (guest.help_areas ?? []).includes(area.key);
                                  return (
                                    <label
                                      key={area.key}
                                      className={cn(
                                        "cursor-pointer rounded-full border px-3 py-[6px] text-[14px] leading-[1.35] transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                                        checked
                                          ? "border-primary bg-primary text-primary-foreground"
                                          : "border-border bg-card hover:border-[#bcc7b5]"
                                      )}
                                    >
                                      <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={checked}
                                        onChange={() => toggleHelp(index, area.key)}
                                      />
                                      {area.label}
                                    </label>
                                  );
                                })}
                              </div>
                            </fieldset>
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

                <ul className="my-5 list-disc space-y-1.5 pl-5 text-[16px] text-muted-foreground">
                  <li>
                    <CalendarDays className="mr-1.5 inline h-4 w-4 text-primary" aria-hidden="true" />
                    {dateLabel} · {nightsLabel(nights)}
                  </li>
                  <li>
                    {selectedType.name}
                    {canPickHouse && (
                      <> · {selectedHouse ? `Wunschhaus: ${selectedHouse.label}` : "Haus wird zugeteilt"}</>
                    )}
                  </li>
                  <li>
                    {guests.length} {guests.length === 1 ? "Mitreisender" : "Mitreisende"}:{" "}
                    {effectiveGuests.map((g, i) => guestSummary(g, i).name).join(", ")}
                  </li>
                  {extraBeds > 0 && <li>{extraBeds} {extraBeds === 1 ? "Zustellbett" : "Zustellbetten"}</li>}
                  {helpers.length > 0 && (
                    <li>
                      Mithilfe:{" "}
                      {helpers
                        .map((g) => `${g.first_name} (${helpAreaLabels(g.help_areas)})`)
                        .join(", ")}
                    </li>
                  )}
                  <li>
                    Kontakt: {contact.first_name} {contact.last_name}, {contact.email}
                    {contact.phone && <>, {contact.phone}</>}
                  </li>
                  {!isSoldOut && <li>Hauspreis und Kurtaxe werden zusammen überwiesen.</li>}
                </ul>

                {!isSoldOut && (
                  <div className="my-[18px] rounded-lg bg-sage p-[14px] text-[14px] leading-relaxed">
                    Die Kurtaxe ist im Gesamtbetrag enthalten. Das Freizeitteam übernimmt die Abführung vor
                    Ort. Nach dem Absenden seht ihr Bankverbindung, Verwendungszweck und Zahlungsfrist. Die
                    Reservierung bleibt {reservationValidityDays} Tage gültig und wird mit dem Zahlungseingang
                    verbindlich.
                  </div>
                )}

                {!isSoldOut && (
                  <>
                    <details className="rounded-lg border border-border px-4 py-3 text-[15px]">
                      <summary className="cursor-pointer font-semibold">Teilnahmebedingungen lesen</summary>
                      <div className="mt-3 max-h-[320px] overflow-y-auto pr-2">
                        <RulesContent reservationValidityDays={reservationValidityDays} />
                      </div>
                    </details>
                    <label className="my-[14px] flex items-start gap-[9px] text-[15px]">
                      <input
                        type="checkbox"
                        className="mt-0.5 h-[17px] w-[17px] shrink-0 accent-primary"
                        checked={rulesAccepted}
                        onChange={(e) => setRulesAccepted(e.target.checked)}
                        required
                      />
                      <span>
                        Ich akzeptiere die{" "}
                        <Link href="/teilnahmebedingungen" target="_blank" className="text-link text-[15px]">
                          Teilnahmebedingungen
                        </Link>{" "}
                        und habe die{" "}
                        <Link href="/datenschutz" target="_blank" className="text-link text-[15px]">
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
    <label className="flex cursor-pointer items-center gap-2 text-[16px]">
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
    return <p className="text-[14px] font-medium text-destructive">Das Geburtsdatum liegt nach dem Freizeitbeginn.</p>;
  }
  if (isContact && age < 18) {
    return <p className="text-[14px] font-medium text-destructive">Die Kontaktperson muss mindestens 18 Jahre alt sein ({age} Jahre zum Freizeitbeginn).</p>;
  }
  return <p className="text-[14px] text-muted-foreground">{age} Jahre zum Freizeitbeginn</p>;
}

type FormControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

/** Beschriftung eines Feldes ohne Sternchen, bei Auswahlgruppen die Überschrift der Gruppe */
function fieldLabel(el: FormControl): string {
  const isRadio = el instanceof HTMLInputElement && el.type === "radio";
  const raw = isRadio
    ? el.closest("fieldset")?.querySelector("legend")?.textContent
    : el.id
      ? el.form?.querySelector(`label[for="${el.id}"]`)?.textContent
      : null;
  return (raw ?? "Angabe").replace(/\s*\*\s*$/, "").trim();
}

/** Verständlicher Satz dazu, was an einem Feld nicht stimmt */
function problemText(el: FormControl): string {
  const label = fieldLabel(el);
  const v = el.validity;
  if (v.badInput) return `${label} ist unvollständig`;
  if (v.valueMissing) return `${label} fehlt`;
  if (v.typeMismatch) return `${label}: bitte eine gültige Adresse eingeben`;
  if (v.tooShort) return `${label} ist zu kurz`;
  if (v.rangeOverflow) return `${label} liegt nach dem Beginn der Freizeit`;
  return `${label}: bitte prüfen`;
}
