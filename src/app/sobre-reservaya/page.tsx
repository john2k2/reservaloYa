import Link from "next/link";
import type { Metadata } from "next";

import { productName } from "@/constants/site";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Sobre ReservaYa y su sistema de turnos",
  description:
    "Conocé la historia, enfoque y criterios de confianza de ReservaYa, el sistema de turnos online para negocios de servicios en Argentina.",
  path: "/sobre-reservaya",
});

export default function AboutPage() {
  return (
    <main id="main-content" className="min-h-screen bg-background font-sans text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
        <Link href="/" className="inline-flex h-11 items-center text-sm font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground">
          ← Volver al inicio
        </Link>

        <p className="mt-8 text-sm font-semibold uppercase tracking-widest text-muted-foreground">Sobre nosotros</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">ReservaYa ayuda a negocios chicos a ordenar sus turnos online</h1>
        <div className="mt-8 space-y-6 text-sm leading-7 text-foreground/80">
          <p>
            {productName} es una plataforma de reservas online pensada para barberías, peluquerías, centros de estética, estudios de uñas, consultorios y otros negocios que trabajan con agenda.
          </p>
          <p>
            El objetivo es simple: que cada negocio tenga una página clara para mostrar servicios, disponibilidad y datos de contacto, mientras el equipo administra turnos, clientes y recordatorios desde un panel privado.
          </p>
          <p>
            Trabajamos con foco en operaciones reales: validaciones del lado servidor, aislamiento por negocio, registros de auditoría, pagos integrables y una experiencia móvil para clientes que reservan desde Instagram, WhatsApp o Google.
          </p>
          <p>
            Si querés evaluar si ReservaYa encaja con tu negocio, podés revisar los ejemplos públicos, crear una cuenta o escribirnos para una demostración guiada. La plataforma se diseñó para que un negocio pueda empezar simple y después sumar mejoras operativas sin cambiar de herramienta.
          </p>
          <h2 className="text-lg font-semibold text-foreground">Cómo trabajamos la confianza</h2>
          <p>
            Priorizamos información clara para el cliente final: nombre del negocio, servicios, duración, precio cuando corresponde, ubicación, políticas y canales de contacto. Para los administradores, el foco está en permisos, validaciones, trazabilidad y una base preparada para operar con Supabase y despliegues en Vercel.
          </p>
          <p>
            ReservaYa no intenta reemplazar la relación del negocio con sus clientes. Ordena el momento de la reserva para que WhatsApp deje de ser una lista interminable de mensajes y pase a ser un canal de atención más útil.
          </p>
          <h2 className="text-lg font-semibold text-foreground">A quién está dirigido</h2>
          <p>
            Está pensado para dueños y equipos chicos que necesitan una agenda visible, fácil de compartir y suficientemente profesional para vender mejor sus turnos. Barberías, peluquerías, centros de estética, nails studios y consultorios pueden usar el mismo modelo con textos, colores, servicios y reglas adaptadas a su operación.
          </p>
          <h2 className="text-lg font-semibold text-foreground">Qué buscamos mejorar</h2>
          <p>
            Muchos negocios ya tienen demanda, clientes recurrentes y buena atención, pero pierden tiempo en tareas repetidas: preguntar horarios disponibles, confirmar datos, reprogramar manualmente o buscar conversaciones viejas. ReservaYa concentra esa información en una página pública y en un panel privado para que el equipo pueda responder menos y operar mejor.
          </p>
          <p>
            También cuidamos que la experiencia no se sienta genérica. Cada página puede mostrar servicios, fotos, preguntas frecuentes, canales de contacto y una identidad visual acorde al negocio. Eso ayuda a que el cliente entienda qué está reservando antes de escribir, y a que el dueño comparta un link más confiable desde redes, Google Business Profile o campañas locales.
          </p>
          <p>
            El producto se mantiene con una lógica práctica: publicar rápido, medir cómo se usan las reservas y ajustar textos, disponibilidad o reglas con el menor ruido posible. Esa combinación de simpleza y control es la base para que una agenda online sea sostenible en producción.
          </p>
        </div>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link href="/demo-barberia" className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-6 text-sm font-semibold text-background">
            Ver ejemplo en vivo
          </Link>
          <Link href="/contacto" className="inline-flex h-11 items-center justify-center rounded-full border border-border px-6 text-sm font-semibold">
            Contactar a ReservaYa
          </Link>
        </div>
      </div>
    </main>
  );
}
