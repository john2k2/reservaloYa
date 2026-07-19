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
  howItWorks: string[];
  demoSlug?: string;
  demoLabel: string;
  keywords: string[];
  faqs: Array<{ question: string; answer: string }>;
};

export const seoLandingPages = [
  {
    slug: "turnos-online-barberias",
    title: "Turnos online para barberías",
    metadataTitle: "Sistema de turnos para barberías en Argentina",
    description:
      "Sistema de turnos online para barberías en Argentina y LatAm. Organizá cortes, barba, disponibilidad y recordatorios desde una agenda web simple.",
    h1: "Sistema de turnos online para barberías en Argentina",
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
    howItWorks: [
      "Publicás servicios con duración y precio (corte, barba, combo).",
      "Definís horarios y bloqueos desde el panel.",
      "Compartís el link de tu página — el cliente reserva solo.",
      "Recibís confirmaciones y recordatorios sin perseguir mensajes.",
    ],
    demoSlug: "demo-barberia",
    demoLabel: "Ver demo de barbería",
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
    metadataTitle: "Agenda online para peluquerías en Argentina",
    description:
      "Agenda online para peluquerías que quieren recibir reservas por internet, ordenar servicios y reducir mensajes repetidos en WhatsApp.",
    h1: "Agenda online para peluquerías en Argentina: menos mensajes, más orden",
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
    howItWorks: [
      "Cargás el catálogo con tiempos reales de cada servicio.",
      "Abrís la agenda por día y por profesional si hace falta.",
      "Compartís el link en Instagram, Google o WhatsApp.",
      "El cliente reserva y vos ves todo ordenado en el panel.",
    ],
    demoLabel: "Ver funcionalidades",
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
    metadataTitle: "Reservas para centros de estética en Argentina",
    description:
      "Sistema de reservas online para centros de estética, skincare y spas en Argentina. Organizá turnos, servicios, clientes y recordatorios.",
    h1: "Sistema de reservas para centros de estética y spas en Argentina",
    eyebrow: "Estética y bienestar",
    intro:
      "ReservaYa permite que centros de estética y profesionales de belleza reciban reservas online para sesiones, tratamientos y servicios con horarios definidos.",
    audience:
      "Diseñado para skincare, depilación, masajes, spas y centros de estética que necesitan una agenda simple y visible para sus clientes.",
    benefits: [
      "Página de reservas para compartir servicios estéticos con descripción, precio y duración.",
      "Agenda centralizada para evitar superposiciones y revisar próximos turnos.",
      "Flujo preparado para confirmaciones y recordatorios que ayudan a cuidar la asistencia.",
    ],
    useCases: [
      "Tratamientos faciales, lifting, depilación o masajes con duración específica.",
      "Reservas desde redes sociales sin tener que responder cada consulta de horario.",
      "Bloqueo de horarios para cabinas, profesionales o días sin atención.",
    ],
    howItWorks: [
      "Armás la ficha de cada tratamiento con tiempo y precio.",
      "Publicás disponibilidad real de cabina o profesional.",
      "El cliente elige y confirma desde el celular.",
      "Vos recibís el turno listo y los recordatorios ayudan a bajar ausencias.",
    ],
    demoSlug: "demo-estetica",
    demoLabel: "Ver demo de estética",
    keywords: [
      "sistema reservas centros de estética",
      "agenda online estética",
      "turnos online estética",
      "software para centros de estética",
      "reservas online spa",
    ],
    faqs: [
      {
        question: "¿ReservaYa sirve para skincare o spas?",
        answer:
          "Sí. Está pensado para negocios de servicios por turno, incluyendo skincare, depilación, spas y centros de estética.",
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
  {
    slug: "turnos-online-nails",
    title: "Turnos online para nails studios",
    metadataTitle: "Turnos online para nails studios en Argentina",
    description:
      "Agenda y turnos online para nails studios en Argentina. Ordená manicura, semipermanente y nail art sin mensajes cruzados en Instagram.",
    h1: "Turnos online para nails studios en Argentina que venden por Instagram",
    eyebrow: "Nails",
    intro:
      "ReservaYa le da a un nails studio una página de reservas clara: servicios con duración, horarios visibles y menos ida y vuelta para agendar manicura o semipermanente.",
    audience:
      "Para estudios de uñas y beauty express que reciben consultas por DM e Instagram y necesitan una agenda que el cliente pueda usar solo.",
    benefits: [
      "Catálogo visual de servicios con tiempo estimado antes de reservar.",
      "Menos mensajes para preguntar “¿tenés lugar?” — el cliente ve la disponibilidad.",
      "Reprogramación desde un link, sin perder el hilo en WhatsApp.",
    ],
    useCases: [
      "Manicura, gel, semipermanente y nail art con tiempos distintos.",
      "Link en bio de Instagram o TikTok hacia la página de reservas.",
      "Bloqueo de cabina cuando hay feriados o días sin atención.",
    ],
    howItWorks: [
      "Publicás manicura, semipermanente y extras con duración.",
      "Abrís la agenda de la cabina o de cada profesional.",
      "Ponés el link en el bio — el cliente reserva desde el celular.",
      "Confirmás y recordás el turno sin perseguir DMs.",
    ],
    demoSlug: "demo-nails",
    demoLabel: "Ver demo de nails",
    keywords: [
      "turnos online nails",
      "agenda online manicura",
      "reservas online uñas",
      "software nails studio",
      "turnos semipermanente",
    ],
    faqs: [
      {
        question: "¿Sirve si la mayoría de clientas llegan por Instagram?",
        answer:
          "Sí. El flujo está pensado para compartir un link en el bio o en historias y que reserven sin esperar respuesta en el DM.",
      },
      {
        question: "¿Puedo separar manicura de nail art por duración?",
        answer:
          "Sí. Cada servicio tiene su duración para que la agenda no se pise y la clienta sepa cuánto tarda.",
      },
      {
        question: "¿Se puede reprogramar sin escribir?",
        answer:
          "Sí. Cada reserva deja un link para ver, reprogramar o cancelar el turno.",
      },
    ],
  },
  {
    slug: "turnos-online-consultorios",
    title: "Turnos online para consultorios",
    metadataTitle: "Agenda online para consultorios en Argentina",
    description:
      "Agenda online para consultorios y profesionales de la salud en Argentina. Primero consultas y seguimientos con menos llamados para coordinar.",
    h1: "Agenda de turnos online para consultorios en Argentina",
    eyebrow: "Consultorios",
    intro:
      "ReservaYa ayuda a consultorios y profesionales a publicar horarios, tipificar consultas y dar una página de reservas confiable para primera vez y seguimiento.",
    audience:
      "Para consultorios chicos y profesionales que hoy coordinan por teléfono o WhatsApp y necesitan transmitir ubicación, duración y políticas antes del turno.",
    benefits: [
      "Información clara de primera consulta y seguimiento antes de reservar.",
      "Menos fricción para cambiar o cancelar sin saturar la línea.",
      "Presentación profesional con ubicación y horarios visibles.",
    ],
    useCases: [
      "Primera consulta y controles con duraciones distintas.",
      "Link de reservas en Google Business Profile o WhatsApp.",
      "Bloqueo de agenda en feriados o días de guardia externa.",
    ],
    howItWorks: [
      "Definís tipos de consulta con duración y notas útiles.",
      "Publicás horarios de atención reales.",
      "El paciente reserva desde el celular sin llamar.",
      "Vos gestionás cambios y recordatorios desde el panel.",
    ],
    demoSlug: "demo-consultorio",
    demoLabel: "Ver demo de consultorio",
    keywords: [
      "turnos online consultorio",
      "agenda online médicos",
      "reservas online consultorio",
      "sistema de turnos salud",
      "agenda para profesionales",
    ],
    faqs: [
      {
        question: "¿Sirve para un solo profesional?",
        answer:
          "Sí. Está pensado para consultorios chicos y profesionales independientes que necesitan orden sin un sistema hospitalario.",
      },
      {
        question: "¿Puedo pedir datos o notas al reservar?",
        answer:
          "Sí. El flujo de reserva permite orientar al paciente con FAQs, políticas y notas antes de confirmar.",
      },
      {
        question: "¿Los pacientes necesitan una app?",
        answer:
          "No. Reservan desde la página web del consultorio en el navegador del celular.",
      },
    ],
  },
] as const satisfies ReadonlyArray<SeoLandingPage>;

export function getSeoLandingPage(slug: string): SeoLandingPage | undefined {
  return seoLandingPages.find((page) => page.slug === slug);
}
