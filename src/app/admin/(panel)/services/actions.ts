"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { z } from "zod";

import { getAuthenticatedSupabaseUser } from "@/server/supabase-auth";
import {
  createSupabaseRecord,
  getSupabaseRecord,
  listSupabaseRecords,
  updateSupabaseRecord,
} from "@/server/supabase-store/_core";
import { countFeaturedRecords, isActiveRecord } from "@/server/supabase-domain";
import type { ServiceRecord } from "@/server/supabase-domain";

const serviceSchema = z.object({
  serviceId: z.string().trim().optional(),
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(240),
  durationMinutes: z.coerce.number().int().min(5).max(480),
  price: z.number().int().min(0).nullable(),
  featured: z.boolean(),
  featuredLabel: z.string().trim().max(24),
});

async function getServiceContext() {
  const user = await getAuthenticatedSupabaseUser();

  if (!user?.businessId) {
    throw new Error("No encontramos el negocio activo.");
  }

  return {
    businessId: user.businessId,
    businessSlug: user.businessSlug ?? "",
  };
}

async function upsertSupabaseService(input: {
  businessId: string;
  serviceId?: string;
  name: string;
  description: string;
  durationMinutes: number;
  price: number | null;
  featured: boolean;
  featuredLabel: string;
}) {
  const existingServices = await listSupabaseRecords<ServiceRecord>("services", {
    filter: `business_id=eq.${input.businessId}`,
  });

  const activeServices = existingServices.filter(isActiveRecord);
  const duplicateService = activeServices.find(
    (service) =>
      service.id !== input.serviceId &&
      service.name.trim().toLocaleLowerCase("es-AR") ===
        input.name.trim().toLocaleLowerCase("es-AR")
  );

  if (duplicateService) {
    throw new Error("Ya existe un servicio activo con ese nombre.");
  }

  if (input.featured && countFeaturedRecords(activeServices, input.serviceId) >= 3) {
    throw new Error("Puedes destacar hasta 3 servicios activos.");
  }

  if (input.serviceId) {
    const existingService = await getSupabaseRecord<ServiceRecord>("services", input.serviceId);

    if (existingService.business_id !== input.businessId || !isActiveRecord(existingService)) {
      throw new Error("No encontramos el servicio a editar.");
    }

    await updateSupabaseRecord("services", input.serviceId, {
      name: input.name,
      description: input.description,
      durationMinutes: input.durationMinutes,
      price: input.price,
      featured: input.featured,
      featuredLabel: input.featured ? input.featuredLabel : "",
    });

    return input.serviceId;
  }

  const createdService = await createSupabaseRecord<ServiceRecord>("services", {
    business_id: input.businessId,
    name: input.name,
    description: input.description,
    durationMinutes: input.durationMinutes,
    price: input.price ?? undefined,
    featured: input.featured,
    featuredLabel: input.featured ? input.featuredLabel : "",
    active: true,
  });

  return createdService.id;
}

async function deactivateSupabaseService(input: {
  businessId: string;
  serviceId: string;
}) {
  const existingService = await getSupabaseRecord<ServiceRecord>("services", input.serviceId);

  if (existingService.business_id !== input.businessId || !isActiveRecord(existingService)) {
    throw new Error("No encontramos el servicio a desactivar.");
  }

  await updateSupabaseRecord("services", input.serviceId, {
    active: false,
  });

  return input.serviceId;
}

function parsePriceValue(rawValue: FormDataEntryValue | null) {
  const value = String(rawValue ?? "").trim();

  if (!value) {
    return null;
  }

  const normalizedValue = value.replace(/\./g, "").replace(",", ".");

  if (!/^\d+(\.\d{1,2})?$/.test(normalizedValue)) {
    throw new Error("El precio debe ser un numero valido.");
  }

  return Math.round(Number(normalizedValue));
}

function revalidateServiceViews(businessSlug: string) {
  revalidatePath("/admin/services");
  revalidatePath("/admin/bookings");
  revalidatePath(`/${businessSlug}`);
  revalidatePath(`/${businessSlug}/reservar`);
}

export async function saveServiceAction(formData: FormData) {
  try {
    const parsed = serviceSchema.safeParse({
      serviceId: String(formData.get("serviceId") ?? "").trim() || undefined,
      name: String(formData.get("name") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      durationMinutes: formData.get("durationMinutes"),
      price: parsePriceValue(formData.get("price")),
      featured: formData.get("featured") === "on",
      featuredLabel: String(formData.get("featuredLabel") ?? "").trim(),
    });

    if (!parsed.success) {
      throw new Error("Revisa nombre, duración y precio antes de guardar.");
    }

    const context = await getServiceContext();

    await upsertSupabaseService({
      businessId: context.businessId,
      serviceId: parsed.data.serviceId,
      name: parsed.data.name,
      description: parsed.data.description,
      durationMinutes: parsed.data.durationMinutes,
      price: parsed.data.price,
      featured: parsed.data.featured,
      featuredLabel: parsed.data.featuredLabel,
    });

    revalidateServiceViews(context.businessSlug);

    redirect(`/admin/services?saved=${encodeURIComponent(parsed.data.name)}`);
  } catch (error) {
    unstable_rethrow(error);

    redirect(
      `/admin/services?error=${encodeURIComponent(
        error instanceof Error ? error.message : "No se pudo guardar el servicio."
      )}`
    );
  }
}

export async function deactivateServiceAction(formData: FormData) {
  const serviceId = String(formData.get("serviceId") ?? "").trim();
  const serviceName = String(formData.get("serviceName") ?? "").trim() || "Servicio";

  if (!serviceId) {
    redirect(`/admin/services?error=${encodeURIComponent("Servicio invalido.")}`);
  }

  try {
    const context = await getServiceContext();

    await deactivateSupabaseService({
      businessId: context.businessId,
      serviceId,
    });

    revalidateServiceViews(context.businessSlug);

    redirect(`/admin/services?archived=${encodeURIComponent(serviceName)}`);
  } catch (error) {
    unstable_rethrow(error);

    redirect(
      `/admin/services?error=${encodeURIComponent(
        error instanceof Error ? error.message : "No se pudo desactivar el servicio."
      )}`
    );
  }
}
