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
    badge: "Barberia de barrio premium",
    eyebrow: "Reserva online en segundos",
    headline: "Cortes y barba con turnos claros.",
    description:
      "Sin mensajes de WhatsApp cruzados. Elige tu servicio, dia y horario. Confirmacion inmediata con acceso para reprogramar o cancelar.",
    primaryCta: "Reservar turno",
    secondaryCta: "Consultar por WhatsApp",
    accent: "#8F6A3A",
    accentSoft: "#E8DCCB",
    surfaceTint: "#F6F1EA",
    enableDarkMode: false,
    benefits: [
      "Turnos cortos y bien ordenados para evitar pisadas.",
      "Confirmacion inmediata con acceso para reprogramar o cancelar.",
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
        question: "Cuanto tarda la reserva?",
        answer: "Menos de un minuto: eliges servicio, dia, horario y confirmas.",
      },
      {
        question: "Puedo cambiar el turno despues?",
        answer: "Si. Cada reserva deja un link para ver, reprogramar o cancelar el turno.",
      },
      {
        question: "Atienden solo con reserva?",
        answer:
          "La demo esta pensada para priorizar reservas, pero tambien puede convivir con turnos espontaneos.",
      },
    ],
    policies: [
      "Se recomienda llegar 5 minutos antes del horario.",
      "La cancelacion sin costo se puede hacer desde el link del turno.",
      "Si llegas muy tarde, el negocio puede ajustar la duracion del servicio.",
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
    badge: "Estetica y skincare",
    eyebrow: "Cabina reservada con experiencia mas cuidada",
    headline: "Sesiones de estetica con agenda clara y una pagina que vende mejor.",
    description:
      "Esta demo muestra como una marca de estetica puede verse mas premium, ordenar su agenda y dar confianza antes de la primera visita.",
    primaryCta: "Quiero reservar",
    secondaryCta: "Hablar por WhatsApp",
    accent: "#A55D6F",
    accentSoft: "#F1D8DF",
    surfaceTint: "#FCF6F7",
    enableDarkMode: false,
    benefits: [
      "Presentacion mas cuidada para faciales, lifting y sesiones de cabina.",
      "Politicas claras y preguntas frecuentes visibles antes de reservar.",
      "Menos intercambio manual y mas conversion desde Instagram o WhatsApp.",
    ],
    trustPoints: ["Sesion personalizada", "Cabina privada", "Reprogramacion simple"],
    testimonials: [
      {
        quote: "La experiencia se siente mas profesional desde antes de entrar al gabinete.",
        author: "Camila Duarte",
        detail: "Cliente nueva por Instagram",
      },
      {
        quote:
          "Tener horarios, politicas y FAQ visibles me ahorro muchisimas preguntas repetidas.",
        author: "Agustina Rey",
        detail: "Esteticista",
      },
    ],
    faqs: [
      {
        question: "Necesito prepararme antes de la sesion?",
        answer:
          "Depende del servicio. Si hace falta algo puntual, se puede aclarar en las notas o por WhatsApp.",
      },
      {
        question: "Como cambio el turno?",
        answer: "Desde el link de gestion que recibes al confirmar la reserva.",
      },
      {
        question: "Cuanto dura cada tratamiento?",
        answer: "Cada servicio muestra la duracion estimada antes de confirmar el turno.",
      },
    ],
    policies: [
      "Si tienes sensibilidad o tratamiento dermatologico, avisa en las notas.",
      "La reprogramacion se puede hacer desde el link del turno.",
      "Para tratamientos largos, la tolerancia recomendada es de 10 minutos.",
    ],
    instagram: "@aura.estetica.demo",
    facebook: "aura.estetica.demo",
    tiktok: "@aura.estetica.demo",
    website: "https://reservaya.app/estetica",
    logoLabel: "AE",
    heroImageUrl: "https://picsum.photos/seed/reservaya-estetica-hero/1400/900",
    heroImageAlt: "Cabina de estetica minimalista con tonos suaves",
    gallery: [
      {
        url: "https://picsum.photos/seed/reservaya-estetica-gallery-1/1000/700",
        alt: "Camilla de tratamiento y set de skincare",
      },
      {
        url: "https://picsum.photos/seed/reservaya-estetica-gallery-2/1000/700",
        alt: "Sesion facial con luz tenue y ambiente premium",
      },
      {
        url: "https://picsum.photos/seed/reservaya-estetica-gallery-3/1000/700",
        alt: "Recepcion de centro estetico con branding",
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
        "Pagina publica clara, servicios visibles y una experiencia simple para convertir visitas en reservas.",
      primaryCta: "Reservar ahora",
      secondaryCta: "Escribir por WhatsApp",
      accent: "#1F2937",
      accentSoft: "#E5E7EB",
      surfaceTint: "#F9FAFB",
      enableDarkMode: false,
      benefits: [
        "Servicios y horarios claros.",
        "Proceso simple desde el celular.",
        "Confirmacion inmediata del turno.",
      ],
      trustPoints: ["Reserva simple", "Horarios visibles", "Gestion online del turno"],
      testimonials: [
        {
          quote: "La experiencia es mas clara que tomar turnos solo por mensaje.",
          author: "Cliente demo",
          detail: "ReservaYa",
        },
      ],
      faqs: [
        {
          question: "Como funciona la reserva?",
          answer: "Eliges servicio, fecha, horario y confirmas tus datos.",
        },
      ],
      policies: ["La gestion del turno se hace desde el link recibido al confirmar."],
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
