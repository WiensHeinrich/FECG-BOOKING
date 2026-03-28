import { getActiveEventAdmin } from "@/lib/queries/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import type { Document } from "@/lib/types/database";

export default async function DokumentePage() {
  const event = await getActiveEventAdmin();
  if (!event) return <p>Kein aktives Event.</p>;

  const supabase = createAdminClient();
  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .eq("event_id", event.id)
    .order("sort_order");

  const docs = (documents || []) as Document[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dokumente</h1>
        <p className="text-sm text-muted-foreground">
          Dokumente können aktuell über die Supabase-Konsole verwaltet werden.
        </p>
      </div>

      {docs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-muted-foreground">
              Noch keine Dokumente hochgeladen.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {docs.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{doc.title}</p>
                    {doc.description && (
                      <p className="text-sm text-muted-foreground">
                        {doc.description}
                      </p>
                    )}
                  </div>
                </div>
                <Badge variant={doc.is_published ? "default" : "secondary"}>
                  {doc.is_published ? "Veröffentlicht" : "Entwurf"}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
