"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { XCircle, Loader2 } from "lucide-react";
import { publicCancelReservation } from "@/lib/actions/public-cancel";

export function PublicCancelButton({
  reservationId,
  token,
}: {
  reservationId: string;
  token: string;
}) {
  const [showForm, setShowForm] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit() {
    if (!reason) {
      setError("Bitte wählen Sie einen Grund.");
      return;
    }
    if (reason === "sonstiges" && !details.trim()) {
      setError("Bitte geben Sie den Grund der Stornierung ein.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await publicCancelReservation(reservationId, token, reason, details);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
      }
    });
  }

  if (success) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-center">
        <XCircle className="mx-auto h-8 w-8 text-red-500" />
        <p className="mt-2 font-semibold text-red-800">Reservierung storniert</p>
        <p className="mt-1 text-sm text-red-600">
          Sie erhalten eine Bestätigung per E-Mail.
        </p>
      </div>
    );
  }

  if (!showForm) {
    return (
      <div className="text-center">
        <p className="mb-2 text-xs text-muted-foreground">
          Sie möchten Ihre Reservierung stornieren?
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={() => setShowForm(true)}
        >
          <XCircle className="mr-1.5 h-4 w-4" />
          Reservierung stornieren
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-red-200 bg-red-50/50 p-4 space-y-4">
      <h3 className="font-semibold text-red-800">Reservierung stornieren</h3>
      <p className="text-sm text-muted-foreground">
        Bitte teilen Sie uns den Grund der Stornierung mit.
      </p>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Grund der Stornierung *</Label>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="publicCancelReason"
              value="terminlich_verhindert"
              checked={reason === "terminlich_verhindert"}
              onChange={(e) => setReason(e.target.value)}
            />
            <span className="text-sm">Terminlich verhindert</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="publicCancelReason"
              value="persoenliche_gruende"
              checked={reason === "persoenliche_gruende"}
              onChange={(e) => setReason(e.target.value)}
            />
            <span className="text-sm">Persönliche Gründe</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="publicCancelReason"
              value="sonstiges"
              checked={reason === "sonstiges"}
              onChange={(e) => setReason(e.target.value)}
            />
            <span className="text-sm">Sonstiges</span>
          </label>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm">
          {reason === "sonstiges" ? "Grund eingeben *" : "Zusätzliche Anmerkung (optional)"}
        </Label>
        <Textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Bitte beschreiben Sie den Grund..."
          rows={2}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <Button
          variant="destructive"
          onClick={handleSubmit}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <XCircle className="mr-2 h-4 w-4" />
          )}
          {isPending ? "Wird storniert..." : "Stornierung bestätigen"}
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setShowForm(false);
            setReason("");
            setDetails("");
            setError(null);
          }}
          disabled={isPending}
        >
          Abbrechen
        </Button>
      </div>
    </div>
  );
}
