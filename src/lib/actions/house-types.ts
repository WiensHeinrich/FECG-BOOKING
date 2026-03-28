"use server";

import { requireAdminAccess } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function updateHouseType(
  id: string,
  data: {
    name?: string;
    description?: string;
    max_guests?: number;
    price_per_house?: number;
    features?: string[];
  }
) {
  await requireAdminAccess();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("house_types")
    .update(data)
    .eq("id", id);

  if (error) {
    return { error: "Haustyp konnte nicht gespeichert werden: " + error.message };
  }

  revalidatePath("/admin/haeuser");
  revalidatePath("/anmeldung");
  return { success: true };
}

export async function createHouseType(data: {
  event_id: string;
  name: string;
  slug: string;
  description: string;
  max_guests: number;
  price_per_house: number;
  total_quantity: number;
  features: string[];
  sort_order: number;
}) {
  await requireAdminAccess();
  const supabase = createAdminClient();

  // 1. Haustyp anlegen
  const { data: houseType, error } = await supabase
    .from("house_types")
    .insert(data)
    .select()
    .single();

  if (error) {
    return { error: "Haustyp konnte nicht erstellt werden: " + error.message };
  }

  // 2. Einzelne Haeuser anlegen
  const houses = Array.from({ length: data.total_quantity }, (_, i) => ({
    house_type_id: houseType.id,
    house_number: i + 1,
    is_available: true,
  }));

  const { error: housesError } = await supabase.from("houses").insert(houses);

  if (housesError) {
    return { error: "Haeuser konnten nicht erstellt werden: " + housesError.message };
  }

  revalidatePath("/admin/haeuser");
  revalidatePath("/anmeldung");
  return { success: true, id: houseType.id };
}

export async function deleteHouseType(id: string) {
  await requireAdminAccess();
  const supabase = createAdminClient();

  // Pruefen ob Reservierungen existieren
  const { data: houses } = await supabase
    .from("houses")
    .select("id")
    .eq("house_type_id", id);

  if (houses && houses.length > 0) {
    const houseIds = houses.map((h) => h.id);
    const { data: reservations } = await supabase
      .from("reservations")
      .select("id")
      .in("house_id", houseIds)
      .in("status", ["reserviert", "bestaetigt"]);

    if (reservations && reservations.length > 0) {
      return {
        error: "Kann nicht geloescht werden - es gibt aktive Reservierungen fuer diesen Haustyp.",
      };
    }

    // Haeuser loeschen
    await supabase.from("houses").delete().eq("house_type_id", id);
  }

  const { error } = await supabase.from("house_types").delete().eq("id", id);

  if (error) {
    return { error: "Loeschen fehlgeschlagen: " + error.message };
  }

  revalidatePath("/admin/haeuser");
  revalidatePath("/anmeldung");
  return { success: true };
}

export async function addHouse(houseTypeId: string) {
  await requireAdminAccess();
  const supabase = createAdminClient();

  // Hoechste Hausnummer finden
  const { data: existing } = await supabase
    .from("houses")
    .select("house_number")
    .eq("house_type_id", houseTypeId)
    .order("house_number", { ascending: false })
    .limit(1);

  const nextNumber = existing && existing.length > 0 ? existing[0].house_number + 1 : 1;

  const { error } = await supabase.from("houses").insert({
    house_type_id: houseTypeId,
    house_number: nextNumber,
    is_available: true,
  });

  if (error) {
    return { error: "Haus konnte nicht hinzugefuegt werden." };
  }

  // total_quantity aktualisieren
  const { count } = await supabase
    .from("houses")
    .select("*", { count: "exact", head: true })
    .eq("house_type_id", houseTypeId);

  await supabase
    .from("house_types")
    .update({ total_quantity: count || 0 })
    .eq("id", houseTypeId);

  revalidatePath("/admin/haeuser");
  revalidatePath("/anmeldung");
  return { success: true };
}

export async function removeHouse(houseId: string, houseTypeId: string) {
  await requireAdminAccess();
  const supabase = createAdminClient();

  // Pruefen ob Reservierung existiert
  const { data: reservation } = await supabase
    .from("reservations")
    .select("id")
    .eq("house_id", houseId)
    .in("status", ["reserviert", "bestaetigt"])
    .limit(1);

  if (reservation && reservation.length > 0) {
    return { error: "Haus hat eine aktive Reservierung und kann nicht entfernt werden." };
  }

  const { error } = await supabase.from("houses").delete().eq("id", houseId);

  if (error) {
    return { error: "Haus konnte nicht entfernt werden." };
  }

  // total_quantity aktualisieren
  const { count } = await supabase
    .from("houses")
    .select("*", { count: "exact", head: true })
    .eq("house_type_id", houseTypeId);

  await supabase
    .from("house_types")
    .update({ total_quantity: count || 0 })
    .eq("id", houseTypeId);

  revalidatePath("/admin/haeuser");
  revalidatePath("/anmeldung");
  return { success: true };
}
