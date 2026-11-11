"use client";

import { AlertCircle, ArrowRight, X } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

/** Eine fehlende oder falsche Angabe im Formular */
export interface FormProblem {
  /** "Kontaktperson", "Gast 5 (Anna Muster)", "Mithilfe" */
  section: string;
  /** "Vorname fehlt" */
  text: string;
  /** Feld, zu dem ein Klick auf den Eintrag springt */
  el?: HTMLElement | null;
}

interface ProblemDialogProps {
  /** Liste fehlender Angaben, null oder leer = keine */
  problems: FormProblem[] | null;
  /** einzelner Hinweis, zum Beispiel wenn das Wunschhaus gerade vergeben wurde */
  message: string | null;
  onClose: () => void;
  /** springt zum Feld; das Fenster schließt sich dabei */
  onJump: (problem: FormProblem) => void;
  /** wird nach dem Schließen aufgerufen, dort kann der Fokus gesetzt werden */
  onClosed: (event: Event) => void;
}

/**
 * Fenster mit allen Punkten, die vor dem Weitergehen noch fehlen.
 * Schließt sich beim Klick daneben, mit Escape oder über das Kreuz.
 */
export function ProblemDialog({ problems, message, onClose, onJump, onClosed }: ProblemDialogProps) {
  const list = problems ?? [];
  const open = list.length > 0 || message !== null;

  // nach Abschnitt gruppieren, Reihenfolge wie im Formular
  const groups: { section: string; items: FormProblem[] }[] = [];
  for (const p of list) {
    const group = groups.find((g) => g.section === p.section);
    if (group) group.items.push(p);
    else groups.push({ section: p.section, items: [p] });
  }
  const firstWithField = list.find((p) => p.el);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton={false}
        onCloseAutoFocus={onClosed}
        data-problem-dialog=""
        className="max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto rounded-2xl border-border bg-card p-0 sm:max-w-[460px]"
      >
        <div className="flex items-start gap-3 px-5 pb-3 pt-5 wide:px-6">
          <AlertCircle className="mt-[3px] h-[22px] w-[22px] shrink-0 text-destructive" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <DialogTitle className="text-[20px] font-semibold leading-[1.3]">
              {list.length > 0 ? "Hier fehlt noch etwas" : "Bitte beachten"}
            </DialogTitle>
            <DialogDescription className="mt-1 text-[15px] leading-[1.5] text-muted-foreground">
              {list.length > 0
                ? list.length === 1
                  ? "Eine Angabe brauchen wir noch, dann geht es weiter."
                  : `${list.length} Angaben brauchen wir noch, dann geht es weiter. Tippt einen Punkt an, um direkt dorthin zu springen.`
                : message}
            </DialogDescription>
          </div>
          <DialogClose
            aria-label="Schließen"
            className="-mr-1.5 -mt-1 flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
          >
            <X className="h-[18px] w-[18px]" aria-hidden="true" />
          </DialogClose>
        </div>

        {groups.length > 0 && (
          <div className="space-y-3 px-5 pb-1 wide:px-6">
            {groups.map((group) => (
              <div key={group.section}>
                <p className="mb-1 text-[13px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                  {group.section}
                </p>
                <ul className="overflow-hidden rounded-lg border border-border">
                  {group.items.map((p, i) => (
                    <li key={`${p.text}-${i}`} className="border-b border-border last:border-b-0">
                      {p.el ? (
                        <button
                          type="button"
                          onClick={() => onJump(p)}
                          className="flex w-full cursor-pointer items-center justify-between gap-3 bg-background px-3 py-[9px] text-left text-[16px] leading-[1.4] hover:bg-sage"
                        >
                          <span>{p.text}</span>
                          <ArrowRight className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                        </button>
                      ) : (
                        <p className="bg-background px-3 py-[9px] text-[16px] leading-[1.4]">{p.text}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        <div className="px-5 pb-5 pt-4 wide:px-6">
          {firstWithField ? (
            <button type="button" className="btn-primary w-full" onClick={() => onJump(firstWithField)}>
              Zur ersten fehlenden Angabe
              <ArrowRight className="h-[17px] w-[17px]" aria-hidden="true" />
            </button>
          ) : (
            <button type="button" className="btn-primary w-full" onClick={onClose}>
              Verstanden
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
