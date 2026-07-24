"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ManualBookingForm } from "./manual-booking-form";
import type { ServiceSummary } from "@/types/domain";

export function ManualBookingWrapper({ services }: { services: ServiceSummary[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const show = searchParams.get("nuevo") === "1";

  if (!show) return null;

  function handleClose() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("nuevo");
    const qs = params.toString();
    router.push(qs ? `/admin/bookings?${qs}` : "/admin/bookings");
  }

  return <ManualBookingForm services={services} onClose={handleClose} />;
}
