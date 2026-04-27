import type { LucideIcon } from "lucide-react";
import {
  BellRing,
  CalendarClock,
  Clock3,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  MessageCircle,
  Scissors,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

export const productName = "ReservaYa";
export const productTagline = "Reservas automatizadas. Más tiempo para vos.";
export const landingSeoFaqs = [
  {
    question: "¿Qué es ReservaYa?",
    answer:
      "ReservaYa es un sistema de turnos online para negocios de servicios que necesitan organizar reservas, disponibilidad, clientes y recordatorios desde una agenda web simple.",
  },
  {
    question: "¿Para qué negocios sirve ReservaYa?",
    answer:
      "ReservaYa está pensado para barberías, peluquerías, centros de estética, nails studios, spas y profesionales que trabajan con turnos en Argentina y Latinoamérica.",
  },
  {
    question: "¿ReservaYa reemplaza WhatsApp?",
    answer:
      "No necesariamente. ReservaYa reduce el ida y vuelta por WhatsApp porque los clientes pueden ver servicios, elegir horarios disponibles y reservar online sin esperar una respuesta manual.",
  },
  {
    question: "¿Los clientes tienen que instalar una app para reservar?",
    answer:
      "No. Cada negocio tiene una página de reservas online que funciona desde el navegador del celular, sin descargas ni registros complejos para el cliente.",
  },
  {
    question: "¿ReservaYa ayuda a reducir ausencias?",
    answer:
      "Sí. La plataforma está preparada para confirmaciones y recordatorios automáticos, lo que ayuda a reducir olvidos, ausencias y horarios vacíos.",
  },
];
export const demoBusinessSlug = "demo-barberia";
export const demoBusinessOptions = [
  {
    slug: "demo-barberia",
    label: "Barberia clasica",
    category: "Barbería y peluquería",
    description: "Ejemplo en vivo para cortes, barba y servicios rapidos con turnos cortos.",
  },
  {
    slug: "demo-estetica",
    label: "Estetica Aura",
    category: "Estética y skincare",
    description: "Ejemplo listo para faciales, lifting y sesiones con mayor tiempo de cabina.",
  },
  {
    slug: "demo-nails",
    label: "Nails Studio",
    category: "Nails studio",
    description: "Ejemplo pensado para manicure, semipermanente y turnos ordenados desde Instagram.",
  },
  {
    slug: "demo-consultorio",
    label: "Consultorio medico",
    category: "Consultorio y salud",
    description: "Ejemplo orientado a primeras consultas, seguimientos y agenda clara para profesionales.",
  },
] as const;

export const landingProblems = [
  "Turnos tomados por mensaje a cualquier hora.",
  "Horarios pisados o mal anotados.",
  "Tiempo perdido respondiendo lo mismo.",
  "Clientes que faltan sin recordatorio previo.",
];

export const landingFeatures: Array<{
  title: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    title: "Reserva publica en minutos",
    description:
      "Cada negocio tiene una pagina simple para que sus clientes reserven sin escribir primero.",
    icon: CalendarClock,
  },
  {
    title: "Recordatorios y seguimiento",
    description:
      "La base ya esta lista para confirmaciones por email y seguimiento operativo sin caos manual.",
    icon: BellRing,
  },
  {
    title: "Operacion simple para negocios chicos",
    description:
      "Servicios, disponibilidad, clientes y turnos pensados para barberias y estetica chica.",
    icon: Scissors,
  },
  {
    title: "Arquitectura segura desde el inicio",
    description:
      "Multi-tenant con `business_id`, validaciones en servidor y aislamiento preparado para RLS.",
    icon: ShieldCheck,
  },
];

export const landingSteps = [
  {
    title: "Mostrar un negocio en vivo",
    description:
      "Entramos a la pagina del negocio, elegimos servicio y reservamos un turno real de ejemplo.",
  },
  {
    title: "Probar el panel",
    description:
      "El dueno ve el turno en el dashboard, bloquea horarios y revisa sus clientes.",
  },
  {
    title: "Instalar y cobrar",
    description:
      "Se personaliza rapido para el cliente, se cobra setup y queda una mensualidad liviana.",
  },
];

export const adminNavigation: Array<{
  href: string;
  label: string;
  icon: LucideIcon;
  group?: string;
}> = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    group: "Operaciones",
  },
  {
    href: "/admin/bookings",
    label: "Turnos",
    icon: ClipboardList,
    group: "Operaciones",
  },
  {
    href: "/admin/customers",
    label: "Clientes",
    icon: Users,
    group: "Operaciones",
  },
  {
    href: "/admin/services",
    label: "Servicios",
    icon: Scissors,
    group: "Configuración",
  },
  {
    href: "/admin/availability",
    label: "Horarios",
    icon: Clock3,
    group: "Configuración",
  },
  {
    href: "/admin/team",
    label: "Equipo",
    icon: ShieldCheck,
    group: "Configuración",
  },
  {
    href: "/admin/onboarding",
    label: "Mi negocio",
    icon: Sparkles,
    group: "Configuración",
  },
  {
    href: "/admin/billing",
    label: "Plan",
    icon: CreditCard,
    group: "Configuración",
  },
];

export const dashboardHighlights = [
  {
    label: "Turnos hoy",
    value: "12",
    hint: "3 pendientes de confirmar",
    icon: CalendarClock,
  },
  {
    label: "Clientes activos",
    value: "87",
    hint: "14 nuevos este mes",
    icon: Users,
  },
  {
    label: "Consultas por WhatsApp",
    value: "31",
    hint: "Objetivo: bajarlas con auto-reserva",
    icon: MessageCircle,
  },
];
