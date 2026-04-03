import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, ArrowLeft, User, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDateShort } from "@/lib/utils/format";

export const metadata: Metadata = {
  title: "Reservierung bestätigt",
};

interface GuestInfo {
  first_name: string;
  last_name: string;
  birth_date: string | null;
  is_child: boolean;
  gender: string | null;
  dietary_notes: string | null;
}

interface Props {
  searchParams: Promise<{ id?: string; token?: string }>;
}

function formatGender(gender: string | null) {
  if (gender === "maennlich") return "Männlich";
  if (gender === "weiblich") return "Weiblich";
  return "–";
}

function formatBirthDate(date: string | null) {
  if (!date) return "–";
  return new Date(date).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default async function BestaetigungPage({ searchParams }: Props) {
  const { id, token } = await searchParams;

  if (!id || !token) {
    return (
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4">
        <p className="text-muted-foreground">Ungültiger Bestätigungslink.</p>
      </div>
    );
  }

  const supabase = await createClient();

  const { data: rows } = await supabase.rpc(
    "get_public_reservation_confirmation",
    {
      p_reservation_id: id,
      p_access_token: token,
    }
  );

  const reservation = rows?.[0] as
    | {
        reservation_id: string;
        contact_first_name: string;
        contact_last_name: string;
        contact_email: string;
        contact_phone: string | null;
        contact_gender: string | null;
        total_price: number;
        expires_at: string;
        payment_reference: string;
        house_label: string;
        house_type_name: string;
        bank_account_holder: string;
        bank_iban: string;
        bank_bic: string | null;
        guests_json: GuestInfo[];
      }
    | undefined;

  if (!reservation) {
    return (
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4">
        <p className="text-muted-foreground">
          Reservierung nicht gefunden oder Link nicht mehr gültig.
        </p>
      </div>
    );
  }

  const guests: GuestInfo[] = reservation.guests_json || [];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <CheckCircle2 className="mx-auto h-16 w-16 text-green-600" />
          <h1 className="mt-4 text-3xl font-bold">Reservierung erfolgreich!</h1>
          <p className="mt-2 text-muted-foreground">
            Ihre Reservierung wurde erstellt. Bitte überweisen Sie den Betrag
            bis spätestens zum angegebenen Datum.
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            {/* Reservierungsdetails */}
            <h2 className="font-semibold">Reservierungsdetails</h2>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Unterkunft</span>
                <span className="font-medium">
                  {reservation.house_type_name} – {reservation.house_label}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Betrag</span>
                <span className="font-semibold">
                  {formatCurrency(reservation.total_price)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gültig bis</span>
                <span>{formatDateShort(reservation.expires_at)}</span>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Kontaktperson */}
            <h2 className="flex items-center gap-2 font-semibold">
              <User className="h-4 w-4 text-primary" />
              Kontaktperson
            </h2>
            <div className="mt-3 space-y-1.5 rounded-md bg-primary/5 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">
                  {reservation.contact_first_name} {reservation.contact_last_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">E-Mail</span>
                <span>{reservation.contact_email}</span>
              </div>
              {reservation.contact_phone && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Telefon</span>
                  <span>{reservation.contact_phone}</span>
                </div>
              )}
              {reservation.contact_gender && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Geschlecht</span>
                  <span>{formatGender(reservation.contact_gender)}</span>
                </div>
              )}
            </div>

            {/* Gästeliste */}
            {guests.length > 0 && (
              <>
                <Separator className="my-4" />
                <h2 className="flex items-center gap-2 font-semibold">
                  <Users className="h-4 w-4 text-primary" />
                  Angemeldete Gäste ({guests.length})
                </h2>
                <div className="mt-3 space-y-3">
                  {guests.map((guest, index) => (
                    <div
                      key={index}
                      className="rounded-md border bg-card p-3 text-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {index + 1}. {guest.first_name} {guest.last_name}
                        </span>
                        {guest.is_child && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                            Kind
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>Geburtsdatum: {formatBirthDate(guest.birth_date)}</span>
                        <span>Geschlecht: {formatGender(guest.gender)}</span>
                        {guest.dietary_notes && (
                          <span className="col-span-2">
                            Hinweise: {guest.dietary_notes}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <Separator className="my-4" />

            {/* Überweisungsdaten */}
            <h2 className="font-semibold">Überweisungsdaten</h2>
            <div className="mt-4 space-y-2 rounded-md bg-muted p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Empfänger</span>
                <span>{reservation.bank_account_holder}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">IBAN</span>
                <span className="font-mono">{reservation.bank_iban}</span>
              </div>
              {reservation.bank_bic && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">BIC</span>
                  <span className="font-mono">{reservation.bank_bic}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Verwendungszweck</span>
                <span className="font-mono font-semibold">
                  {reservation.payment_reference}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Betrag</span>
                <span className="font-semibold">
                  {formatCurrency(reservation.total_price)}
                </span>
              </div>
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              Bitte geben Sie unbedingt den <strong>Verwendungszweck</strong> an, damit wir Ihre
              Zahlung zuordnen können.
            </p>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Button asChild variant="outline" className="gap-2">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Zurück zur Startseite
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
