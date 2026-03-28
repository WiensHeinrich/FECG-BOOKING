import { format, formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

export function formatDate(date: string | Date): string {
  return format(new Date(date), "dd. MMMM yyyy", { locale: de });
}

export function formatDateShort(date: string | Date): string {
  return format(new Date(date), "dd.MM.yyyy", { locale: de });
}

export function formatDateRange(start: string | Date, end: string | Date): string {
  const s = new Date(start);
  const e = new Date(end);

  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return `${format(s, "dd.")} - ${format(e, "dd. MMMM yyyy", { locale: de })}`;
  }

  return `${format(s, "dd. MMMM", { locale: de })} - ${format(e, "dd. MMMM yyyy", { locale: de })}`;
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), "dd.MM.yyyy HH:mm", { locale: de });
}

export function formatTimeUntil(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { locale: de, addSuffix: true });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
