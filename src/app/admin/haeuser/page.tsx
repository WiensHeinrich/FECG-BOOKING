import { getHouseOccupancy, getActiveEventAdmin } from "@/lib/queries/admin";
import { HouseTypeManager } from "@/components/admin/house-type-manager";

export default async function HaeuserPage() {
  const event = await getActiveEventAdmin();
  if (!event) return <p>Kein aktives Event.</p>;

  const occupancy = await getHouseOccupancy(event.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hausbelegung &amp; Verwaltung</h1>
        <p className="text-sm text-muted-foreground">
          Über &quot;Bearbeiten&quot; lassen sich Haustypen ändern sowie Häuser hinzufügen oder entfernen.
        </p>
      </div>

      <HouseTypeManager houseTypes={occupancy} eventId={event.id} />
    </div>
  );
}
