import type { Metadata } from "next";
import {
  FileDown,
  Wifi,
  UtensilsCrossed,
  ShowerHead,
  TreePine,
  Clock,
  Info,
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

        {/* An-/Abreise Zeiten */}
        <section className="mt-10">
          <h2 className="flex items-center gap-2 text-2xl font-semibold">
            <Clock className="h-6 w-6 text-primary" />
            An- und Abreise
          </h2>
          <div className="mt-4 grid gap-6 md:grid-cols-2">
            {/* Anreise */}
            <div className="group relative overflow-hidden rounded-2xl shadow-md transition-all duration-500 hover:shadow-2xl hover:shadow-primary/15">
              <div
                className="h-64 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-110"
                style={{ backgroundImage: "url('/Pictures/Anreise.png')" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/5 transition-all duration-500 group-hover:from-black/80 group-hover:via-black/40" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-center">
                <h3 className="text-xl font-bold text-white drop-shadow-lg">Anreise</h3>
                <p className="mt-1 text-lg font-semibold text-white/90 drop-shadow">17:00 Uhr</p>
              </div>
            </div>
            {/* Abreise */}
            <div className="group relative overflow-hidden rounded-2xl shadow-md transition-all duration-500 hover:shadow-2xl hover:shadow-primary/15">
              <div
                className="h-64 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-110"
                style={{ backgroundImage: "url('/Pictures/Abreise.png')" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/5 transition-all duration-500 group-hover:from-black/80 group-hover:via-black/40" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-center">
                <h3 className="text-xl font-bold text-white drop-shadow-lg">Abreise</h3>
                <p className="mt-1 text-lg font-semibold text-white/90 drop-shadow">Bis spätestens 12:00 Uhr</p>
              </div>
            </div>
          </div>
        </section>

        {/* Ausstattung */}
        <section className="mt-10">
          <h2 className="flex items-center gap-2 text-2xl font-semibold">
            <Info className="h-6 w-6 text-primary" />
            Ausstattung der Unterkünfte
          </h2>
          <div className="group relative mt-4 overflow-hidden rounded-2xl shadow-md transition-all duration-500 hover:shadow-2xl hover:shadow-primary/15">
            <div
              className="h-[28rem] bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-110 md:h-[32rem]"
              style={{ backgroundImage: "url('/Pictures/K%C3%BCche%20blanko.png')" }}
            />
            <div className="absolute inset-0 bg-black/50 transition-all duration-500 group-hover:bg-black/60" />
            <div className="absolute inset-0 flex items-center justify-center px-6">
              <div className="grid w-full max-w-3xl gap-8 sm:grid-cols-2">
                <div className="text-center sm:text-left">
                  <h3 className="text-xl font-bold text-white drop-shadow-lg">Vorhanden</h3>
                  <ul className="mt-3 space-y-1.5 text-sm text-white/90 drop-shadow">
                    <li>Kaffeemaschine (Filtertüten mitbringen)</li>
                    <li>Wasserkocher</li>
                    <li>Kühlschrank (kein Gefrierfach)</li>
                    <li>Grundgeschirr und Besteck</li>
                    <li>Bettwäsche inklusive</li>
                    <li>Kinderbett und Hochstuhl (auf Anfrage)</li>
                    <li>WLAN (Passwort: &quot;eckenhof&quot;)</li>
                    <li>Heizung</li>
                  </ul>
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="text-xl font-bold text-white/70 drop-shadow-lg">Nicht vorhanden</h3>
                  <ul className="mt-3 space-y-1.5 text-sm text-white/60 drop-shadow">
                    <li>Backofen (nur Typ C Häuser)</li>
                    <li>Spülmaschine (nur Typ C Häuser)</li>
                    <li>Gefrierfach</li>
                    <li>Elektrogrill (Gemeinschaftsgrill vorhanden)</li>
                    <li>TV im Haus (TV-Raum im Hauptgebäude)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
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
                <li>Spülmittel und Spültabs</li>
                <li>Spültücher und Putzlappen</li>
                <li>Müllbeutel</li>
                <li>Toilettenpapier</li>
                <li>Filtertüten für die Kaffeemaschine</li>
                <li>Handtücher</li>
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
                  <p className="font-medium">Großer Grillplatz</p>
                  <p className="text-sm text-muted-foreground">
                    Überdachter Gemeinschaftsgrill für alle Gäste
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
                    Münzbetriebene Waschmaschine & Trockner (3,50 €/Ladung).
                    Bügeleisen vorhanden.
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
                    Kinderspielplatz mit Sandkasten. Bälle, Badminton u.v.m. an
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
                    WLAN im gesamten Dorf. TV-Raum im Hauptgebäude (Schlüssel
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
                Bei Schwerbehinderung ab 80% entfällt die Kurtaxe (Nachweis
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
                title: "Übersichtsplan Feriendorf Eckenhof",
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
                title: "Grundriss Gästehaus",
                href: "/docs/grundriss-gaestehaus.pdf",
                description: "Raumaufteilung Gästehaus G1-10",
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
