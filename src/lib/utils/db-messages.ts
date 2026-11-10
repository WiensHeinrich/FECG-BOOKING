/**
 * Meldungen aus den Datenbankfunktionen in der Anrede der Webseite ("ihr").
 * So muss für eine reine Textänderung keine Migration ausgeführt werden.
 */
const DB_MESSAGES: Record<string, string> = {
  "Bitte akzeptieren Sie die Regeln der Gemeindefreizeit.":
    "Bitte akzeptiert die Regeln der Gemeindefreizeit.",
  "Bitte tragen Sie mindestens einen Gast ein.": "Bitte tragt mindestens einen Gast ein.",
  "Es sind noch freie Unterkünfte verfügbar. Bitte reservieren Sie direkt.":
    "Es sind noch freie Unterkünfte verfügbar. Bitte reserviert direkt.",
  "Es sind noch freie Unterkuenfte verfuegbar. Bitte reservieren Sie direkt.":
    "Es sind noch freie Unterkünfte verfügbar. Bitte reserviert direkt.",
};

export function dbMessage(message: string | null | undefined) {
  if (!message) return message;
  return DB_MESSAGES[message] ?? message;
}
