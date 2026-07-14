import type { Metadata } from "next";
import Link from "next/link";

import { LandingPageShell } from "@/components/landing";
import { productName } from "@/constants/site";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Sobre nosotros — Sistema de turnos online",
  description:
    "Conocé la historia, enfoque y criterios de confianza de ReservaYa, el sistema de turnos online para negocios de servicios en Argentina.",
  path: "/sobre-reservaya",
});

export default function AboutPage() {
  return (
    <LandingPageShell>
      <div className="mx-auto max-w-3xl px-6 py-16 pt-32 sm:py-24 sm:pt-36">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Sobre nosotros
        </p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          ReservaYa ayuda a negocios chicos a ordenar sus turnos online
        </h1>
        <div className="mt-8 space-y-6 text-sm leading-7 text-foreground/80">
          <p>
            {productName} es una plataforma de reservas online pensada para barberías, peluquerías,
            centros de estética, estudios de uñas, consultorios y otros negocios que trabajan con
            agenda.
          </p>
          <p>
            El objetivo es simple: que cada negocio tenga una página clara para mostrar servicios,
            disponibilidad y datos de contacto, mientras el equipo administra turnos, clientes y
            recordatorios desde un panel privado.
          </p>
          <p>
            Trabajamos con foco en operaciones reales: validaciones del lado servidor, aislamiento
            por negocio, registros de auditoría, pagos integrables y una experiencia móvil para
            clientes que reservan desde Instagram, WhatsApp o Google.
          </p>
          <p>
            Si querés evaluar si ReservaYa encaja con tu negocio, podés revisar los ejemplos
            públicos, crear una cuenta o escribirnos para una demostración guiada.
          </p>
          <h2 className="font-display text-xl font-semibold text-foreground">
            Cómo trabajamos la confianza
          </h2>
          <p>
            Priorizamos información clara para el cliente final: nombre del negocio, servicios,
            duración, precio cuando corresponde, ubicación, políticas y canales de contacto.
          </p>
          <h2 className="font-display text-xl font-semibold text-foreground">
            A quién está dirigido
          </h2>
          <p>
            Está pensado para dueños y equipos chicos que necesitan una agenda visible, fácil de
            compartir y suficientemente profesional para vender mejor sus turnos.
          </p>
          <h2 className="font-display text-xl font-semibold text-foreground">
            Qué buscamos mejorar
          </h2>
          <p>
            Muchos negocios ya tienen demanda, pero pierden tiempo en tareas repetidas: preguntar
            horarios, confirmar datos o buscar conversaciones viejas. ReservaYa concentra eso en una
            página pública y un panel privado.
          </p>
        </div>

        <div className="mt-10 flex w-full flex-col flex-wrap gap-3 sm:w-auto sm:flex-row">
          <Link
            href="/demo-barberia"
            className="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-full bg-foreground px-6 text-sm font-semibold text-background"
          >
            Ver ejemplo en vivo
          </Link>
          <Link
            href="/contacto"
            className="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-full border border-rule px-6 text-sm font-semibold"
          >
            Contactar a ReservaYa
          </Link>
        </div>
      </div>
    </LandingPageShell>
  );
}
