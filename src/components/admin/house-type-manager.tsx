"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  updateHouseType,
  createHouseType,
  deleteHouseType,
  addHouse,
  removeHouse,
} from "@/lib/actions/house-types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Home,
  Pencil,
  Plus,
  Trash2,
  CheckCircle,
  User,
  Save,
  X,
} from "lucide-react";

type HouseWithReservation = {
  id: string;
  house_number: number;
  label: string | null;
  is_available: boolean;
  reservation: {
    house_id: string;
    status: string;
    contact_first_name: string;
    contact_last_name: string;
    payment_status: string;
  } | null;
};

type HouseTypeWithHouses = {
  id: string;
  event_id: string;
  name: string;
  slug: string;
  description: string | null;
  max_guests: number;
  price_per_house: number;
  total_quantity: number;
  features: string[];
  sort_order: number;
  houses: HouseWithReservation[];
};

export function HouseTypeManager({
  houseTypes,
  eventId,
}: {
  houseTypes: HouseTypeWithHouses[];
  eventId: string;
}) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {houseTypes.map((ht) => (
        <HouseTypeCard key={ht.id} houseType={ht} router={router} />
      ))}

      <NewHouseTypeDialog eventId={eventId} sortOrder={houseTypes.length + 1} router={router} />
    </div>
  );
}

function HouseTypeCard({
  houseType: ht,
  router,
}: {
  houseType: HouseTypeWithHouses;
  router: ReturnType<typeof useRouter>;
}) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const occupied = ht.houses.filter((h) => h.reservation).length;
  const total = ht.houses.length;

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading("save");
    const form = new FormData(e.currentTarget);

    const result = await updateHouseType(ht.id, {
      name: form.get("name") as string,
      description: form.get("description") as string,
      max_guests: Number(form.get("max_guests")),
      price_per_house: Number(form.get("price_per_house")),
      features: (form.get("features") as string)
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean),
    });

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Gespeichert!");
      setEditing(false);
      router.refresh();
    }
    setLoading(null);
  }

  async function handleAddHouse() {
    setLoading("add");
    const result = await addHouse(ht.id);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Haus hinzugefuegt!");
      router.refresh();
    }
    setLoading(null);
  }

  async function handleRemoveHouse(houseId: string) {
    if (!confirm("Haus wirklich entfernen?")) return;
    setLoading("remove-" + houseId);
    const result = await removeHouse(houseId, ht.id);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Haus entfernt!");
      router.refresh();
    }
    setLoading(null);
  }

  async function handleDelete() {
    if (!confirm(`Haustyp "${ht.name}" wirklich loeschen? Alle zugehoerigen Haeuser werden ebenfalls geloescht.`)) return;
    setLoading("delete");
    const result = await deleteHouseType(ht.id);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Haustyp geloescht!");
      router.refresh();
    }
    setLoading(null);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base">{ht.name}</CardTitle>
            <Badge variant={occupied === total ? "destructive" : "secondary"}>
              {occupied}/{total} belegt
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing(!editing)}
            >
              {editing ? <X className="mr-1 h-3 w-3" /> : <Pencil className="mr-1 h-3 w-3" />}
              {editing ? "Abbrechen" : "Bearbeiten"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={loading !== null}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {editing ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input name="name" defaultValue={ht.name} required />
              </div>
              <div className="space-y-2">
                <Label>Max. Gaeste</Label>
                <Input
                  name="max_guests"
                  type="number"
                  defaultValue={ht.max_guests}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Preis (EUR)</Label>
                <Input
                  name="price_per_house"
                  type="number"
                  step="0.01"
                  defaultValue={ht.price_per_house}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Features (kommagetrennt)</Label>
                <Input
                  name="features"
                  defaultValue={ht.features.join(", ")}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Beschreibung</Label>
                <Textarea
                  name="description"
                  defaultValue={ht.description || ""}
                  rows={2}
                />
              </div>
            </div>
            <Button type="submit" size="sm" disabled={loading === "save"}>
              <Save className="mr-1 h-3 w-3" />
              {loading === "save" ? "Speichern..." : "Speichern"}
            </Button>
          </form>
        ) : (
          <div className="text-sm text-muted-foreground">
            {ht.description && <p className="mb-1">{ht.description}</p>}
            <p>
              max. {ht.max_guests} Gaeste &middot;{" "}
              {new Intl.NumberFormat("de-DE", {
                style: "currency",
                currency: "EUR",
              }).format(ht.price_per_house)}
              {ht.features.length > 0 && (
                <> &middot; {ht.features.join(", ")}</>
              )}
            </p>
          </div>
        )}

        {/* Haeuser-Grid */}
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {ht.houses.map((house) => (
            <div
              key={house.id}
              className={`flex items-center gap-3 rounded-md border p-3 ${
                house.reservation
                  ? house.reservation.payment_status === "eingegangen"
                    ? "border-green-200 bg-green-50"
                    : "border-amber-200 bg-amber-50"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <Home
                className={`h-5 w-5 ${
                  house.reservation
                    ? house.reservation.payment_status === "eingegangen"
                      ? "text-green-600"
                      : "text-amber-500"
                    : "text-gray-400"
                }`}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Haus {house.house_number}</p>
                {house.reservation ? (
                  <p className="truncate text-xs text-muted-foreground">
                    {house.reservation.contact_first_name}{" "}
                    {house.reservation.contact_last_name}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">Frei</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {house.reservation ? (
                  house.reservation.payment_status === "eingegangen" ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <User className="h-4 w-4 text-amber-500" />
                  )
                ) : editing ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemoveHouse(house.id)}
                    disabled={loading === "remove-" + house.id}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                ) : null}
              </div>
            </div>
          ))}

          {/* Haus hinzufuegen */}
          {editing && (
            <button
              onClick={handleAddHouse}
              disabled={loading === "add"}
              className="flex items-center justify-center gap-2 rounded-md border-2 border-dashed border-gray-300 p-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <Plus className="h-4 w-4" />
              Haus hinzufuegen
            </button>
          )}
        </div>

        {/* Legende */}
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded border border-gray-200 bg-gray-50" />
            Frei
          </span>
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded border border-amber-200 bg-amber-50" />
            Reserviert
          </span>
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded border border-green-200 bg-green-50" />
            Bezahlt
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function NewHouseTypeDialog({
  eventId,
  sortOrder,
  router,
}: {
  eventId: string;
  sortOrder: number;
  router: ReturnType<typeof useRouter>;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const name = form.get("name") as string;

    const result = await createHouseType({
      event_id: eventId,
      name,
      slug: name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      description: form.get("description") as string,
      max_guests: Number(form.get("max_guests")),
      price_per_house: Number(form.get("price_per_house")),
      total_quantity: Number(form.get("total_quantity")),
      features: (form.get("features") as string)
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean),
      sort_order: sortOrder,
    });

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Haustyp erstellt!");
      setOpen(false);
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Neuen Haustyp anlegen
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neuen Haustyp anlegen</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input name="name" placeholder="z.B. Familienhaus Gross" required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Max. Gaeste</Label>
              <Input name="max_guests" type="number" placeholder="6" required />
            </div>
            <div className="space-y-2">
              <Label>Preis (EUR)</Label>
              <Input
                name="price_per_house"
                type="number"
                step="0.01"
                placeholder="850"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Anzahl Haeuser</Label>
            <Input name="total_quantity" type="number" placeholder="4" required />
          </div>
          <div className="space-y-2">
            <Label>Features (kommagetrennt)</Label>
            <Input
              name="features"
              placeholder="2 Schlafzimmer, Wohnkueche, Bad mit Dusche"
            />
          </div>
          <div className="space-y-2">
            <Label>Beschreibung</Label>
            <Textarea name="description" rows={2} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Wird erstellt..." : "Haustyp erstellen"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
