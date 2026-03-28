import type { Metadata } from "next";
import Link from "next/link";
import { Clock, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Warteliste",
};

export default async function WaitelistePage({
  searchParams,
}: {
  searchParams: Promise<{ position?: string }>;
}) {
  const { position } = await searchParams;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <Clock className="mx-auto h-16 w-16 text-amber-500" />
          <h1 className="mt-4 text-3xl font-bold">Auf der Warteliste</h1>
          <p className="mt-2 text-muted-foreground">
            Sie wurden erfolgreich auf die Warteliste gesetzt.
          </p>
        </div>

        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Ihr Eintrag wurde gespeichert
              {position ? ` und auf Position ${position} einsortiert` : ""}.
              Sobald eine passende Unterkunft frei wird, kann sich das
              Freizeitteam bei Ihnen melden.
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
