import type { HouseType, Availability } from "@/lib/types/database";
import { mockHouseTypes, mockAvailability } from "./mock-data";

const isSupabaseConfigured =
  process.env.NEXT_PUBLIC_SUPABASE_URL !== undefined &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("dein-projekt");

export async function getHouseTypes(eventId: string): Promise<HouseType[]> {
  if (!isSupabaseConfigured) {
    return mockHouseTypes.filter((ht) => ht.event_id === eventId);
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data } = await supabase
    .from("house_types")
    .select("*")
    .eq("event_id", eventId)
    .order("sort_order");

  return data ?? [];
}

export async function getAvailability(eventId: string): Promise<Availability[]> {
  if (!isSupabaseConfigured) {
    return mockAvailability;
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_availability", {
    p_event_id: eventId,
  });

  return data ?? [];
}
