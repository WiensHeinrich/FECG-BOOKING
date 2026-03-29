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
                className="h-64 bg-cover bg-center transition-all duration-700 ease-out group-hover:scale-110 group-hover:brightness-50 group-hover:saturate-50"
                style={{ backgroundImage: "url('/Pictures/Anreise.png')" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent transition-all duration-500 group-hover:from-black/70 group-hover:via-black/50 group-hover:to-black/30" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-center transition-all duration-500 group-hover:bottom-auto group-hover:top-1/2 group-hover:-translate-y-1/2">
                <h3 className="text-xl font-bold text-white drop-shadow-lg transition-all duration-500 group-hover:text-3xl">Anreise</h3>
                <p className="mt-1 text-lg font-semibold text-white/80 drop-shadow transition-all duration-500 group-hover:text-xl group-hover:text-white">17:00 Uhr</p>
              </div>
            </div>
            {/* Abreise */}
            <div className="group relative overflow-hidden rounded-2xl shadow-md transition-all duration-500 hover:shadow-2xl hover:shadow-primary/15">
              <div
                className="h-64 bg-cover bg-center transition-all duration-700 ease-out group-hover:scale-110 group-hover:brightness-50 group-hover:saturate-50"
                style={{ backgroundImage: "url('/Pictures/Abreise.png')" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent transition-all duration-500 group-hover:from-black/70 group-hover:via-black/50 group-hover:to-black/30" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-center transition-all duration-500 group-hover:bottom-auto group-hover:top-1/2 group-hover:-translate-y-1/2">
                <h3 className="text-xl font-bold text-white drop-shadow-lg transition-all duration-500 group-hover:text-3xl">Abreise</h3>
                <p className="mt-1 text-lg font-semibold text-white/80 drop-shadow transition-all duration-500 group-hover:text-xl group-hover:text-white">Bis spätestens 12:00 Uhr</p>
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
              className="h-[28rem] bg-cover bg-center transition-all duration-700 ease-out group-hover:scale-110 group-hover:brightness-50 group-hover:saturate-50 md:h-[32rem]"
              style={{ backgroundImage: "url('/Pictures/K%C3%BCche%20blanko.png')" }}
            />
            <div className="absolute inset-0 bg-black/40 transition-all duration-500 group-hover:bg-black/65" />
            <div className="absolute inset-0 flex items-center justify-center px-6">
              <div className="grid w-full max-w-2xl gap-10 sm:grid-cols-2">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-white drop-shadow-lg transition-all duration-500 group-hover:text-3xl">Vorhanden</h3>
                  <ul className="mt-4 space-y-2 text-base text-white/90 drop-shadow transition-all duration-500 group-hover:text-lg">
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
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-white/70 drop-shadow-lg transition-all duration-500 group-hover:text-3xl">Nicht vorhanden</h3>
                  <ul className="mt-4 space-y-2 text-base text-white/60 drop-shadow transition-all duration-500 group-hover:text-lg">
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
          <div className="group relative mt-4 overflow-hidden rounded-2xl shadow-md transition-all duration-500 hover:shadow-2xl hover:shadow-primary/15">
            <div
              className="h-[28rem] bg-cover bg-center transition-all duration-700 ease-out group-hover:scale-110 group-hover:brightness-50 group-hover:saturate-50 md:h-[32rem]"
              style={{ backgroundImage: "url('/Pictures/Bitte%20mitbringen_blanko.png')" }}
            />
            <div className="absolute inset-0 bg-black/40 transition-all duration-500 group-hover:bg-black/65" />
            <div className="absolute inset-0 flex items-center justify-center px-6">
              <ul className="space-y-2.5 text-center text-base text-white/90 drop-shadow transition-all duration-500 group-hover:text-lg">
                <li>Spülmittel und Spültabs</li>
                <li>Spültücher und Putzlappen</li>
                <li>Müllbeutel</li>
                <li>Toilettenpapier</li>
                <li>Filtertüten für die Kaffeemaschine</li>
                <li>Handtücher</li>
                <li>Sandspielzeug (Sandkasten vorhanden)</li>
                <li>Eigenes Datenvolumen (WLAN evtl. begrenzt)</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Gemeinschaftseinrichtungen */}
        <section className="mt-10">
          <h2 className="flex items-center gap-2 text-2xl font-semibold">
            <TreePine className="h-6 w-6 text-primary" />
            Gemeinschaftseinrichtungen
          </h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            {[
              {
                title: "Großer Grillplatz",
                text: "Überdachter Gemeinschaftsgrill für alle Gäste",
                image: "/Pictures/Grill.png",
              },
              {
                title: "Waschraum",
                text: "Münzbetriebene Waschmaschine & Trockner (3,50 €/Ladung). Bügeleisen vorhanden.",
                image: "/Pictures/Waschraum.png",
              },
              {
                title: "Spielplatz & Spieleverleih",
                text: "Kinderspielplatz mit Sandkasten. Bälle, Badminton u.v.m. an der Rezeption ausleihbar.",
                image: "/Pictures/Spielplatz%20und%20Spieleverleih.png",
              },
              {
                title: "WLAN & TV-Raum",
                text: "WLAN im gesamten Dorf. TV-Raum im Hauptgebäude (Schlüssel an der Rezeption).",
                image: "/Pictures/WLAN%20und%20TV-Raum.png",
              },
            ].map(({ title, text, image }) => (
              <div key={title} className="group relative overflow-hidden rounded-2xl shadow-md transition-all duration-500 hover:shadow-2xl hover:shadow-primary/15">
                <div
                  className="h-64 bg-cover bg-center transition-all duration-700 ease-out group-hover:scale-110 group-hover:brightness-50 group-hover:saturate-50"
                  style={{ backgroundImage: `url('${image}')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent transition-all duration-500 group-hover:from-black/70 group-hover:via-black/50 group-hover:to-black/30" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-center transition-all duration-500 group-hover:bottom-auto group-hover:top-1/2 group-hover:-translate-y-1/2">
                  <h3 className="text-xl font-bold text-white drop-shadow-lg transition-all duration-500 group-hover:text-2xl">{title}</h3>
                  <p className="mt-1 text-sm text-white/70 drop-shadow transition-all duration-500 group-hover:text-base group-hover:text-white">{text}</p>
                </div>
              </div>
            ))}
          </div>
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
