import Link from "next/link";
import { getReservations, getActiveEventAdmin } from "@/lib/queries/admin";
import { HELP_AREAS } from "@/lib/config/help-areas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Helper {
  key: string;
  name: string;
  house: string;
  contact: string;
  phone: string | null;
  reservationId: string;
}

export default async function MithilfePage() {
  const event = await getActiveEventAdmin();
  if (!event) return <p>Kein aktives Event.</p>;

  const all = await getReservations(event.id);
  // nur laufende Buchungen, stornierte und abgelaufene zählen nicht
  const reservations = all.filter((r) => r.status === "reserviert" || r.status === "bestaetigt");

  const byArea = new Map<string, Helper[]>(HELP_AREAS.map((a) => [a.key, []]));
  const withoutHelp: typeof reservations = [];

  for (const r of reservations) {
    const house = `${r.house.house_type.name} · ${r.house.label || `Haus ${r.house.house_number}`}`;
    let any = false;
    for (const g of [...r.guests].sort((a, b) => a.sort_order - b.sort_order)) {
      for (const key of g.help_areas ?? []) {
        const list = byArea.get(key);
        if (!list) continue;
        any = true;
        list.push({
          key: `${g.id}-${key}`,
          name: `${g.first_name} ${g.last_name}`,
          house,
          contact: `${r.contact_first_name} ${r.contact_last_name}`,
          phone: r.contact_phone,
          reservationId: r.id,
        });
      }
    }
    if (!any) withoutHelp.push(r);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mithilfe</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Wer hat sich für welchen Bereich gemeldet? Gezählt werden reservierte und bestätigte
          Buchungen. Die Telefonnummer gehört zur Kontaktperson des Hauses.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {HELP_AREAS.map((area) => (
          <a
            key={area.key}
            href={`#${area.key}`}
            className="rounded-full border bg-card px-3 py-1 text-sm hover:bg-accent"
          >
            {area.label}: <strong>{byArea.get(area.key)?.length ?? 0}</strong>
          </a>
        ))}
      </div>

      {HELP_AREAS.map((area) => {
        const helpers = byArea.get(area.key) ?? [];
        return (
          <Card key={area.key} id={area.key} className="scroll-mt-6">
            <CardHeader>
              <CardTitle className="text-base">
                {area.label} ({helpers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {helpers.length === 0 ? (
                <p className="text-sm text-muted-foreground">Noch niemand.</p>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Unterkunft</TableHead>
                        <TableHead>Kontaktperson</TableHead>
                        <TableHead>Telefon</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {helpers.map((h) => (
                        <TableRow key={h.key}>
                          <TableCell>
                            <Link
                              href={`/admin/reservierungen/${h.reservationId}`}
                              className="font-medium text-primary hover:underline"
                            >
                              {h.name}
                            </Link>
                          </TableCell>
                          <TableCell className="text-sm">{h.house}</TableCell>
                          <TableCell className="text-sm">{h.contact}</TableCell>
                          <TableCell className="text-sm">
                            {h.phone ? (
                              <a href={`tel:${h.phone.replace(/[^\d+]/g, "")}`} className="hover:underline">
                                {h.phone}
                              </a>
                            ) : (
                              "–"
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {withoutHelp.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Buchungen ohne Angabe ({withoutHelp.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {withoutHelp.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/admin/reservierungen/${r.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {r.contact_first_name} {r.contact_last_name}
                  </Link>{" "}
                  <span className="text-muted-foreground">
                    · {r.house.house_type.name} · {r.house.label || `Haus ${r.house.house_number}`}
                    {r.contact_phone ? ` · ${r.contact_phone}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
