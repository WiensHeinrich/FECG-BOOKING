import type { Metadata } from "next";
import { FileDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getActiveEvent } from "@/lib/queries/events";
import { getPublishedDocuments } from "@/lib/queries/documents";
import { formatFileSize } from "@/lib/utils/format";

export const metadata: Metadata = {
  title: "Informationen",
  description: "Downloads und wichtige Informationen zur Gemeindefreizeit.",
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
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold">Informationen</h1>
        <p className="mt-2 text-muted-foreground">
          Hier finden Sie alle wichtigen Dokumente und Informationen zur{" "}
          {event.title}.
        </p>

        {documents.length === 0 ? (
          <Card className="mt-8">
            <CardContent className="py-12 text-center text-muted-foreground">
              Aktuell sind noch keine Dokumente verfuegbar.
            </CardContent>
          </Card>
        ) : (
          <div className="mt-8 grid gap-4">
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
                    <Button asChild variant="outline" size="sm" className="gap-2">
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
        )}
      </div>
    </div>
  );
}
