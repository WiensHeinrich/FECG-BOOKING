import type { Event } from "@/lib/types/database";

/** Tarife für Kurtaxe und Zustellbetten, gepflegt am Event (Admin: Einstellungen). */
export interface PricingRates {
  adultRate: number;
  childRate: number;
  childMinAge: number;
  adultMinAge: number;
  extraBedPricePerDay: number;
  maxExtraBeds: number;
}

export const DEFAULT_RATES: PricingRates = {
  adultRate: 2.6,
  childRate: 1.5,
  childMinAge: 6,
  adultMinAge: 17,
  extraBedPricePerDay: 19,
  maxExtraBeds: 2,
};

export function ratesFromEvent(event: Pick<
  Event,
  | "tourist_tax_adult_rate"
  | "tourist_tax_child_rate"
  | "tourist_tax_child_min_age"
  | "tourist_tax_adult_min_age"
  | "extra_bed_price_per_day"
  | "max_extra_beds"
>): PricingRates {
  return {
    adultRate: Number(event.tourist_tax_adult_rate ?? DEFAULT_RATES.adultRate),
    childRate: Number(event.tourist_tax_child_rate ?? DEFAULT_RATES.childRate),
    childMinAge: Number(event.tourist_tax_child_min_age ?? DEFAULT_RATES.childMinAge),
    adultMinAge: Number(event.tourist_tax_adult_min_age ?? DEFAULT_RATES.adultMinAge),
    extraBedPricePerDay: Number(event.extra_bed_price_per_day ?? DEFAULT_RATES.extraBedPricePerDay),
    maxExtraBeds: Number(event.max_extra_beds ?? DEFAULT_RATES.maxExtraBeds),
  };
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}/.test(value)) return null;
  const date = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Anzahl Nächte zwischen zwei Datumswerten, mindestens 1. */
export function getNights(startDate: string, endDate: string): number {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  if (!start || !end) return 1;
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000));
}

/** Alter in vollen Jahren am Stichtag. null bei fehlendem oder ungültigem Datum. */
export function getAgeAtDate(birthDate: string | null | undefined, targetDate: string): number | null {
  const birth = parseDate(birthDate);
  const target = parseDate(targetDate);
  if (!birth || !target || birth > target) return null;
  let age = target.getUTCFullYear() - birth.getUTCFullYear();
  const monthDiff = target.getUTCMonth() - birth.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && target.getUTCDate() < birth.getUTCDate())) {
    age--;
  }
  return age;
}

export type TaxCategory = "adult" | "child" | "exempt";

/** Kurtaxe-Kategorie eines Gastes. Ohne Geburtsdatum gilt der Erwachsenentarif. */
export function getTaxCategory(
  birthDate: string | null | undefined,
  startDate: string,
  rates: PricingRates
): TaxCategory {
  const age = getAgeAtDate(birthDate, startDate);
  if (age === null || age >= rates.adultMinAge) return "adult";
  if (age >= rates.childMinAge) return "child";
  return "exempt";
}

export interface BookingPrice {
  nights: number;
  adults: number;
  children: number;
  exempt: number;
  adultTax: number;
  childTax: number;
  touristTax: number;
  extraBeds: number;
  extraBedTotal: number;
  accommodationPrice: number;
  total: number;
}

/**
 * Gesamtpreis einer Buchung: Hauspreis + Zustellbetten + Kurtaxe.
 * Rechnet in Cent, damit keine Rundungsfehler entstehen. Die Datenbank
 * rechnet nach denselben Regeln (Migration 012).
 */
export function calculateBookingPrice({
  housePrice,
  startDate,
  endDate,
  guests,
  extraBeds = 0,
  rates,
}: {
  housePrice: number;
  startDate: string;
  endDate: string;
  guests: { birth_date?: string | null }[];
  extraBeds?: number;
  rates: PricingRates;
}): BookingPrice {
  const nights = getNights(startDate, endDate);
  let adults = 0;
  let children = 0;
  let exempt = 0;
  for (const guest of guests) {
    const category = getTaxCategory(guest.birth_date, startDate, rates);
    if (category === "adult") adults++;
    else if (category === "child") children++;
    else exempt++;
  }

  const toCents = (value: number) => Math.round(value * 100);
  const adultTaxCents = adults * toCents(rates.adultRate) * nights;
  const childTaxCents = children * toCents(rates.childRate) * nights;
  const extraBedCents = extraBeds * toCents(rates.extraBedPricePerDay) * nights;
  const houseCents = toCents(housePrice);

  return {
    nights,
    adults,
    children,
    exempt,
    adultTax: adultTaxCents / 100,
    childTax: childTaxCents / 100,
    touristTax: (adultTaxCents + childTaxCents) / 100,
    extraBeds,
    extraBedTotal: extraBedCents / 100,
    accommodationPrice: houseCents / 100,
    total: (houseCents + adultTaxCents + childTaxCents + extraBedCents) / 100,
  };
}
