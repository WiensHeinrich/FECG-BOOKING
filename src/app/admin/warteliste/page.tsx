import { getWaitlist, getActiveEventAdmin } from "@/lib/queries/admin";
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

export default async function WaitlistPage() {
  const event = await getActiveEventAdmin();
  if (!event) return <p>Kein aktives Event.</p>;

  const waitlist = await getWaitlist(event.id);

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
                <TableHead>Gaeste</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Angemeldet</TableHead>
                <TableHead></TableHead>
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
                    {w.status === "wartend" && (
                      <WaitlistRemoveButton entryId={w.id} />
                    )}
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
