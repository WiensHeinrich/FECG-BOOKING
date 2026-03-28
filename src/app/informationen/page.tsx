import type { Metadata } from "next";
import {
  FileDown,
  Car,
  Train,
  Wifi,
  UtensilsCrossed,
  ShowerHead,
  TreePine,
  Clock,
  Info,
  MapPin,
  Backpack,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getActiveEvent } from "@/lib/queries/events";
import { getPublishedDocuments } from "@/lib/queries/documents";
import { formatFileSize } from "@/lib/utils/format";

export const metadata: Metadata = {
  title: "Informationen",
  description:
    "Downloads und wichtige Informationen zur Gemeindefreizeit im Feriendorf Eckenhof Schramberg.",
};

export default async function InformationenPage() {
  const event = await getActiveEvent();

  if (!event) {
    return (
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4">
        <p className="text-muted-foreground">Keine aktive Freizeit gefunden.</p>
      </div>
    );
  }

  const documents = await getPublishedDocuments(event.id);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold">Informationen</h1>
        <p className="mt-2 text-muted-foreground">
          Alles Wichtige rund um die {event.title} im Feriendorf Eckenhof
          Schramberg.
        </p>

        {/* Anreise */}
        <section className="mt-10">
          <h2 className="flex items-center gap-2 text-2xl font-semibold">
            <MapPin className="h-6 w-6 text-primary" />
            Anreise
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Car className="h-4 w-4" />
                  Mit dem Auto
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground">
                  Dr. Helmut-Junghans-Strasse 50, 78713 Schramberg-Sulgen
                </p>
                <p className="mt-2">
                  Das Feriendorf ist gut ausgeschildert. Bitte beachten: Das Dorf
                  ist <strong>autofrei</strong> — Fahrzeuge sind im Dorf nicht
                  erlaubt. Parkplaetze befinden sich in der Naehe. Fuer den
                  Gepaecktransport stehen Bollerwagen zur Verfuegung.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Train className="h-4 w-4" />
                  Mit der Bahn
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>
                  <strong>Empfohlen:</strong> Bahnhof Rottweil (gute
                  Busverbindungen)
                </p>
                <p className="mt-1">
                  Buslinie 7475 oder Haltestelle &quot;Schramberger Strasse
                  Sulgen&quot; — ca. 10 Min. Fussweg (Wegweiser
                  &quot;Eckenhof&quot;).
                </p>
                <p className="mt-1">
                  Anrufsammelbus: 07721 9132020
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* An-/Abreise Zeiten */}
        <section className="mt-10">
          <h2 className="flex items-center gap-2 text-2xl font-semibold">
            <Clock className="h-6 w-6 text-primary" />
            An- und Abreise
          </h2>
          <Card className="mt-4">
            <CardContent className="pt-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="font-medium">Anreise</p>
                  <p className="text-sm text-muted-foreground">
                    15:00 – 18:00 Uhr
                  </p>
                </div>
                <div>
                  <p className="font-medium">Abreise</p>
                  <p className="text-sm text-muted-foreground">
                    Bis 12:00 Uhr (nach Absprache)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Ausstattung */}
        <section className="mt-10">
          <h2 className="flex items-center gap-2 text-2xl font-semibold">
            <Info className="h-6 w-6 text-primary" />
            Ausstattung der Unterkuenfte
          </h2>
          <Card className="mt-4">
            <CardContent className="pt-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="font-medium text-green-700">Vorhanden</p>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <li>Kaffeemaschine (Filtertüten mitbringen)</li>
                    <li>Wasserkocher</li>
                    <li>Kuehlschrank (kein Gefrierfach)</li>
                    <li>Grundgeschirr und Besteck</li>
                    <li>Bettwaesche inklusive</li>
                    <li>Kinderbett und Hochstuhl (auf Anfrage)</li>
                    <li>WLAN (Passwort: &quot;eckenhof&quot;)</li>
                    <li>Heizung</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-amber-700">Nicht vorhanden</p>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <li>Backofen (nur Typ C Haeuser)</li>
                    <li>Spuelmaschine (nur Typ C Haeuser)</li>
                    <li>Gefrierfach</li>
                    <li>Elektrogrill (Gemeinschaftsgrill vorhanden)</li>
                    <li>TV im Haus (TV-Raum im Hauptgebaeude)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Mitbringen */}
        <section className="mt-10">
          <h2 className="flex items-center gap-2 text-2xl font-semibold">
            <Backpack className="h-6 w-6 text-primary" />
            Bitte mitbringen
          </h2>
          <Card className="mt-4">
            <CardContent className="pt-6">
              <ul className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
                <li>Spuelmittel und Spueltabs</li>
                <li>Spueltuether und Putzlappen</li>
                <li>Muellbeutel</li>
                <li>Toilettenpapier</li>
                <li>Filtertueten fuer die Kaffeemaschine</li>
                <li>Handtuecher</li>
                <li>Sandspielzeug (Sandkasten vorhanden)</li>
                <li>Eigenes Datenvolumen (WLAN evtl. begrenzt)</li>
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* Gemeinschaftseinrichtungen */}
        <section className="mt-10">
          <h2 className="flex items-center gap-2 text-2xl font-semibold">
            <TreePine className="h-6 w-6 text-primary" />
            Gemeinschaftseinrichtungen
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Card>
              <CardContent className="flex items-start gap-3 pt-6">
                <UtensilsCrossed className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="font-medium">Grosser Grillplatz</p>
                  <p className="text-sm text-muted-foreground">
                    Ueberdachter Gemeinschaftsgrill fuer alle Gaeste
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-start gap-3 pt-6">
                <ShowerHead className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="font-medium">Waschraum</p>
                  <p className="text-sm text-muted-foreground">
                    Muenzbetriebene Waschmaschine & Trockner (3,50 €/Ladung).
                    Buegeleisen vorhanden.
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-start gap-3 pt-6">
                <TreePine className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="font-medium">Spielplatz & Spieleverleih</p>
                  <p className="text-sm text-muted-foreground">
                    Kinderspielplatz mit Sandkasten. Baelle, Badminton u.v.m. an
                    der Rezeption ausleihbar.
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-start gap-3 pt-6">
                <Wifi className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="font-medium">WLAN & TV-Raum</p>
                  <p className="text-sm text-muted-foreground">
                    WLAN im gesamten Dorf. TV-Raum im Hauptgebaeude (Schluessel
                    an der Rezeption).
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Kurtaxe */}
        <section className="mt-10">
          <h2 className="flex items-center gap-2 text-2xl font-semibold">
            <Info className="h-6 w-6 text-primary" />
            Kurtaxe
          </h2>
          <Card className="mt-4">
            <CardContent className="pt-6 text-sm text-muted-foreground">
              <p>
                Die Kurtaxe wird vor Ort erhoben und ist nicht im Hauspreis
                enthalten:
              </p>
              <ul className="mt-2 space-y-1">
                <li>
                  <strong>Erwachsene:</strong> 1,80 €/Tag
                </li>
                <li>
                  <strong>Kinder (10–17 Jahre):</strong> 0,90 €/Tag
                </li>
                <li>
                  <strong>Kinder unter 10:</strong> frei
                </li>
              </ul>
              <p className="mt-2">
                Bei Schwerbehinderung ab 80% entfaellt die Kurtaxe (Nachweis
                erforderlich).
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Grundrisse & Dokumente */}
        <section className="mt-10">
          <h2 className="flex items-center gap-2 text-2xl font-semibold">
            <FileDown className="h-6 w-6 text-primary" />
            Grundrisse & Dokumente
          </h2>

          <div className="mt-4 grid gap-4">
            {[
              {
                title: "Uebersichtsplan Feriendorf Eckenhof",
                href: "/docs/uebersichtsplan-eckenhof.jpg",
                description: "Lageplan des gesamten Feriendorfs",
              },
              {
                title: "Grundriss Ferienhaus Typ A",
                href: "/docs/grundriss-typ-a.pdf",
                description: "Raumaufteilung Ferienhaus Typ A (6 Personen)",
              },
              {
                title: "Grundriss Ferienhaus Typ B",
                href: "/docs/grundriss-typ-b.pdf",
                description: "Raumaufteilung Ferienhaus Typ B (6 Personen)",
              },
              {
                title: "Grundriss Ferienhaus Typ C",
                href: "/docs/grundriss-typ-c.pdf",
                description:
                  "Raumaufteilung Ferienhaus Typ C (8–10 Personen)",
              },
              {
                title: "Grundriss Gaestehaus",
                href: "/docs/grundriss-gaestehaus.pdf",
                description: "Raumaufteilung Gaestehaus G1-10",
              },
            ].map((doc) => (
              <Card key={doc.href}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{doc.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {doc.description}
                    </p>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <a href={doc.href} download>
                        <FileDown className="h-4 w-4" />
                        Herunterladen
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Dynamische Dokumente aus der Datenbank */}
        {documents.length > 0 && (
          <section className="mt-10">
            <h2 className="text-2xl font-semibold">Weitere Dokumente</h2>
            <div className="mt-4 grid gap-4">
              {documents.map((doc) => (
                <Card key={doc.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{doc.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        {doc.description && (
                          <p className="text-sm text-muted-foreground">
                            {doc.description}
                          </p>
                        )}
                        {doc.file_size_bytes && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatFileSize(doc.file_size_bytes)}
                          </p>
                        )}
                      </div>
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        <a href={doc.file_url} download>
                          <FileDown className="h-4 w-4" />
                          Herunterladen
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
