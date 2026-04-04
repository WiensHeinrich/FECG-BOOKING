"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  confirmPayment,
  cancelReservation,
  extendReservation,
  updateAdminNotes,
  revertReservationStatus,
} from "@/lib/actions/admin";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Clock, Save, Loader2, Undo2 } from "lucide-react";

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

  // Stornierungsdialog
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState<string>("");
  const [cancelDetails, setCancelDetails] = useState("");

  // Rückgängig-Bestätigung
  const [showRevertConfirm, setShowRevertConfirm] = useState(false);

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

  async function handleCancel() {
    if (!cancelReason) {
      toast.error("Bitte wählen Sie einen Stornierungsgrund.");
      return;
    }
    if (cancelReason === "sonstiges" && !cancelDetails.trim()) {
      toast.error("Bitte geben Sie den Grund der Stornierung ein.");
      return;
    }

    setLoading("cancel");
    const result = await cancelReservation(reservationId, cancelReason, cancelDetails);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Reservierung storniert. Der Gast wurde per E-Mail benachrichtigt.");
      setShowCancelDialog(false);
      router.refresh();
    }
    setLoading(null);
  }

  async function handleRevert() {
    setLoading("revert");
    const result = await revertReservationStatus(reservationId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Status wurde zurückgesetzt auf 'Reserviert'.");
      setShowRevertConfirm(false);
      router.refresh();
    }
    setLoading(null);
  }

  const revertLabel =
    status === "bestaetigt"
      ? "Zahlung zurücknehmen"
      : status === "storniert"
      ? "Stornierung rückgängig"
      : "";

  const revertDescription =
    status === "bestaetigt"
      ? "Status wird auf 'Reserviert' und Zahlung auf 'Ausstehend' zurückgesetzt."
      : status === "storniert"
      ? "Status wird auf 'Reserviert' zurückgesetzt und das Haus wieder als belegt markiert."
      : "";

  return (
    <div className="space-y-4">
      {/* Aktions-Buttons für "reserviert" */}
      {status === "reserviert" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aktionen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              {paymentStatus === "ausstehend" && (
                <Button
                  onClick={() =>
                    handleAction(
                      () => confirmPayment(reservationId),
                      "confirm",
                      "Zahlung bestätigt!"
                    )
                  }
                  disabled={loading !== null}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {loading === "confirm"
                    ? "Wird bestätigt..."
                    : "Zahlung bestätigen"}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() =>
                  handleAction(
                    () => extendReservation(reservationId, 7),
                    "extend",
                    "Reservierung um 7 Tage verlängert!"
                  )
                }
                disabled={loading !== null}
              >
                <Clock className="mr-2 h-4 w-4" />
                {loading === "extend" ? "Wird verlängert..." : "+7 Tage verlängern"}
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowCancelDialog(!showCancelDialog)}
                disabled={loading !== null}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Stornieren
              </Button>
            </div>

            {/* Stornierungsdialog */}
            {showCancelDialog && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 space-y-4">
                <h4 className="font-semibold text-destructive">Reservierung stornieren</h4>
                <p className="text-sm text-muted-foreground">
                  Der Gast erhält eine E-Mail mit dem Stornierungsgrund.
                </p>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Grund der Stornierung *</Label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="cancelReason"
                        value="zahlung_nicht_eingegangen"
                        checked={cancelReason === "zahlung_nicht_eingegangen"}
                        onChange={(e) => setCancelReason(e.target.value)}
                        className="accent-destructive"
                      />
                      <span className="text-sm">Zahlung nicht eingegangen</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="cancelReason"
                        value="auf_wunsch"
                        checked={cancelReason === "auf_wunsch"}
                        onChange={(e) => setCancelReason(e.target.value)}
                        className="accent-destructive"
                      />
                      <span className="text-sm">Auf Wunsch des Gastes</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="cancelReason"
                        value="sonstiges"
                        checked={cancelReason === "sonstiges"}
                        onChange={(e) => setCancelReason(e.target.value)}
                        className="accent-destructive"
                      />
                      <span className="text-sm">Sonstiges</span>
                    </label>
                  </div>
                </div>

                {(cancelReason === "sonstiges" || cancelReason === "auf_wunsch") && (
                  <div className="space-y-1.5">
                    <Label className="text-sm">
                      {cancelReason === "sonstiges" ? "Grund eingeben *" : "Zusätzliche Anmerkung (optional)"}
                    </Label>
                    <Textarea
                      value={cancelDetails}
                      onChange={(e) => setCancelDetails(e.target.value)}
                      placeholder="Grund der Stornierung..."
                      rows={2}
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    onClick={handleCancel}
                    disabled={loading === "cancel"}
                  >
                    {loading === "cancel" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="mr-2 h-4 w-4" />
                    )}
                    {loading === "cancel" ? "Wird storniert..." : "Stornierung bestätigen"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowCancelDialog(false);
                      setCancelReason("");
                      setCancelDetails("");
                    }}
                    disabled={loading === "cancel"}
                  >
                    Abbrechen
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Rückgängig-Button für "bestätigt" oder "storniert" */}
      {(status === "bestaetigt" || status === "storniert") && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aktionen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!showRevertConfirm ? (
              <Button
                variant="outline"
                onClick={() => setShowRevertConfirm(true)}
                disabled={loading !== null}
              >
                <Undo2 className="mr-2 h-4 w-4" />
                {revertLabel}
              </Button>
            ) : (
              <div className="rounded-md border border-amber-300 bg-amber-50 p-4 space-y-3">
                <h4 className="font-semibold text-amber-800">Rückgängig machen?</h4>
                <p className="text-sm text-amber-700">{revertDescription}</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="border-amber-400 text-amber-800 hover:bg-amber-100"
                    onClick={handleRevert}
                    disabled={loading === "revert"}
                  >
                    {loading === "revert" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Undo2 className="mr-2 h-4 w-4" />
                    )}
                    {loading === "revert" ? "Wird zurückgesetzt..." : "Ja, rückgängig machen"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setShowRevertConfirm(false)}
                    disabled={loading === "revert"}
                  >
                    Abbrechen
                  </Button>
                </div>
              </div>
            )}
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
