export type DarkModeColors = {
  accent: string;
  accentSoft: string;
  surfaceTint: string;
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
};

export type PublicPageSectionLayout = {
  mobileGalleryItems: number;
  mobileServiceCards: number;
  mobileTestimonials: number;
  mobileFaqItems: number;
  mobilePolicyItems: number;
};

export type PublicBusinessProfile = {
  templateKey: string;
  badge: string;
  eyebrow: string;
  headline: string;
  description: string;
  primaryCta: string;
  secondaryCta: string;
  accent: string;
  accentSoft: string;
  surfaceTint: string;
  enableDarkMode: boolean;
  darkModeColors?: DarkModeColors;
  sectionLayout: PublicPageSectionLayout;
  benefits: string[];
  trustPoints: string[];
  testimonials: Array<{
    quote: string;
    author: string;
    detail: string;
    avatar?: string;
  }>;
  faqs: Array<{
    question: string;
    answer: string;
  }>;
  policies: string[];
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  website?: string;
  logoLabel?: string;
  logoUrl?: string | null;
  heroImageUrl?: string | null;
  heroImageAlt?: string;
  gallery?: Array<{
    url: string;
    alt: string;
  }> | null;
  instagramGallery?: string[] | null;
  mapQuery?: string;
  mapEmbedUrl?: string;
};

type PublicTemplatePreset = Omit<PublicBusinessProfile, "logoUrl">;

const defaultSectionLayout: PublicPageSectionLayout = {
  mobileGalleryItems: 2,
  mobileServiceCards: 3,
  mobileTestimonials: 1,
  mobileFaqItems: 2,
  mobilePolicyItems: 2,
};

const templatePresets: Record<string, PublicTemplatePreset> = {
  "demo-barberia": {
    templateKey: "demo-barberia",
    badge: "Barbería de barrio premium",
    eyebrow: "Reserva online en segundos",
    headline: "Cortes y barba con turnos claros.",
    description:
      "Sin mensajes de WhatsApp cruzados. Elige tu servicio, día y horario. Confirmación inmediata con acceso para reprogramar o cancelar.",
    primaryCta: "Reservar turno",
    secondaryCta: "Soporte por WhatsApp",
    accent: "#8F6A3A",
    accentSoft: "#E8DCCB",
    surfaceTint: "#F6F1EA",
    enableDarkMode: false,
    sectionLayout: defaultSectionLayout,
    benefits: [
      "Turnos cortos y bien ordenados para evitar pisadas.",
      "Confirmación inmediata con acceso para reprogramar o cancelar.",
      "Experiencia simple para clientes que reservan desde el celular.",
    ],
    trustPoints: ["Atención puntual", "Ubicación en Palermo", "Horarios visibles antes de reservar"],
    testimonials: [
      {
        quote: "Antes respondía lo mismo todo el día. Ahora la mayoría entra, reserva y listo.",
        author: "Matías Gómez",
        detail: "Barbero independiente",
        avatar:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
      },
      {
        quote: "La página se entiende en segundos y mis clientes no se pierden con el proceso.",
        author: "Luca Sosa",
        detail: "Cliente frecuente",
        avatar:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face",
      },
    ],
    faqs: [
      {
        question: "¿Cuánto tarda la reserva?",
        answer: "Menos de un minuto: eliges servicio, día, horario y confirmas.",
      },
      {
        question: "¿Puedo cambiar el turno después?",
        answer: "Sí. Cada reserva deja un link para ver, reprogramar o cancelar el turno.",
      },
      {
        question: "¿Atienden solo con reserva?",
        answer:
          "La pagina esta pensada para priorizar reservas, pero tambien puede convivir con turnos espontaneos.",
      },
    ],
    policies: [
      "Se recomienda llegar 5 minutos antes del horario.",
      "La cancelación sin costo se puede hacer desde el link del turno.",
      "Si llegas muy tarde, el negocio puede ajustar la duración del servicio.",
    ],
    instagram: "@barberia.libertador",
    facebook: "barberia.libertador",
    tiktok: "@barberia.libertador",
    website: "https://barberialibertador.com.ar",
    heroImageUrl:
      "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1400&h=900&fit=crop",
    heroImageAlt: "Interior clásico de barbería con sillas vintage y espejos",
    gallery: [
      {
        url: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=1000&h=750&fit=crop",
        alt: "Barbero realizando un corte con tijeras",
      },
      {
        url: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=1000&h=750&fit=crop",
        alt: "Perfilado de barba con navaja tradicional",
      },
      {
        url: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1000&h=750&fit=crop",
        alt: "Sillón de barbería clásico y ambiente premium",
      },
    ],
    mapQuery: "Av. del Libertador 214, Palermo",
  },
  "demo-estetica": {
    templateKey: "demo-estetica",
    badge: "Estética y skincare",
    eyebrow: "Cabina reservada con una experiencia más cuidada",
    headline: "Sesiones de estética con agenda clara y una página que vende mejor.",
    description:
      "Una marca de estética puede verse más premium, ordenar su agenda y dar confianza antes de la primera visita con un flujo simple y claro.",
    primaryCta: "Quiero reservar",
    secondaryCta: "Soporte por WhatsApp",
    accent: "#A55D6F",
    accentSoft: "#F1D8DF",
    surfaceTint: "#FCF6F7",
    enableDarkMode: false,
    sectionLayout: {
      ...defaultSectionLayout,
      mobileGalleryItems: 2,
      mobileServiceCards: 3,
      mobileFaqItems: 2,
    },
    benefits: [
      "Presentación más cuidada para faciales, lifting y sesiones de cabina.",
      "Políticas claras y preguntas frecuentes visibles antes de reservar.",
      "Menos intercambio manual y más conversión desde Instagram o WhatsApp.",
    ],
    trustPoints: ["Sesión personalizada", "Cabina privada", "Reprogramación simple"],
    testimonials: [
      {
        quote: "La experiencia se siente más profesional desde antes de entrar al gabinete.",
        author: "Camila Duarte",
        detail: "Cliente nueva por Instagram",
      },
      {
        quote: "Tener horarios, políticas y FAQ visibles me ahorró muchísimas preguntas repetidas.",
        author: "Agustina Rey",
        detail: "Esteticista",
      },
    ],
    faqs: [
      {
        question: "¿Necesito prepararme antes de la sesión?",
        answer:
          "Depende del servicio. Si hace falta algo puntual, se puede aclarar en las notas o por WhatsApp.",
      },
      {
        question: "¿Cómo cambio el turno?",
        answer: "Desde el link de gestión que recibes al confirmar la reserva.",
      },
      {
        question: "¿Cuánto dura cada tratamiento?",
        answer: "Cada servicio muestra la duración estimada antes de confirmar el turno.",
      },
    ],
    policies: [
      "Si tienes sensibilidad o tratamiento dermatológico, avisa en las notas.",
      "La reprogramación se puede hacer desde el link del turno.",
      "Para tratamientos largos, la tolerancia recomendada es de 10 minutos.",
    ],
    instagram: "@aura.estetica.ba",
    facebook: "aura.estetica.ba",
    tiktok: "@aura.estetica.ba",
    website: "https://auraestetica.com.ar",
    heroImageUrl: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=1400&h=900&fit=crop",
    heroImageAlt: "Cabina de estética minimalista con tonos suaves",
    gallery: [
      {
        url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1000&h=700&fit=crop",
        alt: "Camilla de tratamiento y set de skincare",
      },
      {
        url: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=1000&h=700&fit=crop",
        alt: "Sesión facial con luz tenue y ambiente premium",
      },
      {
        url: "https://images.unsplash.com/photo-1503236823255-94609f598e71?w=1000&h=700&fit=crop",
        alt: "Recepción de centro estético con branding",
      },
    ],
    mapQuery: "Honduras 4821, Palermo",
  },
  "demo-nails": {
    templateKey: "demo-nails",
    badge: "Nails studio boutique",
    eyebrow: "Turnos prolijos para manicura y belleza de manos",
    headline: "Reservas claras para manos, semipermanente y beauty express.",
    description:
      "Pensada para estudios de uñas que venden mucho por Instagram pero necesitan ordenar agenda, tiempos y reprogramaciones.",
    primaryCta: "Reservar manicure",
    secondaryCta: "Soporte por WhatsApp",
    accent: "#B86C8B",
    accentSoft: "#F3DDE6",
    surfaceTint: "#FDF7F9",
    enableDarkMode: false,
    sectionLayout: {
      ...defaultSectionLayout,
      mobileServiceCards: 3,
    },
    benefits: [
      "Servicios visuales y tiempos claros antes de reservar.",
      "Más orden para cabina, horarios y reprogramaciones.",
      "Una página que acompaña mejor el tráfico desde Instagram.",
    ],
    trustPoints: ["Diseños visibles", "Duración clara", "Agenda ordenada"],
    testimonials: [
      {
        quote: "Se entiende rápido qué elegir y cuánto tarda cada servicio.",
        author: "Sofía M.",
        detail: "Cliente recurrente",
      },
      {
        quote: "Me sirve ver la duración antes de reservar y reprogramar sin escribir tanto.",
        author: "Valentina N.",
        detail: "Cliente nueva por Instagram",
      },
    ],
    faqs: [
      {
        question: "¿Puedo elegir diseño después?",
        answer: "Sí. La reserva sirve para asegurar el horario y luego se termina de definir el detalle por WhatsApp si hace falta.",
      },
      {
        question: "¿Se puede sumar retiro de esmaltado?",
        answer: "Sí. El negocio puede dejarlo aclarado en el servicio o tomarlo como detalle adicional al confirmar.",
      },
      {
        question: "¿Cuánto tarda cada turno?",
        answer: "Cada servicio muestra su duración estimada antes de reservar para evitar malentendidos.",
      },
    ],
    policies: [
      "Si vienes con otro esmaltado, avísalo al reservar.",
      "Para nail art complejo conviene dejar una nota breve en la reserva.",
      "Si necesitas cambiar el turno, hazlo desde el link de gestión para no perder el horario.",
    ],
    instagram: "@nudenails.studio",
    tiktok: "@nudenails.studio",
    website: "https://nudenailsstudio.com",
    heroImageUrl: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=1400&h=900&fit=crop",
    heroImageAlt: "Mesa de manicura con herramientas y tonos suaves",
    gallery: [
      {
        url: "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=1000&h=700&fit=crop",
        alt: "Mesa de trabajo para manicure",
      },
      {
        url: "https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=1000&h=700&fit=crop",
        alt: "Set de uñas semipermanentes y colores",
      },
      {
        url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1000&h=700&fit=crop",
        alt: "Detalle de manicura prolija con acabado brillante",
      },
    ],
    mapQuery: "Gorriti 5172, Palermo",
  },
  "demo-consultorio": {
    templateKey: "demo-consultorio",
    badge: "Consultorio con agenda ordenada",
    eyebrow: "Turnos claros para consulta y seguimiento",
    headline: "Menos llamados para coordinar y más claridad antes de cada consulta.",
    description:
      "Una plantilla orientada a profesionales que necesitan transmitir confianza, ubicación y horarios sin depender del ida y vuelta manual.",
    primaryCta: "Reservar consulta",
    secondaryCta: "Soporte por WhatsApp",
    accent: "#3D6B85",
    accentSoft: "#D9E8EF",
    surfaceTint: "#F5FAFC",
    enableDarkMode: false,
    sectionLayout: {
      ...defaultSectionLayout,
      mobileGalleryItems: 2,
      mobileServiceCards: 3,
      mobileTestimonials: 1,
    },
    benefits: [
      "Información clara para primera consulta y seguimiento.",
      "Menos fricción para cambiar o cancelar turnos.",
      "Mejor presentación profesional desde la página pública.",
    ],
    trustPoints: ["Consulta clara", "Ubicación visible", "Reprogramación simple"],
    testimonials: [
      {
        quote: "Me dio mucha más confianza ver todo claro antes de reservar.",
        author: "Martín Quiroga",
        detail: "Primera consulta",
      },
      {
        quote: "Poder reprogramar sin llamar al consultorio me resolvió todo en segundos.",
        author: "Lucía Ferrer",
        detail: "Seguimiento",
      },
    ],
    faqs: [
      {
        question: "¿Qué necesito llevar?",
        answer: "El negocio puede usar este bloque para anticipar estudios, obras sociales o documentación necesaria.",
      },
      {
        question: "¿Cómo cambio o cancelo el turno?",
        answer: "Desde el link de gestión que recibes al confirmar la reserva, sin llamar al consultorio.",
      },
      {
        question: "¿Cuánto dura cada consulta?",
        answer: "Cada servicio muestra su duración estimada antes de confirmar el horario.",
      },
    ],
    policies: [
      "Si es una urgencia, usar canales directos y no la agenda online.",
      "Si traes estudios o análisis, menciónalo en las notas de la reserva.",
      "La reprogramación se puede hacer desde el link del turno sin costo.",
    ],
    instagram: "@consultorionorte.ba",
    website: "https://consultorionorte.com.ar",
    heroImageUrl: "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=1400&h=900&fit=crop",
    heroImageAlt: "Consultorio moderno con escritorio y luz natural",
    gallery: [
      {
        url: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1000&h=700&fit=crop",
        alt: "Recepción del consultorio",
      },
      {
        url: "https://images.unsplash.com/photo-1584515933487-779824d29309?w=1000&h=700&fit=crop",
        alt: "Consultorio con escritorio y atención profesional",
      },
    ],
    mapQuery: "Av. Cabildo 1847, Belgrano",
  },
};

function buildDefaultLogoLabel(businessName: string) {
  const initials = businessName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return initials || "RY";
}

export function getPublicBusinessProfile(
  slug: string,
  businessName: string,
  templateSlug?: string
): PublicBusinessProfile {
  const resolvedTemplateKey = templateSlug ?? slug;
  const preset = templatePresets[resolvedTemplateKey];

  if (preset) {
    return {
      ...preset,
      logoLabel: preset.logoLabel ?? buildDefaultLogoLabel(businessName),
    };
  }

  return {
    templateKey: resolvedTemplateKey,
    badge: "Reservas online",
    eyebrow: "Agenda simple para negocios chicos",
    headline: `${businessName} ahora puede vender mejor sus turnos online.`,
    description:
      "Página pública clara, servicios visibles y una experiencia simple para convertir visitas en reservas.",
    primaryCta: "Reservar ahora",
    secondaryCta: "Soporte por WhatsApp",
    accent: "#1F2937",
    accentSoft: "#E5E7EB",
    surfaceTint: "#F9FAFB",
    enableDarkMode: false,
    sectionLayout: defaultSectionLayout,
    benefits: [
      "Servicios y horarios claros.",
      "Proceso simple desde el celular.",
      "Confirmación inmediata del turno.",
    ],
    trustPoints: ["Reserva simple", "Horarios visibles", "Gestión online del turno"],
    testimonials: [
      {
        quote: "La experiencia es más clara que tomar turnos solo por mensaje.",
        author: "Cliente demo",
        detail: "ReservaYa",
      },
    ],
    faqs: [
      {
        question: "¿Cómo funciona la reserva?",
        answer: "Eliges servicio, fecha, horario y confirmas tus datos.",
      },
    ],
    policies: ["La gestión del turno se hace desde el link recibido al confirmar."],
    logoLabel: buildDefaultLogoLabel(businessName),
    heroImageUrl: "https://picsum.photos/seed/reservaya-generic-hero/1400/900",
    heroImageAlt: `Vista principal de ${businessName}`,
    gallery: [
      {
        url: "https://picsum.photos/seed/reservaya-generic-gallery-1/1000/700",
        alt: `Espacio principal de ${businessName}`,
      },
      {
        url: "https://picsum.photos/seed/reservaya-generic-gallery-2/1000/700",
        alt: `Detalle de servicio en ${businessName}`,
      },
      {
        url: "https://picsum.photos/seed/reservaya-generic-gallery-3/1000/700",
        alt: `Ambiente general de ${businessName}`,
      },
    ],
  };
}

export function mergePublicBusinessProfile(
  baseProfile: PublicBusinessProfile,
  overrides?: Partial<PublicBusinessProfile> | null
): PublicBusinessProfile {
  const safeOverrides = overrides ?? {};

  return {
    ...baseProfile,
    ...safeOverrides,
    badge:
      typeof safeOverrides.badge === "string" && safeOverrides.badge.trim().length > 0
        ? safeOverrides.badge
        : baseProfile.badge,
    eyebrow:
      typeof safeOverrides.eyebrow === "string" && safeOverrides.eyebrow.trim().length > 0
        ? safeOverrides.eyebrow
        : baseProfile.eyebrow,
    headline:
      typeof safeOverrides.headline === "string" && safeOverrides.headline.trim().length > 0
        ? safeOverrides.headline
        : baseProfile.headline,
    description:
      typeof safeOverrides.description === "string" && safeOverrides.description.trim().length > 0
        ? safeOverrides.description
        : baseProfile.description,
    primaryCta:
      typeof safeOverrides.primaryCta === "string" && safeOverrides.primaryCta.trim().length > 0
        ? safeOverrides.primaryCta
        : baseProfile.primaryCta,
    secondaryCta:
      typeof safeOverrides.secondaryCta === "string" && safeOverrides.secondaryCta.trim().length > 0
        ? safeOverrides.secondaryCta
        : baseProfile.secondaryCta,
    sectionLayout: {
      ...baseProfile.sectionLayout,
      ...(safeOverrides.sectionLayout ?? {}),
    },
    benefits: Array.isArray(safeOverrides.benefits) ? safeOverrides.benefits : baseProfile.benefits,
    trustPoints: Array.isArray(safeOverrides.trustPoints)
      ? safeOverrides.trustPoints
      : baseProfile.trustPoints,
    testimonials: Array.isArray(safeOverrides.testimonials)
      ? safeOverrides.testimonials
      : baseProfile.testimonials,
    faqs: Array.isArray(safeOverrides.faqs) ? safeOverrides.faqs : baseProfile.faqs,
    policies: Array.isArray(safeOverrides.policies)
      ? safeOverrides.policies
      : baseProfile.policies,
    gallery: Array.isArray(safeOverrides.gallery) ? safeOverrides.gallery : baseProfile.gallery,
    logoLabel:
      typeof safeOverrides.logoLabel === "string" && safeOverrides.logoLabel.trim().length > 0
        ? safeOverrides.logoLabel
        : baseProfile.logoLabel,
    heroImageAlt:
      typeof safeOverrides.heroImageAlt === "string" && safeOverrides.heroImageAlt.trim().length > 0
        ? safeOverrides.heroImageAlt
        : baseProfile.heroImageAlt,
  };
}
