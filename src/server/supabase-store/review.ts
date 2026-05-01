import { slugify } from "@/lib/utils";
import type { BookingRecord, BusinessRecord, ReviewRecord } from "@/server/supabase-domain";
import { getSupabaseAdminClient, createSupabaseRecord } from "./_core";
import type { JoinedBookingConfirmation } from "./types";

export async function createSupabaseReview(input: {
  businessSlug: string;
  bookingId?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
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

  if (!input.bookingId) {
    throw new Error("No encontramos el turno.");
  }

  const { data: existingData } = await client
    .from("reviews")
    .select("id")
    .eq("business_id", business.id)
    .eq("booking_id", input.bookingId)
    .limit(1);

  if (existingData && existingData.length > 0) {
    return existingData[0].id;
  }

  const { data: bookingData, error: bookingError } = await client
    .from("bookings")
    .select("*, service:services(*), customer:customers(*), business:businesses(*)")
    .eq("id", input.bookingId)
    .single();

  if (bookingError || !bookingData) {
    throw new Error("No encontramos el turno.");
  }

  const booking = bookingData as JoinedBookingConfirmation;
  const bookingBusiness = booking.business;
  const service = booking.service;
  const customer = booking.customer;

  if (!booking || !bookingBusiness || bookingBusiness.slug !== normalizedSlug) {
    throw new Error("No encontramos el turno.");
  }

  if (booking.status !== "completed") {
    throw new Error("Solo podes dejar una reseña despues de completar el turno.");
  }

  const review = await createSupabaseRecord<ReviewRecord>("reviews", {
    business_id: business.id,
    booking_id: input.bookingId,
    service_id: service?.id || booking.service_id,
    customerName: customer?.fullName ?? "Cliente",
    rating: input.rating,
    comment: input.comment || undefined,
  });

  return review.id;
}

