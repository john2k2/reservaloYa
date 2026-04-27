import Link from "next/link";
import type { Metadata } from "next";
import { productName } from "@/constants/site";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Política de privacidad",
  description: `Cómo ${productName} recopila, usa y protege tus datos personales.`,
  path: "/privacidad",
});

export default function PrivacyPage() {
  return (
    <main
      id="main-content"
      className="min-h-screen bg-background font-sans text-foreground selection:bg-foreground selection:text-background"
    >
      <div className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
        <Link
          href="/"
          className="inline-flex h-11 items-center text-sm font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
        >
          ← Volver al inicio
        </Link>

        <h1 className="mt-8 text-3xl font-bold tracking-tight sm:text-4xl">
          Política de privacidad
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Última actualización: marzo de 2026
        </p>

        <div className="mt-10 space-y-10 text-sm leading-7 text-foreground/80">
          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">1. Quiénes somos</h2>
            <p>
              {productName} es una plataforma de gestión de turnos online para negocios
              de servicios. Operamos como proveedor de software (SaaS) para negocios que
              ofrecen reservas a sus clientes.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">2. Qué datos recopilamos</h2>
            <p className="mb-3">Recopilamos los siguientes datos según el rol:</p>
            <p className="mb-2 font-medium text-foreground">Dueños de negocio (administradores):</p>
            <ul className="ml-4 list-disc space-y-1">
              <li>Nombre completo y correo electrónico (para crear la cuenta)</li>
              <li>Nombre del negocio, dirección y teléfono</li>
              <li>Datos de configuración de servicios y disponibilidad</li>
            </ul>
            <p className="mb-2 mt-4 font-medium text-foreground">Clientes que realizan reservas:</p>
            <ul className="ml-4 list-disc space-y-1">
              <li>Nombre completo y correo electrónico (requeridos para confirmar el turno)</li>
              <li>Número de WhatsApp (opcional, para recordatorios)</li>
              <li>Notas adicionales que el cliente decide compartir</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">3. Para qué usamos tus datos</h2>
            <ul className="ml-4 list-disc space-y-1">
              <li>Confirmar y gestionar reservas</li>
              <li>Enviar emails de confirmación y recordatorios del turno</li>
              <li>Permitir al negocio administrar su agenda</li>
              <li>Mejorar la experiencia del servicio</li>
            </ul>
            <p className="mt-3">
              No vendemos, alquilamos ni compartimos tus datos con terceros con fines
              comerciales. Los datos de clientes son accesibles únicamente por el negocio
              con quien realizaste la reserva.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">4. Cookies y almacenamiento local</h2>
            <p>
              Usamos <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">localStorage</code> para
              recordar la preferencia de tema (claro/oscuro) del usuario. No usamos cookies
              de rastreo ni publicidad de terceros.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">5. Retención de datos</h2>
            <p>
              Los datos de reservas se conservan mientras el negocio mantenga activa su cuenta.
              Cuando un negocio cancela el servicio, sus datos son eliminados en un plazo de
              30 días.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">6. Tus derechos</h2>
            <p>
              Podés solicitar el acceso, corrección o eliminación de tus datos en cualquier
              momento escribiéndonos. Si realizaste una reserva en un negocio que usa
              {productName}, contactá directamente a ese negocio para gestionar tus datos.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">7. Seguridad</h2>
            <p>
              Tomamos medidas técnicas razonables para proteger tus datos: comunicaciones
              encriptadas (HTTPS), acceso restringido por autenticación y validaciones en
              servidor para cada operación.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">8. Cambios a esta política</h2>
            <p>
              Podemos actualizar esta política. Cuando lo hagamos, notificaremos a los
              administradores por email y actualizaremos la fecha al inicio de esta página.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">9. Contacto</h2>
            <p>
              Para consultas sobre privacidad escribinos a{" "}
              <a
                href="mailto:hola@reservaya.app"
                className="font-medium text-foreground underline underline-offset-4"
              >
                hola@reservaya.app
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-16 flex gap-4 text-sm text-muted-foreground">
          <Link href="/terminos" className="underline underline-offset-4 hover:text-foreground transition-colors">
            Términos de uso
          </Link>
          <Link href="/" className="underline underline-offset-4 hover:text-foreground transition-colors">
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
