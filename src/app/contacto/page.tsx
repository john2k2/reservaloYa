import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MessageCircle } from "lucide-react";

import { LandingPageShell } from "@/components/landing";
import { createPageMetadata } from "@/lib/seo/metadata";
import { getSiteWhatsAppHref, siteContact } from "@/lib/contact";
import { ContactInquiryForm } from "./contact-inquiry-form";

export const metadata: Metadata = createPageMetadata({
  title: "Contacto comercial",
  description:
    "Contactá a ReservaYa para consultar por turnos online, implementación, soporte comercial o configuración de reservas para tu negocio.",
  path: "/contacto",
});

export default function ContactPage() {
  return (
    <LandingPageShell>
      <div className="mx-auto max-w-3xl px-6 py-16 pt-32 sm:py-24 sm:pt-36">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Contacto
        </p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Hablemos sobre la agenda online de tu negocio
        </h1>
        <p className="mt-5 text-base leading-7 text-muted-foreground">
          Escribinos desde el formulario y seguí la conversación en la web. WhatsApp sigue disponible
          si preferís chat rápido.
        </p>

        <section className="mt-10 rounded-2xl border border-rule bg-card p-5 sm:p-6">
          <h2 className="font-display text-xl font-semibold text-foreground">Escribinos acá</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Respondemos desde el panel y te avisamos por email. Guardá el link del hilo para volver
            cuando quieras.
          </p>
          <div className="mt-6">
            <ContactInquiryForm />
          </div>
        </section>

        <div className="mt-10 divide-y divide-rule border-y border-rule">
          <a
            href={getSiteWhatsAppHref("Hola, quiero conocer ReservaYa.")}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-4 py-5 transition-colors hover:text-sello"
          >
            <MessageCircle className="mt-0.5 size-5 shrink-0 text-sello" aria-hidden="true" />
            <div>
              <p className="font-semibold text-foreground">WhatsApp comercial</p>
              <p className="mt-1 text-sm text-muted-foreground">{siteContact.whatsappLabel}</p>
            </div>
          </a>
          <div className="flex items-start gap-4 py-5">
            <Mail className="mt-0.5 size-5 shrink-0 text-sello" aria-hidden="true" />
            <div>
              <a
                href={`mailto:${siteContact.email}`}
                className="inline-flex font-semibold text-foreground underline-offset-4 hover:underline"
              >
                {siteContact.email}
              </a>
              <p className="mt-1 text-sm text-muted-foreground">
                Canal secundario. Preferimos el formulario para llevar seguimiento.
              </p>
            </div>
          </div>
        </div>

        <section className="mt-10 space-y-5 text-sm leading-7 text-foreground/80">
          <h2 className="font-display text-xl font-semibold text-foreground">
            Qué podemos resolver por este canal
          </h2>
          <p>
            Podemos ayudarte a entender si ReservaYa encaja con tu operación, revisar el flujo de
            reserva pública, explicar cómo se configuran servicios y disponibilidad, y estimar los
            pasos necesarios para publicar tu página de turnos.
          </p>
          <p>
            También respondemos consultas sobre pagos online, recordatorios, configuración de
            Mercado Pago y migración desde planillas o agendas manuales.
          </p>
          <p>
            Si ya tenés una cuenta, incluí el nombre del negocio, el slug público y una descripción
            breve del problema. Para consultas comerciales, contanos rubro, cantidad de servicios y
            cómo tomás reservas hoy.
          </p>
          <p>Horario de atención: {siteContact.businessHours}.</p>
          <p>
            <Link href="/precios" className="font-medium text-foreground underline underline-offset-4">
              Ver precios
            </Link>
          </p>
        </section>
      </div>
    </LandingPageShell>
  );
}
