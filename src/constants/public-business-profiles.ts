export type DarkModeColors = {
  accent: string;
  accentSoft: string;
  surfaceTint: string;
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
};

export type PublicBusinessProfile = {
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
  mapQuery?: string;
  mapEmbedUrl?: string;
};

const profileMap: Record<string, PublicBusinessProfile> = {
  "demo-barberia": {
    badge: "Barbería de barrio premium",
    eyebrow: "Reserva online en segundos",
    headline: "Cortes y barba con turnos claros.",
    description:
      "Sin mensajes de WhatsApp cruzados. Elige tu servicio, día y horario. Confirmación inmediata con acceso para reprogramar o cancelar.",
    primaryCta: "Reservar turno",
    secondaryCta: "Consultar por WhatsApp",
    accent: "#8F6A3A",
    accentSoft: "#E8DCCB",
    surfaceTint: "#F6F1EA",
    enableDarkMode: false,
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
          "La demo está pensada para priorizar reservas, pero también puede convivir con turnos espontáneos.",
      },
    ],
    policies: [
      "Se recomienda llegar 5 minutos antes del horario.",
      "La cancelación sin costo se puede hacer desde el link del turno.",
      "Si llegas muy tarde, el negocio puede ajustar la duración del servicio.",
    ],
    instagram: "@demo.barberia",
    facebook: "demo.barberia",
    tiktok: "@demo.barberia",
    website: "https://reservaya.app/barberia",
    logoLabel: "DB",
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
    badge: "Estética y skincare",
    eyebrow: "Cabina reservada con experiencia más cuidada",
    headline: "Sesiones de estética con agenda clara y una página que vende mejor.",
    description:
      "Esta demo muestra cómo una marca de estética puede verse más premium, ordenar su agenda y dar confianza antes de la primera visita.",
    primaryCta: "Quiero reservar",
    secondaryCta: "Hablar por WhatsApp",
    accent: "#A55D6F",
    accentSoft: "#F1D8DF",
    surfaceTint: "#FCF6F7",
    enableDarkMode: false,
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
        quote:
          "Tener horarios, políticas y FAQ visibles me ahorró muchísimas preguntas repetidas.",
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
    instagram: "@aura.estetica.demo",
    facebook: "aura.estetica.demo",
    tiktok: "@aura.estetica.demo",
    website: "https://reservaya.app/estetica",
    logoLabel: "AE",
    heroImageUrl: "https://picsum.photos/seed/reservaya-estetica-hero/1400/900",
    heroImageAlt: "Cabina de estética minimalista con tonos suaves",
    gallery: [
      {
        url: "https://picsum.photos/seed/reservaya-estetica-gallery-1/1000/700",
        alt: "Camilla de tratamiento y set de skincare",
      },
      {
        url: "https://picsum.photos/seed/reservaya-estetica-gallery-2/1000/700",
        alt: "Sesión facial con luz tenue y ambiente premium",
      },
      {
        url: "https://picsum.photos/seed/reservaya-estetica-gallery-3/1000/700",
        alt: "Recepción de centro estético con branding",
      },
    ],
    mapQuery: "Honduras 4821, Palermo",
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
  return (
    profileMap[templateSlug ?? slug] ?? {
      badge: "Reservas online",
      eyebrow: "Agenda simple para negocios chicos",
      headline: `${businessName} ahora puede vender mejor sus turnos online.`,
      description:
        "Página pública clara, servicios visibles y una experiencia simple para convertir visitas en reservas.",
      primaryCta: "Reservar ahora",
      secondaryCta: "Escribir por WhatsApp",
      accent: "#1F2937",
      accentSoft: "#E5E7EB",
      surfaceTint: "#F9FAFB",
      enableDarkMode: false,
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
    }
  );
}
