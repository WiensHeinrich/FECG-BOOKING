import { getWaitlist, getActiveEventAdmin, getAvailableHouseCountByType } from "@/lib/queries/admin";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils/format";
import { WaitlistRemoveButton } from "@/components/admin/waitlist-remove-button";
import { ConvertWaitlistButton } from "@/components/admin/convert-waitlist-button";

export default async function WaitlistPage() {
  const event = await getActiveEventAdmin();
  if (!event) return <p>Kein aktives Event.</p>;

  const [waitlist, availableByType] = await Promise.all([
    getWaitlist(event.id),
    getAvailableHouseCountByType(event.id),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Warteliste</h1>

      {waitlist.length === 0 ? (
        <p className="text-muted-foreground">Die Warteliste ist leer.</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pos.</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Haustyp</TableHead>
                <TableHead>Gäste</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Angemeldet</TableHead>
                <TableHead>Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {waitlist.map((w) => (
                <TableRow key={w.id}>
                  <TableCell className="font-medium">{w.position}</TableCell>
                  <TableCell>
                    <p className="font-medium">
                      {w.contact_first_name} {w.contact_last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {w.contact_email}
                    </p>
                  </TableCell>
                  <TableCell>{w.house_type.name}</TableCell>
                  <TableCell>{w.guest_count}</TableCell>
                  <TableCell>
                    <WaitlistStatusBadge status={w.status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTime(w.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {w.status === "wartend" && (
                        <ConvertWaitlistButton
                          entryId={w.id}
                          name={`${w.contact_first_name} ${w.contact_last_name}`}
                          hasAvailableHouse={(availableByType[w.house_type_id] || 0) > 0}
                        />
                      )}
                      <WaitlistRemoveButton entryId={w.id} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function WaitlistStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    wartend: { label: "Wartend", variant: "outline" },
    benachrichtigt: { label: "Benachrichtigt", variant: "default" },
    abgelaufen: { label: "Abgelaufen", variant: "secondary" },
    umgewandelt: { label: "Umgewandelt", variant: "default" },
  };
  const v = map[status] || { label: status, variant: "secondary" as const };
  return <Badge variant={v.variant}>{v.label}</Badge>;
}
