import {
  getDashboardStats,
  getActiveEventAdmin,
  getReservations,
} from "@/lib/queries/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CalendarCheck,
  Clock,
  Euro,
  ListOrdered,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import Link from "next/link";

export default async function AdminDashboard() {
  const event = await getActiveEventAdmin();

  if (!event) {
    return (
      <div className="py-12 text-center">
        <h1 className="text-2xl font-bold">Kein aktives Event</h1>
        <p className="mt-2 text-muted-foreground">
          Erstellen Sie ein Event in den Einstellungen.
        </p>
      </div>
    );
  }

  const [stats, reservations] = await Promise.all([
    getDashboardStats(event.id),
    getReservations(event.id),
  ]);

  const recentReservations = reservations.slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          {event.title} &middot; {formatDate(event.start_date)} &ndash;{" "}
          {formatDate(event.end_date)}
        </p>
      </div>

      {/* Statistik-Karten */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Reservierungen
            </CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReservations}</div>
            <p className="text-xs text-muted-foreground">
              {stats.confirmed} bestaetigt, {stats.pending} offen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Offene Zahlungen
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.pendingPayments)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.pending} Reservierungen warten auf Zahlung
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Einnahmen</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.confirmed} bestaetigte Buchungen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Warteliste</CardTitle>
            <ListOrdered className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.waitlistCount}</div>
            <p className="text-xs text-muted-foreground">
              Personen warten auf einen Platz
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Letzte Reservierungen */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Letzte Reservierungen</CardTitle>
          <Link
            href="/admin/reservierungen"
            className="text-sm text-primary hover:underline"
          >
            Alle anzeigen
          </Link>
        </CardHeader>
        <CardContent>
          {recentReservations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Noch keine Reservierungen vorhanden.
            </p>
          ) : (
            <div className="space-y-3">
              {recentReservations.map((r) => (
                <Link
                  key={r.id}
                  href={`/admin/reservierungen/${r.id}`}
                  className="flex items-center justify-between rounded-md border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    {r.status === "bestaetigt" ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : r.status === "reserviert" ? (
                      <Clock className="h-4 w-4 text-amber-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        {r.contact_first_name} {r.contact_last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {r.house.house_type.name} &middot; Haus{" "}
                        {r.house.house_number} &middot;{" "}
                        {r.guests.length} Gaeste
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {formatCurrency(r.total_price)}
                    </p>
                    <StatusBadge status={r.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    reserviert: { label: "Reserviert", variant: "outline" },
    bestaetigt: { label: "Bestaetigt", variant: "default" },
    storniert: { label: "Storniert", variant: "destructive" },
    abgelaufen: { label: "Abgelaufen", variant: "secondary" },
  };
  const v = variants[status] || { label: status, variant: "secondary" as const };
  return <Badge variant={v.variant} className="text-xs">{v.label}</Badge>;
}
