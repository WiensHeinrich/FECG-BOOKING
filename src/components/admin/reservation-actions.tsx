"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  confirmPayment,
  cancelReservation,
  extendReservation,
  updateAdminNotes,
} from "@/lib/actions/admin";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Clock, Save } from "lucide-react";

export function ReservationActions({
  reservationId,
  status,
  paymentStatus,
  adminNotes,
}: {
  reservationId: string;
  status: string;
  paymentStatus: string;
  adminNotes: string | null;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState(adminNotes || "");
  const [loading, setLoading] = useState<string | null>(null);

  async function handleAction(
    action: () => Promise<{ error?: string; success?: boolean }>,
    key: string,
    successMsg: string
  ) {
    setLoading(key);
    const result = await action();
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(successMsg);
      router.refresh();
    }
    setLoading(null);
  }

  return (
    <div className="space-y-4">
      {/* Aktions-Buttons */}
      {status === "reserviert" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aktionen</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {paymentStatus === "ausstehend" && (
              <Button
                onClick={() =>
                  handleAction(
                    () => confirmPayment(reservationId),
                    "confirm",
                    "Zahlung bestaetigt!"
                  )
                }
                disabled={loading !== null}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                {loading === "confirm"
                  ? "Wird bestaetigt..."
                  : "Zahlung bestaetigen"}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() =>
                handleAction(
                  () => extendReservation(reservationId, 7),
                  "extend",
                  "Reservierung um 7 Tage verlaengert!"
                )
              }
              disabled={loading !== null}
            >
              <Clock className="mr-2 h-4 w-4" />
              {loading === "extend" ? "Wird verlaengert..." : "+7 Tage verlaengern"}
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                handleAction(
                  () => cancelReservation(reservationId, notes),
                  "cancel",
                  "Reservierung storniert."
                )
              }
              disabled={loading !== null}
            >
              <XCircle className="mr-2 h-4 w-4" />
              {loading === "cancel" ? "Wird storniert..." : "Stornieren"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Admin-Notizen */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Admin-Notizen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Interne Notizen zur Reservierung..."
            rows={3}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              handleAction(
                () => updateAdminNotes(reservationId, notes),
                "notes",
                "Notiz gespeichert!"
              )
            }
            disabled={loading !== null}
          >
            <Save className="mr-2 h-4 w-4" />
            {loading === "notes" ? "Speichern..." : "Notiz speichern"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
