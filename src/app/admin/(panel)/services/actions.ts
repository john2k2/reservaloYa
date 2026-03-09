"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { z } from "zod";

import { isPocketBaseConfigured } from "@/lib/pocketbase/config";
import { getLocalActiveBusinessSlug } from "@/server/local-admin-context";
import {
  deactivateLocalService,
  getLocalAdminSettingsData,
  upsertLocalService,
} from "@/server/local-store";
import { getAuthenticatedPocketBaseUser } from "@/server/pocketbase-auth";
import {
  deactivatePocketBaseService,
  getPocketBaseAdminSettingsData,
  upsertPocketBaseService,
} from "@/server/pocketbase-store";

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
      throw new Error("Revisa nombre, duracion y precio antes de guardar.");
    }

    const context = await getServiceContext();

    if (context.live) {
      await upsertPocketBaseService({
        businessId: context.businessId,
        serviceId: parsed.data.serviceId,
        name: parsed.data.name,
        description: parsed.data.description,
        durationMinutes: parsed.data.durationMinutes,
        price: parsed.data.price,
        featured: parsed.data.featured,
        featuredLabel: parsed.data.featuredLabel,
      });
    } else {
      await upsertLocalService({
        businessSlug: context.businessSlug,
        serviceId: parsed.data.serviceId,
        name: parsed.data.name,
        description: parsed.data.description,
        durationMinutes: parsed.data.durationMinutes,
        price: parsed.data.price,
        featured: parsed.data.featured,
        featuredLabel: parsed.data.featuredLabel,
      });
    }

    revalidateServiceViews(context.businessSlug);

    redirect(`/admin/services?saved=${encodeURIComponent(parsed.data.name)}`);
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

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

    if (context.live) {
      await deactivatePocketBaseService({
        businessId: context.businessId,
        serviceId,
      });
    } else {
      await deactivateLocalService({
        businessSlug: context.businessSlug,
        serviceId,
      });
    }

    revalidateServiceViews(context.businessSlug);

    redirect(`/admin/services?archived=${encodeURIComponent(serviceName)}`);
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    redirect(
      `/admin/services?error=${encodeURIComponent(
        error instanceof Error ? error.message : "No se pudo desactivar el servicio."
      )}`
    );
  }
}
