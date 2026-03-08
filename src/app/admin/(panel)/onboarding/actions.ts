"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getBrandingPalette } from "@/constants/branding-palettes";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { saveBrandingImageUpload } from "@/server/branding-upload";
import { setLocalActiveBusinessSlug } from "@/server/local-admin-context";
import {
  createLocalBusinessFromTemplate,
  getLocalAdminSettingsData,
  updateLocalBusiness,
  updateLocalBusinessBranding,
} from "@/server/local-store";

const onboardingSchema = z.object({
  templateSlug: z.string().min(1),
  name: z.string().min(3).max(120),
  slug: z.string().max(120).optional(),
  phone: z.string().min(6).max(40),
  email: z.union([z.string().email(), z.literal("")]).optional(),
  address: z.string().min(4).max(160),
});

const colorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color invalido.");

const onboardingBrandingSchema = z.object({
  businessSlug: z.string().min(2),
  badge: z.string().min(3).max(80),
  eyebrow: z.string().min(3).max(120),
  headline: z.string().min(12).max(160),
  description: z.string().min(20).max(320),
  primaryCta: z.string().min(2).max(40),
  secondaryCta: z.string().min(2).max(40),
  palette: z.string().min(2).max(40),
  customAccent: z.string().optional(),
  customAccentSoft: z.string().optional(),
  customSurfaceTint: z.string().optional(),
  instagram: z.string().max(80).optional(),
  facebook: z.string().max(120).optional(),
  tiktok: z.string().max(120).optional(),
  website: z.string().max(180).optional(),
  mapQuery: z.string().max(200).optional(),
});

async function saveOptionalImage(input: {
  formData: FormData;
  key: string;
  businessSlug: string;
  kind: string;
}) {
  return saveBrandingImageUpload({
    file: input.formData.get(input.key),
    businessSlug: input.businessSlug,
    kind: input.kind,
  });
}

type UpdateOnboardedBusinessResult = {
  businessSlug: string;
  name: string;
};

type SaveOnboardingBrandingResult = {
  businessSlug: string;
  message: string;
};

async function updateOnboardedBusiness(formData: FormData): Promise<UpdateOnboardedBusinessResult> {
  if (isSupabaseConfigured()) {
    throw new Error("El onboarding local solo esta disponible en modo demo por ahora.");
  }

  const businessSlug = String(formData.get("businessSlug") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();

  if (!businessSlug || !name || !phone || !address) {
    throw new Error("Completa los datos requeridos del negocio.");
  }

  await updateLocalBusiness({
    businessSlug,
    name,
    phone,
    email,
    address,
  });

  revalidatePath("/admin/onboarding");
  revalidatePath(`/${businessSlug}`);

  return {
    businessSlug,
    name,
  };
}

async function saveOnboardingBranding(formData: FormData): Promise<SaveOnboardingBrandingResult> {
  if (isSupabaseConfigured()) {
    throw new Error("La version productiva del onboarding se conecta al cerrar el bloque live.");
  }

  const businessSlug = String(formData.get("businessSlug") ?? "").trim();

  if (!businessSlug) {
    throw new Error("Negocio invalido.");
  }

  let uploadedLogoUrl: string | null = null;
  let uploadedHeroUrl: string | null = null;
  const uploadedGalleryUrls: Array<string | null> = [];

  uploadedLogoUrl = await saveOptionalImage({
    formData,
    key: "logoFile",
    businessSlug,
    kind: "logo",
  });
  uploadedHeroUrl = await saveOptionalImage({
    formData,
    key: "heroFile",
    businessSlug,
    kind: "hero",
  });
  for (let index = 1; index <= 3; index += 1) {
    uploadedGalleryUrls.push(
      await saveOptionalImage({
        formData,
        key: `galleryFile${index}`,
        businessSlug,
        kind: `gallery-${index}`,
      })
    );
  }
  const galleryDescriptions = Array.from({ length: 3 }, (_, index) =>
    String(formData.get(`galleryAlt${index + 1}`) ?? "").trim()
  );

  const raw = {
    businessSlug,
    badge: String(formData.get("badge") ?? "").trim(),
    eyebrow: String(formData.get("eyebrow") ?? "").trim(),
    headline: String(formData.get("headline") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    primaryCta: String(formData.get("primaryCta") ?? "").trim(),
    secondaryCta: String(formData.get("secondaryCta") ?? "").trim(),
    palette: String(formData.get("palette") ?? "").trim(),
    customAccent: String(formData.get("customAccent") ?? "").trim(),
    customAccentSoft: String(formData.get("customAccentSoft") ?? "").trim(),
    customSurfaceTint: String(formData.get("customSurfaceTint") ?? "").trim(),
    instagram: String(formData.get("instagram") ?? "").trim(),
    facebook: String(formData.get("facebook") ?? "").trim(),
    tiktok: String(formData.get("tiktok") ?? "").trim(),
    website: String(formData.get("website") ?? "").trim(),
    mapQuery: String(formData.get("mapQuery") ?? "").trim(),
  };

  const parsed = onboardingBrandingSchema.safeParse(raw);

  if (!parsed.success) {
    throw new Error("Revisa colores, textos e imagenes antes de guardar identidad.");
  }

  const settings = await getLocalAdminSettingsData(parsed.data.businessSlug);
  const profile = settings.profile;
  const palette =
    parsed.data.palette === "custom"
      ? {
          accent: colorSchema.parse(parsed.data.customAccent),
          accentSoft: colorSchema.parse(parsed.data.customAccentSoft),
          surfaceTint: colorSchema.parse(parsed.data.customSurfaceTint),
        }
      : getBrandingPalette(parsed.data.palette);
  const nextGallery = Array.from({ length: 3 }, (_, index) => {
    const existingItem = profile.gallery?.[index] ?? null;
    const url = uploadedGalleryUrls[index] || existingItem?.url || null;

    if (!url) {
      return null;
    }

    return {
      url,
      alt:
        galleryDescriptions[index] ||
        existingItem?.alt ||
        `Foto ${index + 1} de ${settings.businessName}`,
    };
  }).filter(
    (
      item
    ): item is {
      url: string;
      alt: string;
    } => Boolean(item)
  );

  await updateLocalBusinessBranding({
    businessSlug: parsed.data.businessSlug,
    badge: parsed.data.badge,
    eyebrow: parsed.data.eyebrow,
    headline: parsed.data.headline,
    description: parsed.data.description,
    primaryCta: parsed.data.primaryCta,
    secondaryCta: parsed.data.secondaryCta,
    instagram: parsed.data.instagram ?? profile.instagram ?? "",
    facebook: parsed.data.facebook || profile.facebook,
    tiktok: parsed.data.tiktok || profile.tiktok,
    accent: palette.accent,
    accentSoft: palette.accentSoft,
    surfaceTint: palette.surfaceTint,
    trustPoints: profile.trustPoints,
    benefits: profile.benefits,
    policies: profile.policies,
    website: parsed.data.website || profile.website,
    logoLabel: profile.logoLabel,
    logoUrl: uploadedLogoUrl || profile.logoUrl,
    heroImageUrl: uploadedHeroUrl || profile.heroImageUrl,
    heroImageAlt: profile.heroImageAlt,
    gallery: nextGallery.length > 0 ? nextGallery : profile.gallery,
    mapQuery: parsed.data.mapQuery || profile.mapQuery || settings.address,
    mapEmbedUrl: profile.mapEmbedUrl,
  });

  revalidatePath("/admin/onboarding");
  revalidatePath(`/${businessSlug}`);

  return {
    businessSlug,
    message: "Identidad visual actualizada.",
  };
}

export async function createOnboardedBusinessAction(formData: FormData) {
  if (isSupabaseConfigured()) {
    redirect(
      `/admin/onboarding?error=${encodeURIComponent(
        "El onboarding local solo esta disponible en modo demo por ahora."
      )}`
    );
  }

  const raw = {
    templateSlug: String(formData.get("templateSlug") ?? ""),
    name: String(formData.get("name") ?? "").trim(),
    slug: String(formData.get("slug") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim(),
  };

  const parsed = onboardingSchema.safeParse(raw);

  if (!parsed.success) {
    redirect(
      `/admin/onboarding?error=${encodeURIComponent(
        "Completa los datos basicos para crear el negocio."
      )}`
    );
  }

  let businessSlug: string;

  try {
    businessSlug = await createLocalBusinessFromTemplate({
      ...parsed.data,
      slug: parsed.data.slug ?? "",
      email: parsed.data.email ?? "",
    });
  } catch (error) {
    redirect(
      `/admin/onboarding?error=${encodeURIComponent(
        error instanceof Error ? error.message : "No se pudo crear el negocio."
      )}`
    );
  }

  await setLocalActiveBusinessSlug(businessSlug);
  redirect(`/admin/onboarding?created=${businessSlug}`);
}

export async function activateLocalBusinessAction(formData: FormData) {
  const businessSlug = String(formData.get("businessSlug") ?? "").trim();

  if (!businessSlug) {
    redirect(`/admin/onboarding?error=${encodeURIComponent("Negocio invalido.")}`);
  }

  await setLocalActiveBusinessSlug(businessSlug);
  redirect("/admin/dashboard");
}

export async function updateOnboardedBusinessAction(formData: FormData) {
  try {
    const result = await updateOnboardedBusiness(formData);
    redirect(`/admin/onboarding?businessUpdated=${encodeURIComponent(result.name)}`);
  } catch (error) {
    redirect(
      `/admin/onboarding?error=${encodeURIComponent(
        error instanceof Error ? error.message : "No se pudo actualizar el negocio."
      )}`
    );
  }
}

export async function saveOnboardingBrandingAction(formData: FormData) {
  try {
    const result = await saveOnboardingBranding(formData);
    redirect(
      `/admin/onboarding?brandingSaved=${encodeURIComponent(result.message)}`
    );
  } catch (error) {
    redirect(
      `/admin/onboarding?error=${encodeURIComponent(
        error instanceof Error ? error.message : "No se pudo guardar la identidad."
      )}`
    );
  }
}

export async function updateOnboardedBusinessInlineAction(formData: FormData) {
  return updateOnboardedBusiness(formData);
}

export async function saveOnboardingBrandingInlineAction(formData: FormData) {
  return saveOnboardingBranding(formData);
}
