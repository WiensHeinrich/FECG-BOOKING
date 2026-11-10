import type { HouseType, Availability, HouseStatus } from "@/lib/types/database";
import { mockHouseTypes, mockAvailability, mockHouseStatus } from "./mock-data";

const isSupabaseConfigured =
  process.env.NEXT_PUBLIC_SUPABASE_URL !== undefined &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("dein-projekt");

export async function getHouseTypes(eventId: string): Promise<HouseType[]> {
  if (!isSupabaseConfigured) {
    return mockHouseTypes.filter((ht) => ht.event_id === eventId);
  }

  const { createPublicClient } = await import("@/lib/supabase/public");
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("house_types")
    .select("*")
    .eq("event_id", eventId)
    .order("sort_order");

  if (error) {
    throw new Error(`Unterkünfte konnten nicht geladen werden: ${error.message}`);
  }

  return data ?? [];
}

export async function getAvailability(eventId: string): Promise<Availability[]> {
  if (!isSupabaseConfigured) {
    return mockAvailability;
  }

  const { createPublicClient } = await import("@/lib/supabase/public");
  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("get_availability", {
    p_event_id: eventId,
  });

  if (error) {
    throw new Error(`Verfügbarkeit konnte nicht geladen werden: ${error.message}`);
  }

  return data ?? [];
}

/**
 * Belegung je Haus für die feste Hauswahl. Liefert null, wenn die Datenbankfunktion
 * (Migration 015) noch fehlt oder nicht erreichbar ist: Dann wird wie früher nur die Art gebucht.
 */
export async function getHouseStatus(eventId: string): Promise<HouseStatus[] | null> {
  if (!isSupabaseConfigured) {
    return mockHouseStatus;
  }

  const { createPublicClient } = await import("@/lib/supabase/public");
  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("get_house_status", {
    p_event_id: eventId,
  });

  if (error) {
    if (error.code !== "PGRST202") {
      console.error("RPC get_house_status error:", error.message, error.code);
    }
    return null;
  }

  return (data as HouseStatus[] | null) ?? null;
}
