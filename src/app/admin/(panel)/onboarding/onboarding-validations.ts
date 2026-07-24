// Validaciones ad-hoc del wizard de onboarding (feedback inmediato en el cliente).
//
// No reusan los zod schemas de `actions.ts` (`onboardingSchema`, `updateBusinessSchema`,
// `onboardingBrandingSchema`) porque no son equivalentes: el schema server-side de `slug`
// no valida formato (regex ni longitud mínima), y `email` usa `z.string().email()` en vez
// de la regex simple de acá. Unificarlos cambiaría el comportamiento de validación
// observable (mensajes y momentos en que se muestran errores), así que se mantienen
// separadas a propósito. Ver reporte de la refactorización G2 para más contexto.

export const onboardingValidations = {
  name: (value: string) => {
    if (value.length < 3) return "Mínimo 3 caracteres";
    if (value.length > 120) return "Máximo 120 caracteres";
    return null;
  },
  slug: (value: string) => {
    if (!value) return null;
    if (!/^[a-z0-9-]+$/.test(value)) return "Solo letras minúsculas, números y guiones";
    if (value.length < 2) return "Mínimo 2 caracteres";
    if (value.length > 120) return "Máximo 120 caracteres";
    return null;
  },
  phone: (value: string) => {
    if (value.length < 6) return "Mínimo 6 caracteres";
    if (value.length > 40) return "Máximo 40 caracteres";
    return null;
  },
  email: (value: string) => {
    if (!value) return null;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Email inválido";
    return null;
  },
  address: (value: string) => {
    if (value.length < 4) return "Mínimo 4 caracteres";
    if (value.length > 160) return "Máximo 160 caracteres";
    return null;
  },
  badge: (value: string) => {
    if (value.length < 3) return "Mínimo 3 caracteres";
    if (value.length > 80) return "Máximo 80 caracteres";
    return null;
  },
  eyebrow: (value: string) => {
    if (value.length < 3) return "Mínimo 3 caracteres";
    if (value.length > 120) return "Máximo 120 caracteres";
    return null;
  },
  headline: (value: string) => {
    if (value.length < 12) return "Mínimo 12 caracteres";
    if (value.length > 160) return "Máximo 160 caracteres";
    return null;
  },
  description: (value: string) => {
    if (value.length < 20) return "Mínimo 20 caracteres";
    if (value.length > 320) return "Máximo 320 caracteres";
    return null;
  },
  cta: (value: string) => {
    if (value.length < 2) return "Mínimo 2 caracteres";
    if (value.length > 40) return "Máximo 40 caracteres";
    return null;
  },
};
