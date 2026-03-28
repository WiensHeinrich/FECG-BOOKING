import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDateShort } from "@/lib/utils/format";

export const metadata: Metadata = {
  title: "Reservierung bestätigt",
};

interface Props {
  searchParams: Promise<{ id?: string; token?: string }>;
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
        total_price: number;
        expires_at: string;
        payment_reference: string;
        house_label: string;
        house_type_name: string;
        bank_account_holder: string;
        bank_iban: string;
        bank_bic: string | null;
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
            <h2 className="font-semibold">Reservierungsdetails</h2>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Unterkunft</span>
                <span>
                  {reservation.house_type_name} - {reservation.house_label}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kontaktperson</span>
                <span>
                  {reservation.contact_first_name} {reservation.contact_last_name}
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
              Bitte geben Sie unbedingt den Verwendungszweck an, damit wir Ihre
              Zahlung zuordnen können. Diese Seite enthält alle Angaben für
              die Überweisung.
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
