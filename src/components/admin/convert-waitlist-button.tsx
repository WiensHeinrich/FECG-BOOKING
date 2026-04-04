"use client";

import { useState, useTransition } from "react";
import { ArrowRightLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { convertWaitlistToReservation } from "@/lib/actions/admin";

export function ConvertWaitlistButton({
  entryId,
  name,
}: {
  entryId: string;
  name: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleConvert() {
    setError(null);
    startTransition(async () => {
      const result = await convertWaitlistToReservation(entryId);
      if (result.error) {
        setError(result.error);
      }
      setShowConfirm(false);
    });
  }

  if (showConfirm) {
    return (
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">
          <strong>{name}</strong> in Reservierung überführen?
        </p>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            className="h-7 px-2 text-xs bg-green-600 hover:bg-green-700 text-white"
            onClick={handleConvert}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <ArrowRightLeft className="h-3 w-3 mr-1" />
            )}
            {isPending ? "Wird überführt…" : "Ja, überführen"}
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
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 text-xs border-green-600 text-green-700 hover:bg-green-50"
        onClick={() => setShowConfirm(true)}
        title={`${name} in Reservierung überführen`}
      >
        <ArrowRightLeft className="h-3.5 w-3.5" />
        In Reservierung
      </Button>
      {error && (
        <p className="text-xs text-destructive mt-1">{error}</p>
      )}
    </div>
  );
}
