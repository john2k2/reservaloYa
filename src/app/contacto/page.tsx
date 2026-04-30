import Link from "next/link";
import type { Metadata } from "next";
import { Mail, MessageCircle } from "lucide-react";

import { createPageMetadata } from "@/lib/seo/metadata";
import { getSiteWhatsAppHref, siteContact } from "@/lib/contact";

export const metadata: Metadata = createPageMetadata({
  title: "Contacto comercial de ReservaYa",
  description:
    "Contactá a ReservaYa para consultar por turnos online, implementación, soporte comercial o configuración de reservas para tu negocio.",
  path: "/contacto",
});

export default function ContactPage() {
  return (
    <main id="main-content" className="min-h-screen bg-background font-sans text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
        <Link href="/" className="inline-flex h-11 items-center text-sm font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground">
          ← Volver al inicio
        </Link>

        <p className="mt-8 text-sm font-semibold uppercase tracking-widest text-muted-foreground">Contacto</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Hablemos sobre la agenda online de tu negocio</h1>
        <p className="mt-5 text-base leading-7 text-muted-foreground">
          Escribinos para consultar precios, implementación, pagos online, recordatorios o una demo personalizada de ReservaYa.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <a href={getSiteWhatsAppHref("Hola, quiero conocer ReservaYa.")} target="_blank" rel="noopener noreferrer" className="rounded-2xl border border-border bg-card p-5 transition-colors hover:bg-secondary/50">
            <MessageCircle className="size-5" aria-hidden="true" />
            <p className="mt-4 font-semibold">WhatsApp comercial</p>
            <p className="mt-2 text-sm text-muted-foreground">{siteContact.whatsappLabel}</p>
          </a>
          <div className="rounded-2xl border border-border bg-card p-5">
            <Mail className="size-5" aria-hidden="true" />
            <a href={`mailto:${siteContact.email}`} className="mt-4 inline-flex font-semibold underline-offset-4 hover:underline">
              {siteContact.email}
            </a>
            <p className="mt-2 text-sm text-muted-foreground">Respondemos consultas comerciales y soporte inicial.</p>
          </div>
        </div>

        <section className="mt-10 space-y-5 text-sm leading-7 text-foreground/80">
          <h2 className="text-lg font-semibold text-foreground">Qué podemos resolver por este canal</h2>
          <p>
            Podemos ayudarte a entender si ReservaYa encaja con tu operación, revisar el flujo de reserva pública, explicar cómo se configuran servicios y disponibilidad, y estimar los pasos necesarios para publicar tu página de turnos.
          </p>
          <p>
            También respondemos consultas sobre pagos online, recordatorios por email o WhatsApp, configuración de Mercado Pago, migración desde planillas o agendas manuales, y buenas prácticas para compartir el link desde Instagram, Google Business Profile o mensajes directos.
          </p>
          <p>
            Si ya tenés una cuenta, incluí el nombre del negocio, el slug público y una descripción breve del problema para que podamos orientarte más rápido. Para consultas comerciales, contanos rubro, cantidad de servicios y cómo tomás reservas hoy.
          </p>
          <p>
            Para nuevas implementaciones solemos revisar tres puntos: qué servicios ofrecés, cómo se organiza la disponibilidad del equipo y qué información necesita ver el cliente antes de confirmar un turno. Con eso podemos recomendar una configuración inicial simple, sin pedir cambios grandes en tu forma de trabajar.
          </p>
          <p>
            Si venís de una agenda manual, planilla o mensajes por WhatsApp, también podemos ayudarte a definir un orden de carga: primero servicios principales, después horarios, luego textos públicos y finalmente ajustes de recordatorios o pagos. La idea es publicar una página útil rápido y mejorarla con datos reales.
          </p>
          <p>
            Para soporte técnico, agregá capturas si corresponde, horario aproximado del problema y el navegador o dispositivo usado. Si la consulta involucra pagos o integraciones, no envíes credenciales por email; te vamos a indicar un canal seguro para revisar la configuración.
          </p>
          <p>
            Nuestro objetivo es que cada respuesta deje una acción concreta: publicar una demo, ajustar la agenda, corregir un flujo o definir el siguiente paso comercial.
          </p>
          <p>Horario de atención: {siteContact.businessHours}.</p>
        </section>
      </div>
    </main>
  );
}
