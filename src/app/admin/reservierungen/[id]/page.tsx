import { getReservation } from "@/lib/queries/admin";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils/format";
import { ReservationActions } from "@/components/admin/reservation-actions";

export default async function ReservationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const reservation = await getReservation(id);

  if (!reservation) {
    notFound();
  }

  const r = reservation;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {r.contact_first_name} {r.contact_last_name}
          </h1>
          <p className="text-muted-foreground">
            Reservierung vom {formatDate(r.created_at)}
          </p>
        </div>
        <div className="flex gap-2">
          <StatusBadge status={r.status} />
          <PaymentBadge status={r.payment_status} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Kontaktdaten */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kontaktdaten</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Name" value={`${r.contact_first_name} ${r.contact_last_name}`} />
            <Row label="E-Mail" value={r.contact_email} />
            <Row label="Telefon" value={r.contact_phone || "–"} />
          </CardContent>
        </Card>

        {/* Unterkunft */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Unterkunft</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Typ" value={r.house.house_type.name} />
            <Row label="Haus" value={`Nr. ${r.house.house_number}`} />
            <Row label="Max. Gaeste" value={String(r.house.house_type.max_guests)} />
          </CardContent>
        </Card>

        {/* Zahlung */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Zahlung</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Betrag" value={formatCurrency(r.total_price)} />
            <Row label="Referenz" value={r.payment_reference} />
            <Row label="Status" value={r.payment_status === "eingegangen" ? "Bezahlt" : "Ausstehend"} />
            {r.payment_confirmed_at && (
              <Row label="Bestaetigt am" value={formatDateTime(r.payment_confirmed_at)} />
            )}
            {r.status === "reserviert" && (
              <Row label="Ablauf" value={formatDateTime(r.expires_at)} />
            )}
          </CardContent>
        </Card>

        {/* Gaeste */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Gaeste ({r.guests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {r.guests
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((g) => (
                  <div
                    key={g.id}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                  >
                    <div>
                      <span className="font-medium">
                        {g.first_name} {g.last_name}
                      </span>
                      {g.birth_date && (
                        <span className="ml-2 text-muted-foreground">
                          {formatDate(g.birth_date)}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {g.is_child && (
                        <Badge variant="secondary" className="text-xs">
                          Kind
                        </Badge>
                      )}
                      {g.dietary_notes && (
                        <Badge variant="outline" className="text-xs">
                          {g.dietary_notes}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Admin-Notizen und Aktionen */}
      <ReservationActions
        reservationId={r.id}
        status={r.status}
        paymentStatus={r.payment_status}
        adminNotes={r.admin_notes}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
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
