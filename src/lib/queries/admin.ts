import { requireAdminAccess } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  Reservation,
  Guest,
  HouseType,
  House,
  WaitlistEntry,
  Event,
} from "@/lib/types/database";

// Dashboard-Statistiken
export async function getDashboardStats(eventId: string) {
  await requireAdminAccess();
  const supabase = createAdminClient();

  const [reservations, waitlist] = await Promise.all([
    supabase
      .from("reservations")
      .select("status, payment_status, total_price")
      .eq("event_id", eventId),
    supabase
      .from("waitlist")
      .select("status")
      .eq("event_id", eventId),
  ]);

  const allRes = reservations.data || [];
  const totalReservations = allRes.length;
  const confirmed = allRes.filter((r) => r.status === "bestaetigt").length;
  const pending = allRes.filter((r) => r.status === "reserviert").length;
  const expired = allRes.filter((r) => r.status === "abgelaufen").length;
  const cancelled = allRes.filter((r) => r.status === "storniert").length;
  const totalRevenue = allRes
    .filter((r) => r.payment_status === "eingegangen")
    .reduce((sum, r) => sum + r.total_price, 0);
  const pendingPayments = allRes
    .filter(
      (r) => r.status === "reserviert" && r.payment_status === "ausstehend"
    )
    .reduce((sum, r) => sum + r.total_price, 0);
  const waitlistCount = (waitlist.data || []).filter(
    (w) => w.status === "wartend"
  ).length;

  return {
    totalReservations,
    confirmed,
    pending,
    expired,
    cancelled,
    totalRevenue,
    pendingPayments,
    waitlistCount,
  };
}

// Alle Reservierungen mit Details
export async function getReservations(eventId: string) {
  await requireAdminAccess();
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("reservations")
    .select(
      `
      *,
      house:houses!inner(
        *,
        house_type:house_types!inner(*)
      ),
      guests(*)
    `
    )
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getReservations error:", error);
    return [];
  }

  return data as (Reservation & {
    house: House & { house_type: HouseType };
    guests: Guest[];
  })[];
}

// Einzelne Reservierung
export async function getReservation(id: string) {
  await requireAdminAccess();
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("reservations")
    .select(
      `
      *,
      house:houses!inner(
        *,
        house_type:house_types!inner(*)
      ),
      guests(*),
      event:events!inner(*)
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    console.error("getReservation error:", error);
    return null;
  }

  return data as Reservation & {
    house: House & { house_type: HouseType };
    guests: Guest[];
    event: Event;
  };
}

// Hausbelegung
export async function getHouseOccupancy(eventId: string) {
  await requireAdminAccess();
  const supabase = createAdminClient();

  const { data: houseTypes } = await supabase
    .from("house_types")
    .select("*, houses(*)")
    .eq("event_id", eventId)
    .order("sort_order");

  const { data: reservations } = await supabase
    .from("reservations")
    .select("house_id, status, contact_first_name, contact_last_name, payment_status")
    .eq("event_id", eventId)
    .in("status", ["reserviert", "bestaetigt"]);

  const reservationMap = new Map<string, typeof reservations extends (infer T)[] | null ? T : never>();
  (reservations || []).forEach((r) => {
    reservationMap.set(r.house_id, r);
  });

  return (houseTypes || []).map((ht) => ({
    ...ht,
    houses: ((ht.houses as House[]) || [])
      .sort((a, b) => a.house_number - b.house_number)
      .map((house) => ({
        ...house,
        reservation: reservationMap.get(house.id) || null,
      })),
  })) as (HouseType & {
    houses: (House & {
      reservation: {
        house_id: string;
        status: string;
        contact_first_name: string;
        contact_last_name: string;
        payment_status: string;
      } | null;
    })[];
  })[];
}

// Warteliste
export async function getWaitlist(eventId: string) {
  await requireAdminAccess();
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("waitlist")
    .select("*, house_type:house_types!inner(name)")
    .eq("event_id", eventId)
    .order("position");

  if (error) {
    console.error("getWaitlist error:", error);
    return [];
  }

  return data as (WaitlistEntry & { house_type: { name: string } })[];
}

// Verfügbare Häuser pro Haustyp (für Warteliste-Anzeige)
export async function getAvailableHouseCountByType(eventId: string) {
  await requireAdminAccess();
  const supabase = createAdminClient();

  // Alle Häuser laden, die zum Event gehören
  const { data: houses } = await supabase
    .from("houses")
    .select("id, house_type_id, is_available, house_type:house_types!inner(event_id)")
    .eq("is_available", true)
    .eq("house_type.event_id", eventId);

  if (!houses || houses.length === 0) {
    return {} as Record<string, number>;
  }

  // Aktive Reservierungen für diese Häuser prüfen
  const houseIds = houses.map((h) => h.id);
  const { data: reservations } = await supabase
    .from("reservations")
    .select("house_id")
    .in("house_id", houseIds)
    .in("status", ["reserviert", "bestaetigt"]);

  const occupiedHouseIds = new Set((reservations || []).map((r) => r.house_id));

  // Zähle freie Häuser pro Typ
  const counts: Record<string, number> = {};
  for (const h of houses) {
    if (!occupiedHouseIds.has(h.id)) {
      counts[h.house_type_id] = (counts[h.house_type_id] || 0) + 1;
    }
  }

  return counts;
}

// Aktives Event für Admin
export async function getActiveEventAdmin() {
  await requireAdminAccess();
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("is_active", true)
    .single();

  return data as Event | null;
}
