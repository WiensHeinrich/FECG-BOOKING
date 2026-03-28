"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "E-Mail und Passwort sind erforderlich." };
  }

  const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !signInData.user) {
    return { error: "Ungültige Zugangsdaten." };
  }

  // Admin-Check über Service Role Client (umgeht RLS)
  const adminSupabase = createAdminClient();
  const { data: adminRow } = await adminSupabase
    .from("admin_users")
    .select("id")
    .eq("auth_user_id", signInData.user.id)
    .eq("is_active", true)
    .single();

  if (!adminRow) {
    await supabase.auth.signOut();
    return { error: "Dieses Konto hat keinen Admin-Zugang." };
  }

  const redirectTo = formData.get("redirect") as string;
  const safeRedirect =
    redirectTo?.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/admin";

  redirect(safeRedirect);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
