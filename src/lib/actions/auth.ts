"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "E-Mail und Passwort sind erforderlich." };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Ungültige Zugangsdaten." };
  }

  const { data: isAdmin, error: adminCheckError } = await supabase.rpc(
    "is_admin"
  );

  if (adminCheckError || isAdmin !== true) {
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
