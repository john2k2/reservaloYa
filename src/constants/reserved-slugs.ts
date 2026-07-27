import { seoLandingPages } from "./seo-landing-pages";

/**
 * La página pública de cada negocio vive en el catch-all `(public)/[slug]` a nivel raíz,
 * así que cualquier ruta estática del sitio le gana al slug de un negocio. Si un dueño
 * reserva "precios", su página queda inalcanzable para siempre (Next sirve la de marketing).
 *
 * Esta es la única fuente de verdad de esos segmentos: la usa la validación del signup para
 * rechazarlos y el script de tema en `app/layout.tsx` para saber si está pintando una página
 * de negocio o una propia de ReservaYa.
 */
const appRouteSegments = [
  // Rutas de aplicación (src/app/*)
  "admin",
  "api",
  "auth",
  "consulta",
  "login",
  "platform",
  // Marketing e institucionales
  "como-funciona",
  "contacto",
  "funcionalidades",
  "precios",
  "preguntas-frecuentes",
  "privacidad",
  "sobre-reservaya",
  "terminos",
  // Orígenes de redirect declarados en next.config.ts
  "about",
  "dashboard",
  "panel",
  // Archivos servidos desde la raíz
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  "site.webmanifest",
] as const;

export const reservedSlugs: readonly string[] = [
  ...appRouteSegments,
  // Las landing por rubro se agregan solas: son parte del mismo espacio de nombres
  // y crecen con el tiempo, así que derivarlas evita que esta lista quede vieja.
  ...seoLandingPages.map((page) => page.slug),
];

const reservedSlugSet = new Set(reservedSlugs);

export function isReservedSlug(value: string): boolean {
  return reservedSlugSet.has(value.trim().toLowerCase());
}
