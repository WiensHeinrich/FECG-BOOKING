"use client";

import { Button } from "@/components/ui/button";
import { removeFromWaitlist } from "@/lib/actions/admin";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useState } from "react";

export function WaitlistRemoveButton({ entryId }: { entryId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRemove() {
    if (!confirm("Eintrag wirklich entfernen?")) return;
    setLoading(true);
    const result = await removeFromWaitlist(entryId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Eintrag entfernt.");
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleRemove}
      disabled={loading}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
