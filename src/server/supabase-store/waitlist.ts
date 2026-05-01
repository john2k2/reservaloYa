import { slugify } from "@/lib/utils";
import type { BookingRecord, BusinessRecord, ServiceRecord, WaitlistEntryRecord } from "@/server/supabase-domain";
import { getSupabaseAdminClient, createSupabaseRecord } from "./_core";
import { notifyWaitlistForDate } from "./helpers";

export async function createSupabaseWaitlistEntry(input: {
  businessSlug: string;
  serviceId?: string;
  bookingDate: string;
  fullName: string;
  email: string;
  phone?: string;
}) {
  const client = await getSupabaseAdminClient();
  const normalizedSlug = slugify(input.businessSlug);

  const { data: businessData, error: businessError } = await client
    .from("businesses")
    .select("*")
    .eq("slug", normalizedSlug)
    .eq("active", true)
    .single();

  if (businessError || !businessData) {
    throw new Error("Negocio no encontrado.");
  }
  const business = businessData as BusinessRecord;

  if (!input.serviceId) {
    throw new Error("No encontramos el servicio.");
  }

  const { data: serviceData } = await client
    .from("services")
    .select("*")
    .eq("id", input.serviceId)
    .single();

  const service = serviceData as ServiceRecord | null;

  if (!service || service.business_id !== business.id || !service.active) {
    throw new Error("No encontramos el servicio.");
  }

  const { data: existingData } = await client
    .from("waitlist_entries")
    .select("id")
    .eq("business_id", business.id)
    .eq("service_id", input.serviceId)
    .eq("bookingDate", input.bookingDate)
    .eq("email", input.email)
    .limit(1);

  if (existingData && existingData.length > 0) {
    return existingData[0].id;
  }

  const entry = await createSupabaseRecord<WaitlistEntryRecord>("waitlist_entries", {
    business_id: business.id,
    service_id: service.id,
    bookingDate: input.bookingDate,
    fullName: input.fullName,
    email: input.email,
    phone: input.phone || undefined,
    notified: false,
  });

  return entry.id;
}

