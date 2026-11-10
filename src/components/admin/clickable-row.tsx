"use client";

import type { MouseEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { TableRow } from "@/components/ui/table";

/**
 * Tabellenzeile, die als Ganzes zur Detailseite führt. Klicks auf Knöpfe, Links und
 * auf Bereiche mit data-no-row-click (zum Beispiel Löschen) lösen nichts aus.
 */
export function ClickableRow({ href, children }: { href: string; children: ReactNode }) {
  const router = useRouter();

  function open(e: MouseEvent<HTMLTableRowElement>) {
    const target = e.target as Element;
    if (target.closest("a, button, input, select, textarea, [data-no-row-click]")) return;
    // Text markieren soll die Zeile nicht öffnen
    if (window.getSelection()?.toString()) return;
    if (e.ctrlKey || e.metaKey) {
      window.open(href, "_blank", "noopener");
      return;
    }
    router.push(href);
  }

  return (
    <TableRow onClick={open} className="cursor-pointer">
      {children}
    </TableRow>
  );
}
