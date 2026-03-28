import { getReservations, getActiveEventAdmin } from "@/lib/queries/admin";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import Link from "next/link";

export default async function ReservierungenPage() {
  const event = await getActiveEventAdmin();
  if (!event) return <p>Kein aktives Event.</p>;

  const reservations = await getReservations(event.id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reservierungen</h1>

      {reservations.length === 0 ? (
        <p className="text-muted-foreground">Noch keine Reservierungen.</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Unterkunft</TableHead>
                <TableHead>Gaeste</TableHead>
                <TableHead>Betrag</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Zahlung</TableHead>
                <TableHead>Ablauf</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reservations.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Link
                      href={`/admin/reservierungen/${r.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {r.contact_first_name} {r.contact_last_name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {r.contact_email}
                    </p>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {r.house.house_type.name}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      Haus {r.house.house_number}
                    </p>
                  </TableCell>
                  <TableCell>{r.guests.length}</TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(r.total_price)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={r.status} />
                  </TableCell>
                  <TableCell>
                    <PaymentBadge status={r.payment_status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.status === "reserviert"
                      ? formatDate(r.expires_at)
                      : "–"}
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

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    reserviert: { label: "Reserviert", variant: "outline" },
    bestaetigt: { label: "Bestaetigt", variant: "default" },
    storniert: { label: "Storniert", variant: "destructive" },
    abgelaufen: { label: "Abgelaufen", variant: "secondary" },
  };
  const v = map[status] || { label: status, variant: "secondary" as const };
  return <Badge variant={v.variant}>{v.label}</Badge>;
}

function PaymentBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    ausstehend: { label: "Ausstehend", variant: "outline" },
    eingegangen: { label: "Bezahlt", variant: "default" },
    erstattet: { label: "Erstattet", variant: "secondary" },
  };
  const v = map[status] || { label: status, variant: "secondary" as const };
  return <Badge variant={v.variant}>{v.label}</Badge>;
}
