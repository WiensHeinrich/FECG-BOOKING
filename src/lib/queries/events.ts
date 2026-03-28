import type { Event } from "@/lib/types/database";
import { mockEvent } from "./mock-data";

const isSupabaseConfigured =
  process.env.NEXT_PUBLIC_SUPABASE_URL !== undefined &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("dein-projekt");

export async function getActiveEvent(): Promise<Event | null> {
  if (!isSupabaseConfigured) {
    return mockEvent;
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("is_active", true)
    .single();

  if (error) {
    console.error("getActiveEvent error:", error);
  }

  return data;
}

export async function getEventBySlug(slug: string): Promise<Event | null> {
  if (!isSupabaseConfigured) {
    return mockEvent.slug === slug ? mockEvent : null;
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .single();

  return data;
}
