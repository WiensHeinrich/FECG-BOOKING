"use client";

import { useState, useTransition } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteReservation } from "@/lib/actions/admin";

export function DeleteReservationButton({
  reservationId,
  name,
}: {
  reservationId: string;
  name: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteReservation(reservationId);
      if (result?.error) {
        setError(result.error);
      }
      setShowConfirm(false);
    });
  }

  if (showConfirm) {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-1">
          <Button
            variant="destructive"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              "Ja, löschen"
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => { setShowConfirm(false); setError(null); }}
            disabled={isPending}
          >
            Abbrechen
          </Button>
        </div>
        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
        onClick={() => setShowConfirm(true)}
        title={`${name} löschen`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      {error && (
        <p className="text-xs text-destructive mt-1">{error}</p>
      )}
    </div>
  );
}
