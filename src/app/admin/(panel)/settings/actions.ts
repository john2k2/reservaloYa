"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { saveBrandingImageUpload } from "@/server/branding-upload";
import { getLocalActiveBusinessSlug } from "@/server/local-admin-context";
import { updateLocalBusinessBranding } from "@/server/local-store";

const colorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color invalido.");

const brandingSchema = z.object({
  businessSlug: z.string().min(2),
  badge: z.string().min(3).max(80),
  eyebrow: z.string().min(3).max(120),
  headline: z.string().min(12).max(160),
  description: z.string().min(20).max(320),
  primaryCta: z.string().min(2).max(40),
  secondaryCta: z.string().min(2).max(40),
  instagram: z.string().max(80).optional(),
  accent: colorSchema,
  accentSoft: colorSchema,
  surfaceTint: colorSchema,
  trustPoints: z.string().min(3),
  benefits: z.string().min(3),
  policies: z.string().min(3),
  facebook: z.string().max(120).optional(),
  tiktok: z.string().max(120).optional(),
  website: z.string().max(180).optional(),
  logoLabel: z.string().max(24).optional(),
  logoUrl: z.string().max(400).optional(),
  heroImageUrl: z.string().max(400).optional(),
  heroImageAlt: z.string().max(120).optional(),
  gallery: z.string().max(4000).optional(),
  mapQuery: z.string().max(200).optional(),
  mapEmbedUrl: z.string().max(400).optional(),
});

function toList(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 6);
}

function toGallery(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [rawUrl, rawAlt] = line.split("|");
      const url = rawUrl?.trim() ?? "";
      const alt = rawAlt?.trim() || `Imagen ${index + 1}`;

      return { url, alt };
    })
    .filter((item) => Boolean(item.url))
    .slice(0, 8);
}

export async function updateBrandingAction(formData: FormData) {
  if (isSupabaseConfigured()) {
    redirect(
      `/admin/settings?error=${encodeURIComponent(
        "La edicion de branding en produccion se conectara cuando terminemos la version live."
      )}`
    );
  }

  const activeBusinessSlug = await getLocalActiveBusinessSlug();
  const businessSlug = String(formData.get("businessSlug") ?? activeBusinessSlug ?? "").trim();

  if (!businessSlug) {
    redirect(`/admin/settings?error=${encodeURIComponent("Negocio invalido.")}`);
  }

  let uploadedLogoUrl: string | null = null;
  let uploadedHeroUrl: string | null = null;

  try {
    uploadedLogoUrl = await saveBrandingImageUpload({
      file: formData.get("logoFile"),
      businessSlug,
      kind: "logo",
    });
    uploadedHeroUrl = await saveBrandingImageUpload({
      file: formData.get("heroFile"),
      businessSlug,
      kind: "hero",
    });
  } catch (error) {
    redirect(
      `/admin/settings?error=${encodeURIComponent(
        error instanceof Error ? error.message : "No se pudo subir la imagen."
      )}`
    );
  }

  const raw = {
    businessSlug,
    badge: String(formData.get("badge") ?? "").trim(),
    eyebrow: String(formData.get("eyebrow") ?? "").trim(),
    headline: String(formData.get("headline") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    primaryCta: String(formData.get("primaryCta") ?? "").trim(),
    secondaryCta: String(formData.get("secondaryCta") ?? "").trim(),
    instagram: String(formData.get("instagram") ?? "").trim(),
    accent: String(formData.get("accent") ?? "").trim(),
    accentSoft: String(formData.get("accentSoft") ?? "").trim(),
    surfaceTint: String(formData.get("surfaceTint") ?? "").trim(),
    trustPoints: String(formData.get("trustPoints") ?? "").trim(),
    benefits: String(formData.get("benefits") ?? "").trim(),
    policies: String(formData.get("policies") ?? "").trim(),
    facebook: String(formData.get("facebook") ?? "").trim(),
    tiktok: String(formData.get("tiktok") ?? "").trim(),
    website: String(formData.get("website") ?? "").trim(),
    logoLabel: String(formData.get("logoLabel") ?? "").trim(),
    logoUrl: uploadedLogoUrl ?? String(formData.get("logoUrl") ?? "").trim(),
    heroImageUrl: uploadedHeroUrl ?? String(formData.get("heroImageUrl") ?? "").trim(),
    heroImageAlt: String(formData.get("heroImageAlt") ?? "").trim(),
    gallery: String(formData.get("gallery") ?? "").trim(),
    mapQuery: String(formData.get("mapQuery") ?? "").trim(),
    mapEmbedUrl: String(formData.get("mapEmbedUrl") ?? "").trim(),
  };

  const parsed = brandingSchema.safeParse(raw);

  if (!parsed.success) {
    redirect(
      `/admin/settings?error=${encodeURIComponent(
        "Revisa branding, colores y textos antes de guardar."
      )}`
    );
  }

  try {
    await updateLocalBusinessBranding({
      ...parsed.data,
      instagram: parsed.data.instagram ?? "",
      trustPoints: toList(parsed.data.trustPoints),
      benefits: toList(parsed.data.benefits),
      policies: toList(parsed.data.policies),
      facebook: parsed.data.facebook,
      tiktok: parsed.data.tiktok,
      website: parsed.data.website,
      logoLabel: parsed.data.logoLabel,
      logoUrl: parsed.data.logoUrl,
      heroImageUrl: parsed.data.heroImageUrl,
      heroImageAlt: parsed.data.heroImageAlt,
      gallery: toGallery(parsed.data.gallery ?? ""),
      mapQuery: parsed.data.mapQuery,
      mapEmbedUrl: parsed.data.mapEmbedUrl,
    });
  } catch (error) {
    redirect(
      `/admin/settings?error=${encodeURIComponent(
        error instanceof Error ? error.message : "No se pudo guardar el branding."
      )}`
    );
  }

  redirect(`/admin/settings?saved=${encodeURIComponent("Branding actualizado.")}`);
}
