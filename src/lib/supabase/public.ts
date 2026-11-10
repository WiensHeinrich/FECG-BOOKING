import { createClient } from "@supabase/supabase-js";

/**
 * Supabase-Client für öffentliche Lesezugriffe ohne Cookies.
 * Seiten, die nur diesen Client nutzen, werden zwischengespeichert ausgeliefert
 * und müssen nicht bei jedem Aufruf neu berechnet werden.
 */
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
