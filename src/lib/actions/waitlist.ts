"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod/v4";
import { redirect } from "next/navigation";
import { sendEmail } from "@/lib/email/send";
import { waitlistConfirmationEmail, adminNewWaitlistEmail } from "@/lib/email/templates";
import { ADMIN_EMAIL } from "@/lib/email/resend";
import type { GuestEmailData } from "@/lib/email/templates";

const guestSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  birth_date: z.string().optional(),
  is_child: z.boolean().default(false),
  gender: z.enum(["maennlich", "weiblich"]).optional(),
  dietary_notes: z.string().optional(),
  sort_order: z.number().default(0),
});

const waitlistSchema = z.object({
  event_id: z.string().uuid(),
  house_type_id: z.string().uuid(),
  contact_first_name: z.string().min(1),
  contact_last_name: z.string().min(1),
  contact_email: z.email(),
  contact_phone: z.string().optional(),
  contact_gender: z.enum(["maennlich", "weiblich"]).optional(),
  guest_count: z.number().min(1).max(10),
  guests: z.array(guestSchema).optional(),
});

export type WaitlistFormData = z.infer<typeof waitlistSchema>;

export async function joinWaitlist(formData: WaitlistFormData) {
  const parsed = waitlistSchema.safeParse(formData);

  if (!parsed.success) {
    return { error: "Ungültige Eingaben." };
  }

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("dein-projekt") ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return { error: "Die Warteliste ist in dieser Umgebung nicht verfügbar." };
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
    p_contact_gender: data.contact_gender ?? null,
    p_guests: data.guests ?? [],
  });

  if (error) {
    return { error: "Warteliste-Eintrag fehlgeschlagen." };
  }

  if (result?.error || !result?.position) {
    return { error: result?.error || "Warteliste-Eintrag fehlgeschlagen." };
  }

  // Haustyp-Name laden für E-Mails
  const { data: houseType } = await supabase
    .from("house_types")
    .select("name")
    .eq("id", data.house_type_id)
    .single();

  const houseTypeName = houseType?.name || "Unterkunft";

  // Gästedaten für E-Mail aufbereiten
  const emailGuests: GuestEmailData[] = (data.guests || []).map((g) => ({
    first_name: g.first_name,
    last_name: g.last_name,
    birth_date: g.birth_date || null,
    is_child: g.is_child,
    gender: g.gender || null,
    dietary_notes: g.dietary_notes || null,
  }));

  // 1. Bestätigungs-E-Mail an den Gast
  const guestEmail = waitlistConfirmationEmail({
    firstName: data.contact_first_name,
    contactGender: data.contact_gender ?? null,
    houseTypeName,
    position: result.position,
    guests: emailGuests,
  });
  sendEmail({ to: data.contact_email, ...guestEmail }).catch(console.error);

  // 2. Info-E-Mail an Admin
  const adminEmail = adminNewWaitlistEmail({
    firstName: data.contact_first_name,
    lastName: data.contact_last_name,
    email: data.contact_email,
    phone: data.contact_phone ?? null,
    contactGender: data.contact_gender ?? null,
    houseTypeName,
    position: result.position,
    guestCount: data.guest_count,
    guests: emailGuests,
  });
  sendEmail({ to: ADMIN_EMAIL, ...adminEmail }).catch(console.error);

  redirect(`/anmeldung/warteliste?position=${result.position}`);
}
