"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateEventSettings } from "@/lib/actions/admin";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Event } from "@/lib/types/database";

function toDateTimeLocalValue(value: string) {
  const date = new Date(value);
  const timezoneOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

export default function EinstellungenPage() {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("is_active", true)
        .single();
      setEvent(data);
      setLoading(false);
    }
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!event) return;

    setSaving(true);
    const form = new FormData(e.currentTarget);
    const registrationStart = form.get("registration_start") as string;
    const registrationEnd = form.get("registration_end") as string;

    const result = await updateEventSettings(event.id, {
      title: form.get("title") as string,
      description: form.get("description") as string,
      location: form.get("location") as string,
      location_address: form.get("location_address") as string,
      start_date: form.get("start_date") as string,
      end_date: form.get("end_date") as string,
      registration_start: registrationStart
        ? new Date(registrationStart).toISOString()
        : undefined,
      registration_end: registrationEnd
        ? new Date(registrationEnd).toISOString()
        : undefined,
      contact_email: form.get("contact_email") as string,
      contact_phone: form.get("contact_phone") as string,
      bank_account_holder: form.get("bank_account_holder") as string,
      bank_iban: form.get("bank_iban") as string,
      bank_bic: form.get("bank_bic") as string,
      bank_reference_prefix: form.get("bank_reference_prefix") as string,
    });

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Einstellungen gespeichert!");
    }
    setSaving(false);
  }

  if (loading) return <p>Laden...</p>;
  if (!event) return <p>Kein aktives Event.</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Einstellungen</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Event-Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Event-Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="title">Titel</Label>
              <Input id="title" name="title" defaultValue={event.title} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={event.description || ""}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="start_date">Startdatum</Label>
              <Input
                id="start_date"
                name="start_date"
                type="date"
                defaultValue={event.start_date}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">Enddatum</Label>
              <Input
                id="end_date"
                name="end_date"
                type="date"
                defaultValue={event.end_date}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="registration_start">Anmeldung ab</Label>
              <Input
                id="registration_start"
                name="registration_start"
                type="datetime-local"
                defaultValue={toDateTimeLocalValue(event.registration_start)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="registration_end">Anmeldung bis</Label>
              <Input
                id="registration_end"
                name="registration_end"
                type="datetime-local"
                defaultValue={toDateTimeLocalValue(event.registration_end)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Ort */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ort</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="location">Ortsname</Label>
              <Input
                id="location"
                name="location"
                defaultValue={event.location}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location_address">Adresse</Label>
              <Input
                id="location_address"
                name="location_address"
                defaultValue={event.location_address || ""}
              />
            </div>
          </CardContent>
        </Card>

        {/* Kontakt */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kontakt</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contact_email">E-Mail</Label>
              <Input
                id="contact_email"
                name="contact_email"
                type="email"
                defaultValue={event.contact_email}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_phone">Telefon</Label>
              <Input
                id="contact_phone"
                name="contact_phone"
                defaultValue={event.contact_phone || ""}
              />
            </div>
          </CardContent>
        </Card>

        {/* Bankdaten */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bankdaten</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="bank_account_holder">Kontoinhaber</Label>
              <Input
                id="bank_account_holder"
                name="bank_account_holder"
                defaultValue={event.bank_account_holder}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank_iban">IBAN</Label>
              <Input
                id="bank_iban"
                name="bank_iban"
                defaultValue={event.bank_iban}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank_bic">BIC</Label>
              <Input
                id="bank_bic"
                name="bank_bic"
                defaultValue={event.bank_bic || ""}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="bank_reference_prefix">
                Verwendungszweck-Praefix
              </Label>
              <Input
                id="bank_reference_prefix"
                name="bank_reference_prefix"
                defaultValue={event.bank_reference_prefix || ""}
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Speichern..." : "Einstellungen speichern"}
        </Button>
      </form>
    </div>
  );
}
