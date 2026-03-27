"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { z } from "zod";

import { isPocketBaseConfigured } from "@/lib/pocketbase/config";
import { getLocalActiveBusinessSlug } from "@/server/local-admin-context";
import {
  getLocalAdminSettingsData,
  updateLocalAdminBooking,
  createLocalPublicBooking,
} from "@/server/local-store";
import { getAuthenticatedPocketBaseUser } from "@/server/pocketbase-auth";
import {
  getPocketBaseAdminSettingsData,
  updatePocketBaseAdminBooking,
  createPocketBasePublicBooking,
} from "@/server/pocketbase-store";

const bookingSchema = z.object({
  bookingId: z.string().trim().min(1),
  bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  status: z.enum(["pending", "confirmed", "completed", "cancelled", "no_show"]),
  notes: z.string().trim().max(400),
});

function buildBookingsRedirectPath(params: {
  saved?: string;
  error?: string;
  status?: string;
  date?: string;
  q?: string;
  nuevo?: string;
}) {
  const searchParams = new URLSearchParams();

  if (params.saved) {
    searchParams.set("saved", params.saved);
  }

  if (params.error) {
    searchParams.set("error", params.error);
  }

  if (params.status) {
    searchParams.set("status", params.status);
  }

  if (params.date) {
    searchParams.set("date", params.date);
  }

  if (params.q) {
    searchParams.set("q", params.q);
  }

  if (params.nuevo) {
    searchParams.set("nuevo", params.nuevo);
  }

  const queryString = searchParams.toString();
  return queryString ? `/admin/bookings?${queryString}` : "/admin/bookings";
}

async function getBookingContext() {
  if (isPocketBaseConfigured()) {
    const user = await getAuthenticatedPocketBaseUser();
    const businessId = Array.isArray(user?.business) ? user.business[0] : user?.business;

    if (!businessId) {
      throw new Error("No encontramos el negocio activo.");
    }

    const settings = await getPocketBaseAdminSettingsData(String(businessId));

    return {
      businessId: String(businessId),
      businessSlug: settings.businessSlug,
      live: true as const,
    };
  }

  const activeBusinessSlug = await getLocalActiveBusinessSlug();
  const settings = await getLocalAdminSettingsData(activeBusinessSlug);

  return {
    businessSlug: settings.businessSlug,
    live: false as const,
  };
}

function revalidateBookingViews(businessSlug: string) {
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/dashboard");
  revalidatePath(`/${businessSlug}`);
}

const manualBookingSchema = z.object({
  serviceId: z.string().trim().min(1, "Seleccioná un servicio."),
  bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida."),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida."),
  fullName: z.string().trim().min(2, "Ingresá el nombre del cliente.").max(80),
  phone: z.string().trim().max(30).default(""),
  email: z.string().trim().max(120).default(""),
  notes: z.string().trim().max(400).default(""),
});

export async function createManualBookingAction(formData: FormData) {
  try {
    const parsed = manualBookingSchema.safeParse({
      serviceId: String(formData.get("serviceId") ?? "").trim(),
      bookingDate: String(formData.get("bookingDate") ?? "").trim(),
      startTime: String(formData.get("startTime") ?? "").trim(),
      fullName: String(formData.get("fullName") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      notes: String(formData.get("notes") ?? "").trim(),
    });

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Revisá los campos.";
      throw new Error(firstError);
    }

    const context = await getBookingContext();

    if (context.live) {
      await createPocketBasePublicBooking({
        businessSlug: context.businessSlug,
        serviceId: parsed.data.serviceId,
        bookingDate: parsed.data.bookingDate,
        startTime: parsed.data.startTime,
        fullName: parsed.data.fullName,
        phone: parsed.data.phone,
        email: parsed.data.email,
        notes: parsed.data.notes,
        initialStatus: "confirmed",
      });
    } else {
      await createLocalPublicBooking({
        businessSlug: context.businessSlug,
        serviceId: parsed.data.serviceId,
        bookingDate: parsed.data.bookingDate,
        startTime: parsed.data.startTime,
        fullName: parsed.data.fullName,
        phone: parsed.data.phone,
        email: parsed.data.email,
        notes: parsed.data.notes,
        initialStatus: "confirmed",
      });
    }

    revalidateBookingViews(context.businessSlug);
    redirect(buildBookingsRedirectPath({ saved: "nuevo", date: parsed.data.bookingDate }));
  } catch (error) {
    unstable_rethrow(error);
    redirect(
      buildBookingsRedirectPath({
        error: error instanceof Error ? error.message : "No se pudo crear el turno.",
        nuevo: "1",
      })
    );
  }
}

export async function updateBookingAction(formData: FormData) {
  const filters = {
    status: String(formData.get("redirectStatus") ?? "").trim(),
    date: String(formData.get("redirectDate") ?? "").trim(),
    q: String(formData.get("redirectQ") ?? "").trim(),
  };

  try {
    const parsed = bookingSchema.safeParse({
      bookingId: String(formData.get("bookingId") ?? "").trim(),
      bookingDate: String(formData.get("bookingDate") ?? "").trim(),
      startTime: String(formData.get("startTime") ?? "").trim(),
      status: String(formData.get("status") ?? "").trim(),
      notes: String(formData.get("notes") ?? "").trim(),
    });

    if (!parsed.success) {
      throw new Error("Revisa el estado y las notas antes de guardar.");
    }

    const context = await getBookingContext();

    if (context.live) {
      await updatePocketBaseAdminBooking({
        businessId: context.businessId,
        bookingId: parsed.data.bookingId,
        bookingDate: parsed.data.bookingDate,
        startTime: parsed.data.startTime,
        status: parsed.data.status,
        notes: parsed.data.notes,
      });
    } else {
      await updateLocalAdminBooking({
        businessSlug: context.businessSlug,
        bookingId: parsed.data.bookingId,
        bookingDate: parsed.data.bookingDate,
        startTime: parsed.data.startTime,
        status: parsed.data.status,
        notes: parsed.data.notes,
      });
    }

    revalidateBookingViews(context.businessSlug);

    redirect(
      buildBookingsRedirectPath({
        saved: parsed.data.bookingId,
        ...filters,
      })
    );
  } catch (error) {
    unstable_rethrow(error);

    redirect(
      buildBookingsRedirectPath({
        error: error instanceof Error ? error.message : "No se pudo actualizar el turno.",
        ...filters,
      })
    );
  }
}
