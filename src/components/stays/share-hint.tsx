import type { ReactNode } from "react";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Hinweis, dass sich zwei Familien eine Unterkunft teilen können.
 * Steht auf der Startseite, bei den Unterkünften, am Lageplan und in der Anmeldung.
 */
export function ShareHint({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <div
      data-share-hint=""
      className={cn(
        "flex items-start gap-3 rounded-xl border border-[#cfd9c6] bg-sage px-4 py-[14px] text-[15px] leading-[1.6] wide:px-5",
        className
      )}
    >
      <Users className="mt-[3px] h-[20px] w-[20px] shrink-0 text-primary" aria-hidden="true" />
      <p>
        <strong className="font-semibold">Zu zweit ein Haus teilen:</strong> Zwei Familien können sich
        zusammentun und gemeinsam eine Unterkunft buchen, zum Beispiel Familie X mit zwei Kindern und
        Familie Y mit zwei Kindern, zusammen acht Personen. Eine Familie meldet alle an und überweist
        den Betrag.{children && <> {children}</>}
      </p>
    </div>
  );
}
