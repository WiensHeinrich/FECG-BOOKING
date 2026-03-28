// Manuelle Typen bis Supabase CLI verfuegbar ist
// Spaeter durch `supabase gen types typescript` ersetzen

export type ReservationStatus = 'reserviert' | 'bestaetigt' | 'storniert' | 'abgelaufen'
export type PaymentStatus = 'ausstehend' | 'eingegangen' | 'erstattet'
export type WaitlistStatus = 'wartend' | 'benachrichtigt' | 'abgelaufen' | 'umgewandelt'

export interface Event {
  id: string
  title: string
  slug: string
  description: string | null
  location: string
  location_address: string | null
  location_url: string | null
  start_date: string
  end_date: string
  registration_start: string
  registration_end: string
  reservation_validity_days: number
  bank_account_holder: string
  bank_iban: string
  bank_bic: string | null
  bank_reference_prefix: string | null
  contact_email: string
  contact_phone: string | null
  is_active: boolean
  hero_image_url: string | null
  additional_info: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface HouseType {
  id: string
  event_id: string
  name: string
  slug: string
  description: string | null
  max_guests: number
  price_per_house: number
  price_per_person: number | null
  total_quantity: number
  features: string[]
  image_url: string | null
  sort_order: number
  created_at: string
}

export interface House {
  id: string
  house_type_id: string
  house_number: number
  label: string | null
  notes: string | null
  is_available: boolean
  created_at: string
}

export interface Reservation {
  id: string
  event_id: string
  house_id: string
  contact_first_name: string
  contact_last_name: string
  contact_email: string
  contact_phone: string | null
  status: ReservationStatus
  payment_status: PaymentStatus
  total_price: number
  payment_reference: string
  reserved_at: string
  expires_at: string
  payment_confirmed_at: string | null
  cancelled_at: string | null
  admin_notes: string | null
  confirmed_by: string | null
  created_at: string
  updated_at: string
}

export interface Guest {
  id: string
  reservation_id: string
  first_name: string
  last_name: string
  birth_date: string | null
  is_child: boolean
  dietary_notes: string | null
  sort_order: number
  created_at: string
}

export interface WaitlistEntry {
  id: string
  event_id: string
  house_type_id: string
  contact_first_name: string
  contact_last_name: string
  contact_email: string
  contact_phone: string | null
  guest_count: number
  status: WaitlistStatus
  position: number
  notified_at: string | null
  notification_expires_at: string | null
  converted_reservation_id: string | null
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  event_id: string
  title: string
  description: string | null
  file_url: string
  file_size_bytes: number | null
  sort_order: number
  is_published: boolean
  created_at: string
}

export interface Availability {
  house_type_id: string
  house_type_name: string
  total_quantity: number
  reserved_count: number
  available_count: number
}

// Erweiterte Typen mit Relationen
export interface ReservationWithDetails extends Reservation {
  house: House & { house_type: HouseType }
  guests: Guest[]
  event: Event
}

export interface HouseTypeWithAvailability extends HouseType {
  available_count: number
  reserved_count: number
}
