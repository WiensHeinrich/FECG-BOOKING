import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Kicker({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("kicker mb-[13px]", className)}>{children}</p>;
}

/** Abschnittskopf mit Bereichsbezeichnung, Überschrift, Erklärung und optionalem Link rechts */
export function SectionHead({
  kicker,
  title,
  text,
  aside,
  className,
}: {
  kicker?: string;
  title: string;
  text?: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-[22px] flex flex-col items-start gap-[17px] wide:flex-row wide:items-end wide:justify-between wide:gap-6",
        className
      )}
    >
      <div>
        {kicker && <p className="kicker mb-[9px]">{kicker}</p>}
        <h2 className="display-2">{title}</h2>
        {text && <p className="text-small mt-[10px]">{text}</p>}
      </div>
      {aside}
    </div>
  );
}

/** Kopf einer Unterseite */
export function PageHead({
  kicker,
  title,
  text,
}: {
  kicker: string;
  title: string;
  text?: ReactNode;
}) {
  return (
    <section className="site-container pt-7 wide:pt-[35px]">
      <p className="kicker">{kicker}</p>
      <h1 className="page-title mb-[14px]">{title}</h1>
      {text && <p className="max-w-[65ch] text-[16px] leading-relaxed text-muted-foreground">{text}</p>}
    </section>
  );
}
