import type { Document } from "@/lib/types/database";
import { mockDocuments } from "./mock-data";

const isSupabaseConfigured =
  process.env.NEXT_PUBLIC_SUPABASE_URL !== undefined &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("dein-projekt");

export async function getPublishedDocuments(eventId: string): Promise<Document[]> {
  if (!isSupabaseConfigured) {
    return mockDocuments.filter((d) => d.event_id === eventId);
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data } = await supabase
    .from("documents")
    .select("*")
    .eq("event_id", eventId)
    .eq("is_published", true)
    .order("sort_order");

  return data ?? [];
}
