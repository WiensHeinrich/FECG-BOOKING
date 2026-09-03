import type { Event } from "@/lib/types/database";

export type RegistrationStatus = "upcoming" | "open" | "closed";

export interface RegistrationInfo {
  status: RegistrationStatus;
  daysUntilStart: number;
  daysUntilRegistrationEnd: number;
}

const MS_PER_DAY = 86_400_000;

export function getRegistrationInfo(event: Event, now: Date = new Date()): RegistrationInfo {
  const registrationStart = new Date(event.registration_start);
  const registrationEnd = new Date(event.registration_end);

  const status: RegistrationStatus =
    now < registrationStart ? "upcoming" : now <= registrationEnd ? "open" : "closed";

  const daysUntilStart = Math.ceil(
    (new Date(event.start_date).getTime() - now.getTime()) / MS_PER_DAY
  );
  const daysUntilRegistrationEnd = Math.ceil(
    (registrationEnd.getTime() - now.getTime()) / MS_PER_DAY
  );

  return { status, daysUntilStart, daysUntilRegistrationEnd };
}
