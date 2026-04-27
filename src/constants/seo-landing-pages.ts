export type SeoLandingPage = {
  slug: string;
  title: string;
  metadataTitle: string;
  description: string;
  h1: string;
  eyebrow: string;
  intro: string;
  audience: string;
  benefits: string[];
  useCases: string[];
  keywords: string[];
  faqs: Array<{ question: string; answer: string }>;
};

export const seoLandingPages = [
  {
    slug: "turnos-online-barberias",
    title: "Turnos online para barberías",
    metadataTitle: "Turnos online para barberías",
    description:
      "Sistema de turnos online para barberías en Argentina y LatAm. Organizá cortes, barba, disponibilidad y recordatorios desde una agenda web simple.",
    h1: "Turnos online para barberías que quieren ordenar WhatsApp y llenar mejor la agenda",
    eyebrow: "Barberías",
    intro:
      "ReservaYa ayuda a barberías chicas y medianas a publicar servicios, horarios disponibles y una página de reservas para que el cliente elija su turno sin esperar respuesta manual.",
    audience:
      "Pensado para barberías que hoy reciben pedidos por WhatsApp, Instagram o llamadas, y necesitan una forma más clara de organizar cortes, barba, color y servicios rápidos.",
    benefits: [
      "Página de reservas online para que tus clientes elijan servicio, día y horario desde el celular.",
      "Panel para ver turnos, clientes y disponibilidad sin depender de planillas sueltas.",
      "Base preparada para confirmaciones y recordatorios que ayudan a reducir olvidos y ausencias.",
    ],
    useCases: [
      "Cortes cada 30 o 45 minutos con horarios ordenados.",
      "Servicios combinados como corte + barba con duración definida.",
      "Bloqueo de horarios cuando el barbero no atiende o necesita cerrar la agenda.",
    ],
    keywords: [
      "turnos online barberías",
      "sistema de turnos para barberías",
      "agenda online barbería",
      "reservas online barbería",
      "software para barberías",
    ],
    faqs: [
      {
        question: "¿ReservaYa sirve para barberías con pocos barberos?",
        answer:
          "Sí. Está pensado para negocios chicos que necesitan ordenar servicios, horarios y clientes sin implementar una herramienta compleja.",
      },
      {
        question: "¿Los clientes tienen que descargar una app?",
        answer:
          "No. La reserva se hace desde una página web que funciona en el navegador del celular.",
      },
      {
        question: "¿Puedo mostrar servicios con distinta duración?",
        answer:
          "Sí. Cada servicio puede tener su duración y precio para que la agenda se organice con más claridad.",
      },
    ],
  },
  {
    slug: "agenda-online-peluquerias",
    title: "Agenda online para peluquerías",
    metadataTitle: "Agenda online para peluquerías",
    description:
      "Agenda online para peluquerías que quieren recibir reservas por internet, ordenar servicios y reducir mensajes repetidos en WhatsApp.",
    h1: "Agenda online para peluquerías: menos mensajes repetidos, más turnos ordenados",
    eyebrow: "Peluquerías",
    intro:
      "Con ReservaYa, una peluquería puede ofrecer una experiencia simple de reserva online para cortes, peinados, coloración y tratamientos, manteniendo la operación diaria en un panel claro.",
    audience:
      "Ideal para peluquerías que trabajan con servicios de distinta duración y necesitan que la agenda no dependa solamente de mensajes manuales.",
    benefits: [
      "Servicios publicados con duración y precio para orientar mejor al cliente antes de reservar.",
      "Disponibilidad visible para evitar idas y vueltas preguntando horarios libres.",
      "Clientes y turnos centralizados para revisar el día desde el panel administrador.",
    ],
    useCases: [
      "Corte, brushing, color o tratamientos con tiempos diferentes.",
      "Reservas desde Instagram, Google Business Profile o WhatsApp usando el link del negocio.",
      "Control de horarios disponibles cuando el equipo cambia su jornada.",
    ],
    keywords: [
      "agenda online peluquerías",
      "sistema de turnos para peluquerías",
      "reservas online peluquería",
      "software para peluquerías",
      "turnos online peluquería",
    ],
    faqs: [
      {
        question: "¿Una peluquería puede usar ReservaYa aunque siga atendiendo por WhatsApp?",
        answer:
          "Sí. La idea no es eliminar WhatsApp, sino reducir consultas repetidas y enviar a los clientes a un link donde puedan reservar cuando quieran.",
      },
      {
        question: "¿Sirve para servicios largos como coloración o tratamientos?",
        answer:
          "Sí. Los servicios pueden configurarse con duraciones distintas para reflejar mejor el tiempo real de trabajo.",
      },
      {
        question: "¿La agenda online es pública?",
        answer:
          "Cada negocio tiene una página pública de reservas para compartir con sus clientes desde redes, WhatsApp o su perfil de Google.",
      },
    ],
  },
  {
    slug: "sistema-reservas-centros-estetica",
    title: "Sistema de reservas para centros de estética",
    metadataTitle: "Sistema de reservas para centros de estética",
    description:
      "Sistema de reservas online para centros de estética, skincare, uñas y spas. Organizá turnos, servicios, clientes y recordatorios desde una agenda web.",
    h1: "Sistema de reservas online para centros de estética, nails y spas",
    eyebrow: "Estética y bienestar",
    intro:
      "ReservaYa permite que centros de estética y profesionales de belleza reciban reservas online para sesiones, tratamientos y servicios con horarios definidos.",
    audience:
      "Diseñado para estudios de uñas, skincare, depilación, masajes, spas y centros de estética que necesitan una agenda simple y visible para sus clientes.",
    benefits: [
      "Página de reservas para compartir servicios estéticos con descripción, precio y duración.",
      "Agenda centralizada para evitar superposiciones y revisar próximos turnos.",
      "Flujo preparado para confirmaciones y recordatorios que ayudan a cuidar la asistencia.",
    ],
    useCases: [
      "Tratamientos faciales, lifting, manicura, depilación o masajes con duración específica.",
      "Reservas desde redes sociales sin tener que responder cada consulta de horario.",
      "Bloqueo de horarios para cabinas, profesionales o días sin atención.",
    ],
    keywords: [
      "sistema reservas centros de estética",
      "agenda online estética",
      "turnos online estética",
      "software para centros de estética",
      "reservas online spa",
    ],
    faqs: [
      {
        question: "¿ReservaYa sirve para estudios de uñas o skincare?",
        answer:
          "Sí. Está pensado para negocios de servicios por turno, incluyendo nails studios, skincare, depilación, spas y centros de estética.",
      },
      {
        question: "¿Puedo cargar servicios con precio y duración?",
        answer:
          "Sí. La plataforma permite ordenar servicios para que el cliente entienda qué está reservando y cuánto tiempo requiere.",
      },
      {
        question: "¿Ayuda a reducir ausencias?",
        answer:
          "ReservaYa está preparada para confirmaciones y recordatorios, una práctica clave para reducir olvidos y turnos vacíos.",
      },
    ],
  },
] as const satisfies ReadonlyArray<SeoLandingPage>;

export function getSeoLandingPage(slug: string): SeoLandingPage | undefined {
  return seoLandingPages.find((page) => page.slug === slug);
}
