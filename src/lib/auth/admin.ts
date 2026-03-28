import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { cache } from "react";

export const requireAdminAccess = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: isAdmin, error } = await supabase.rpc("is_admin");

  if (error || isAdmin !== true) {
    await supabase.auth.signOut();
    redirect("/login?error=not-authorized");
  }

  return user;
});
