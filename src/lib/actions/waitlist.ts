"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod/v4";
import { redirect } from "next/navigation";

const waitlistSchema = z.object({
  event_id: z.string().uuid(),
  house_type_id: z.string().uuid(),
  contact_first_name: z.string().min(1),
  contact_last_name: z.string().min(1),
  contact_email: z.email(),
  contact_phone: z.string().optional(),
  guest_count: z.number().min(1).max(10),
});

export type WaitlistFormData = z.infer<typeof waitlistSchema>;

export async function joinWaitlist(formData: WaitlistFormData) {
  const parsed = waitlistSchema.safeParse(formData);

  if (!parsed.success) {
    return { error: "Ungueltige Eingaben." };
  }

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("dein-projekt") ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return { error: "Die Warteliste ist in dieser Umgebung nicht verfuegbar." };
  }

  const data = parsed.data;
  const supabase = await createClient();

  const { data: result, error } = await supabase.rpc("join_public_waitlist", {
    p_event_id: data.event_id,
    p_house_type_id: data.house_type_id,
    p_contact_first_name: data.contact_first_name,
    p_contact_last_name: data.contact_last_name,
    p_contact_email: data.contact_email,
    p_contact_phone: data.contact_phone ?? null,
    p_guest_count: data.guest_count,
  });

  if (error) {
    return { error: "Warteliste-Eintrag fehlgeschlagen." };
  }

  if (result?.error || !result?.position) {
    return { error: result?.error || "Warteliste-Eintrag fehlgeschlagen." };
  }

  redirect(`/anmeldung/warteliste?position=${result.position}`);
}
