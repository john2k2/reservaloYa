export type DemoBusiness = {
  id: string;
  name: string;
  slug: string;
  templateSlug?: string;
  phone: string;
  email: string;
  notificationEmail?: string; // Email para recibir notificaciones de reservas
  address: string;
  timezone: string;
};

export type DemoService = {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
};

type DemoAvailabilityRule = {
  id: string;
  businessId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  active: boolean;
};

type DemoBlockedSlot = {
  id: string;
  businessId: string;
  blockedDate: string;
  startTime: string;
  endTime: string;
  reason: string;
};

type DemoCustomer = {
  id: string;
  businessId: string;
  fullName: string;
  phone: string;
  email: string;
  notes: string;
  createdAt: string;
};

type DemoBooking = {
  id: string;
  businessId: string;
  customerId: string;
  serviceId: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
  notes: string;
  createdAt: string;
};

export type DemoPreset = {
  business: DemoBusiness;
  services: DemoService[];
  availabilityRules: DemoAvailabilityRule[];
  blockedSlots: DemoBlockedSlot[];
  customers: DemoCustomer[];
  bookings: DemoBooking[];
};

export const demoBusiness = {
  id: "11111111-1111-1111-1111-111111111111",
  name: "Demo Barbería",
  slug: "demo-barberia",
  templateSlug: "demo-barberia",
  phone: "+54 11 5555 0199",
  email: "hola@reservaya.app",
  notificationEmail: "ortiz.jonathan2k@gmail.com",
  address: "Av. del Libertador 214, Palermo",
  timezone: "America/Argentina/Buenos_Aires",
} satisfies DemoBusiness;

export const demoServices = [
  {
    id: "22222222-2222-2222-2222-222222222221",
    name: "Corte clásico",
    description: "Corte con terminación prolija para uso diario.",
    durationMinutes: 45,
    price: 12000,
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    name: "Corte + barba",
    description: "Servicio completo con perfilado y terminación.",
    durationMinutes: 60,
    price: 18000,
  },
  {
    id: "22222222-2222-2222-2222-222222222223",
    name: "Perfilado premium",
    description: "Repaso rápido para mantener prolijo el look.",
    durationMinutes: 30,
    price: 8000,
  },
] satisfies DemoService[];

export const estheticsDemoBusiness = {
  id: "aaaaaaaa-1111-1111-1111-111111111111",
  name: "Demo Estética Aura",
  slug: "demo-estetica",
  templateSlug: "demo-estetica",
  phone: "+54 11 5555 0288",
  email: "hola@aura-estetica.demo",
  notificationEmail: "ortiz.jonathan2k@gmail.com",
  address: "Honduras 4821, Palermo",
  timezone: "America/Argentina/Buenos_Aires",
} satisfies DemoBusiness;

export const estheticsDemoServices = [
  {
    id: "aaaaaaaa-2222-2222-2222-222222222221",
    name: "Limpieza facial profunda",
    description: "Sesión completa con extracciones suaves, máscara calmante y cierre hidratante.",
    durationMinutes: 75,
    price: 28000,
  },
  {
    id: "aaaaaaaa-2222-2222-2222-222222222222",
    name: "Dermaplaning glow",
    description: "Exfoliación precisa para mejorar textura, luminosidad y absorción de activos.",
    durationMinutes: 60,
    price: 24000,
  },
  {
    id: "aaaaaaaa-2222-2222-2222-222222222223",
    name: "Lifting de pestañas",
    description: "Curvatura y definición natural con acabado prolijo para varias semanas.",
    durationMinutes: 50,
    price: 22000,
  },
] satisfies DemoService[];

export const nailsDemoBusiness = {
  id: "bbbbbbbb-1111-1111-1111-111111111111",
  name: "Demo Nails Studio",
  slug: "demo-nails",
  templateSlug: "demo-nails",
  phone: "+54 11 5555 0377",
  email: "hola@nails-demo.estudio",
  notificationEmail: "ortiz.jonathan2k@gmail.com",
  address: "Gorriti 5172, Palermo",
  timezone: "America/Argentina/Buenos_Aires",
} satisfies DemoBusiness;

export const nailsDemoServices = [
  {
    id: "bbbbbbbb-2222-2222-2222-222222222221",
    name: "Manicura express",
    description: "Limpieza, limado y esmaltado simple para resolver en menos de una hora.",
    durationMinutes: 40,
    price: 14000,
  },
  {
    id: "bbbbbbbb-2222-2222-2222-222222222222",
    name: "Semipermanente",
    description: "Preparación completa con color semipermanente y terminación brillante.",
    durationMinutes: 70,
    price: 22000,
  },
  {
    id: "bbbbbbbb-2222-2222-2222-222222222223",
    name: "Nail art simple",
    description: "Diseño sutil para sumar detalle sin estirar demasiado el turno.",
    durationMinutes: 90,
    price: 26000,
  },
] satisfies DemoService[];

export const consultorioDemoBusiness = {
  id: "cccccccc-1111-1111-1111-111111111111",
  name: "Demo Consultorio Norte",
  slug: "demo-consultorio",
  templateSlug: "demo-consultorio",
  phone: "+54 11 5555 0466",
  email: "hola@consultorio-demo.med",
  notificationEmail: "ortiz.jonathan2k@gmail.com",
  address: "Av. Cabildo 1847, Belgrano",
  timezone: "America/Argentina/Buenos_Aires",
} satisfies DemoBusiness;

export const consultorioDemoServices = [
  {
    id: "cccccccc-2222-2222-2222-222222222221",
    name: "Primera consulta",
    description: "Turno inicial para evaluación, antecedentes y definición de seguimiento.",
    durationMinutes: 45,
    price: 26000,
  },
  {
    id: "cccccccc-2222-2222-2222-222222222222",
    name: "Consulta de seguimiento",
    description: "Revisión de evolución, ajuste de indicaciones y próximos pasos.",
    durationMinutes: 30,
    price: 18000,
  },
  {
    id: "cccccccc-2222-2222-2222-222222222223",
    name: "Control de resultados",
    description: "Espacio breve para revisar estudios y resolver dudas puntuales.",
    durationMinutes: 20,
    price: 14000,
  },
] satisfies DemoService[];

export const demoPresets: Record<string, DemoPreset> = {
  [demoBusiness.slug]: {
    business: demoBusiness,
    services: demoServices,
    availabilityRules: [
      {
        id: "55555555-5555-5555-5555-555555555551",
        businessId: demoBusiness.id,
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "18:00",
        active: true,
      },
      {
        id: "55555555-5555-5555-5555-555555555552",
        businessId: demoBusiness.id,
        dayOfWeek: 3,
        startTime: "09:00",
        endTime: "18:00",
        active: true,
      },
      {
        id: "55555555-5555-5555-5555-555555555553",
        businessId: demoBusiness.id,
        dayOfWeek: 5,
        startTime: "10:00",
        endTime: "20:00",
        active: true,
      },
    ],
    blockedSlots: [
      {
        id: "66666666-6666-6666-6666-666666666661",
        businessId: demoBusiness.id,
        blockedDate: "2026-03-13",
        startTime: "13:00",
        endTime: "14:00",
        reason: "Almuerzo",
      },
    ],
    customers: [
      {
        id: "44444444-4444-4444-4444-444444444441",
        businessId: demoBusiness.id,
        fullName: "Luca Sosa",
        phone: "+54 11 4444 1000",
        email: "luca@example.com",
        notes: "Prefiere turno temprano.",
        createdAt: "2026-03-02T10:00:00.000Z",
      },
      {
        id: "44444444-4444-4444-4444-444444444442",
        businessId: demoBusiness.id,
        fullName: "Mara Díaz",
        phone: "+54 11 4444 2000",
        email: "mara@example.com",
        notes: "Cliente recurrente.",
        createdAt: "2026-03-02T10:05:00.000Z",
      },
    ],
    bookings: [
      {
        id: "77777777-7777-7777-7777-777777777771",
        businessId: demoBusiness.id,
        customerId: "44444444-4444-4444-4444-444444444441",
        serviceId: "22222222-2222-2222-2222-222222222222",
        bookingDate: "2026-03-13",
        startTime: "10:00",
        endTime: "11:00",
        status: "confirmed",
        notes: "Reserva generada para demo comercial.",
        createdAt: "2026-03-03T10:00:00.000Z",
      },
      {
        id: "77777777-7777-7777-7777-777777777772",
        businessId: demoBusiness.id,
        customerId: "44444444-4444-4444-4444-444444444442",
        serviceId: "22222222-2222-2222-2222-222222222223",
        bookingDate: "2026-03-13",
        startTime: "16:45",
        endTime: "17:15",
        status: "pending",
        notes: "Esperando confirmación.",
        createdAt: "2026-03-03T10:10:00.000Z",
      },
    ],
  },
  [estheticsDemoBusiness.slug]: {
    business: estheticsDemoBusiness,
    services: estheticsDemoServices,
    availabilityRules: [
      {
        id: "aaaaaaaa-5555-5555-5555-555555555551",
        businessId: estheticsDemoBusiness.id,
        dayOfWeek: 2,
        startTime: "10:00",
        endTime: "19:00",
        active: true,
      },
      {
        id: "aaaaaaaa-5555-5555-5555-555555555552",
        businessId: estheticsDemoBusiness.id,
        dayOfWeek: 4,
        startTime: "11:00",
        endTime: "20:00",
        active: true,
      },
      {
        id: "aaaaaaaa-5555-5555-5555-555555555553",
        businessId: estheticsDemoBusiness.id,
        dayOfWeek: 6,
        startTime: "10:00",
        endTime: "16:00",
        active: true,
      },
    ],
    blockedSlots: [
      {
        id: "aaaaaaaa-6666-6666-6666-666666666661",
        businessId: estheticsDemoBusiness.id,
        blockedDate: "2026-03-13",
        startTime: "15:00",
        endTime: "16:00",
        reason: "Capacitación interna",
      },
    ],
    customers: [
      {
        id: "aaaaaaaa-4444-4444-4444-444444444441",
        businessId: estheticsDemoBusiness.id,
        fullName: "Camila Duarte",
        phone: "+54 11 4333 2200",
        email: "camila@example.com",
        notes: "Prefiere sesiones después de las 18 hs.",
        createdAt: "2026-03-02T11:00:00.000Z",
      },
      {
        id: "aaaaaaaa-4444-4444-4444-444444444442",
        businessId: estheticsDemoBusiness.id,
        fullName: "Agustina Rey",
        phone: "+54 11 4333 2210",
        email: "agus@example.com",
        notes: "Consulta seguido por lifting y skincare.",
        createdAt: "2026-03-02T11:10:00.000Z",
      },
    ],
    bookings: [
      {
        id: "aaaaaaaa-7777-7777-7777-777777777771",
        businessId: estheticsDemoBusiness.id,
        customerId: "aaaaaaaa-4444-4444-4444-444444444441",
        serviceId: "aaaaaaaa-2222-2222-2222-222222222221",
        bookingDate: "2026-03-13",
        startTime: "11:00",
        endTime: "12:15",
        status: "confirmed",
        notes: "Primera visita por limpieza facial.",
        createdAt: "2026-03-03T11:00:00.000Z",
      },
      {
        id: "aaaaaaaa-7777-7777-7777-777777777772",
        businessId: estheticsDemoBusiness.id,
        customerId: "aaaaaaaa-4444-4444-4444-444444444442",
        serviceId: "aaaaaaaa-2222-2222-2222-222222222223",
        bookingDate: "2026-03-13",
        startTime: "17:30",
        endTime: "18:20",
        status: "pending",
        notes: "Confirma por WhatsApp durante la tarde.",
        createdAt: "2026-03-03T11:20:00.000Z",
      },
    ],
  },
  [nailsDemoBusiness.slug]: {
    business: nailsDemoBusiness,
    services: nailsDemoServices,
    availabilityRules: [
      {
        id: "bbbbbbbb-5555-5555-5555-555555555551",
        businessId: nailsDemoBusiness.id,
        dayOfWeek: 2,
        startTime: "09:30",
        endTime: "18:30",
        active: true,
      },
      {
        id: "bbbbbbbb-5555-5555-5555-555555555552",
        businessId: nailsDemoBusiness.id,
        dayOfWeek: 4,
        startTime: "10:00",
        endTime: "19:00",
        active: true,
      },
      {
        id: "bbbbbbbb-5555-5555-5555-555555555553",
        businessId: nailsDemoBusiness.id,
        dayOfWeek: 6,
        startTime: "10:00",
        endTime: "17:00",
        active: true,
      },
    ],
    blockedSlots: [
      {
        id: "bbbbbbbb-6666-6666-6666-666666666661",
        businessId: nailsDemoBusiness.id,
        blockedDate: "2026-03-14",
        startTime: "13:00",
        endTime: "14:30",
        reason: "Capacitación de diseños",
      },
    ],
    customers: [
      {
        id: "bbbbbbbb-4444-4444-4444-444444444441",
        businessId: nailsDemoBusiness.id,
        fullName: "Sofía Martínez",
        phone: "+54 11 4777 3100",
        email: "sofi@example.com",
        notes: "Le gusta reservar cerca del mediodía.",
        createdAt: "2026-03-02T12:00:00.000Z",
      },
      {
        id: "bbbbbbbb-4444-4444-4444-444444444442",
        businessId: nailsDemoBusiness.id,
        fullName: "Valentina Núñez",
        phone: "+54 11 4777 3110",
        email: "vale@example.com",
        notes: "Suele elegir semipermanente.",
        createdAt: "2026-03-02T12:10:00.000Z",
      },
    ],
    bookings: [
      {
        id: "bbbbbbbb-7777-7777-7777-777777777771",
        businessId: nailsDemoBusiness.id,
        customerId: "bbbbbbbb-4444-4444-4444-444444444441",
        serviceId: "bbbbbbbb-2222-2222-2222-222222222222",
        bookingDate: "2026-03-14",
        startTime: "10:00",
        endTime: "11:10",
        status: "confirmed",
        notes: "Color nude con retiro previo.",
        createdAt: "2026-03-03T12:00:00.000Z",
      },
      {
        id: "bbbbbbbb-7777-7777-7777-777777777772",
        businessId: nailsDemoBusiness.id,
        customerId: "bbbbbbbb-4444-4444-4444-444444444442",
        serviceId: "bbbbbbbb-2222-2222-2222-222222222221",
        bookingDate: "2026-03-17",
        startTime: "15:00",
        endTime: "15:40",
        status: "pending",
        notes: "Primera visita desde Instagram.",
        createdAt: "2026-03-03T12:20:00.000Z",
      },
    ],
  },
  [consultorioDemoBusiness.slug]: {
    business: consultorioDemoBusiness,
    services: consultorioDemoServices,
    availabilityRules: [
      {
        id: "cccccccc-5555-5555-5555-555555555551",
        businessId: consultorioDemoBusiness.id,
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "15:00",
        active: true,
      },
      {
        id: "cccccccc-5555-5555-5555-555555555552",
        businessId: consultorioDemoBusiness.id,
        dayOfWeek: 3,
        startTime: "10:00",
        endTime: "18:00",
        active: true,
      },
      {
        id: "cccccccc-5555-5555-5555-555555555553",
        businessId: consultorioDemoBusiness.id,
        dayOfWeek: 5,
        startTime: "09:00",
        endTime: "13:00",
        active: true,
      },
    ],
    blockedSlots: [
      {
        id: "cccccccc-6666-6666-6666-666666666661",
        businessId: consultorioDemoBusiness.id,
        blockedDate: "2026-03-16",
        startTime: "12:00",
        endTime: "13:00",
        reason: "Ateneo interno",
      },
    ],
    customers: [
      {
        id: "cccccccc-4444-4444-4444-444444444441",
        businessId: consultorioDemoBusiness.id,
        fullName: "Martín Quiroga",
        phone: "+54 11 4888 1200",
        email: "martin@example.com",
        notes: "Primera consulta por recomendación.",
        createdAt: "2026-03-02T13:00:00.000Z",
      },
      {
        id: "cccccccc-4444-4444-4444-444444444442",
        businessId: consultorioDemoBusiness.id,
        fullName: "Lucía Ferrer",
        phone: "+54 11 4888 1210",
        email: "lucia@example.com",
        notes: "Trae estudios recientes para control.",
        createdAt: "2026-03-02T13:10:00.000Z",
      },
    ],
    bookings: [
      {
        id: "cccccccc-7777-7777-7777-777777777771",
        businessId: consultorioDemoBusiness.id,
        customerId: "cccccccc-4444-4444-4444-444444444441",
        serviceId: "cccccccc-2222-2222-2222-222222222221",
        bookingDate: "2026-03-16",
        startTime: "10:00",
        endTime: "10:45",
        status: "confirmed",
        notes: "Consulta inicial con historia clínica.",
        createdAt: "2026-03-03T13:00:00.000Z",
      },
      {
        id: "cccccccc-7777-7777-7777-777777777772",
        businessId: consultorioDemoBusiness.id,
        customerId: "cccccccc-4444-4444-4444-444444444442",
        serviceId: "cccccccc-2222-2222-2222-222222222222",
        bookingDate: "2026-03-18",
        startTime: "16:30",
        endTime: "17:00",
        status: "pending",
        notes: "Seguimiento post estudios.",
        createdAt: "2026-03-03T13:20:00.000Z",
      },
    ],
  },
};

export const demoSlots = ["10:00", "10:45", "11:30", "16:00", "16:45", "17:30"];

export const demoDashboardData = {
  profileName: "Demo Owner",
  businessName: "Demo Barbería",
  businessSlug: "demo-barberia",
  userEmail: "demo@reservaya.app",
  metrics: [
    {
      label: "Turnos hoy",
      value: "12",
      hint: "3 pendientes de confirmar",
    },
    {
      label: "Clientes activos",
      value: "87",
      hint: "14 nuevos este mes",
    },
    {
      label: "Consultas por WhatsApp",
      value: "31",
      hint: "Objetivo: bajarlas con auto-reserva",
    },
  ],
  bookings: [
    {
      id: "demo-1",
      name: "Matías Gómez",
      service: "Corte + barba",
      date: "2026-03-13",
      time: "10:00",
      status: "Confirmado",
    },
    {
      id: "demo-2",
      name: "Luca Sosa",
      service: "Corte clásico",
      date: "2026-03-13",
      time: "11:30",
      status: "Pendiente",
    },
    {
      id: "demo-3",
      name: "Mara Díaz",
      service: "Perfilado premium",
      date: "2026-03-13",
      time: "16:45",
      status: "Confirmado",
    },
  ],
};
