import Link from "next/link";
import type { Metadata } from "next";
import { productName } from "@/constants/site";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Términos de uso",
  description: `Condiciones de uso de ReservaYa: alcance del servicio, cuentas de negocio, reservas, pagos, cancelaciones y responsabilidades de la plataforma.`,
  path: "/terminos",
});

export default function TermsPage() {
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
          Términos de uso
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Última actualización: marzo de 2026
        </p>

        <div className="mt-10 space-y-10 text-sm leading-7 text-foreground/80">
          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">1. Aceptación</h2>
            <p>
              Al registrar un negocio o realizar una reserva en {productName} aceptás
              estos términos. Si no estás de acuerdo, no uses el servicio.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">2. El servicio</h2>
            <p>
              {productName} provee una plataforma para que negocios de servicios
              (peluquerías, estudios, consultorios y similares) gestionen turnos online y
              sus clientes puedan reservar sin fricciones.
            </p>
            <p className="mt-3">
              Somos un intermediario tecnológico. La relación contractual por los servicios
              reservados es entre el cliente y el negocio, no con {productName}.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">3. Cuenta de negocio</h2>
            <ul className="ml-4 list-disc space-y-1">
              <li>Debés tener al menos 18 años para crear una cuenta.</li>
              <li>Sos responsable de mantener la confidencialidad de tu contraseña.</li>
              <li>La información de tu negocio debe ser veraz y actualizada.</li>
              <li>Una cuenta es para un negocio. No podés revender el acceso.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">4. Uso correcto</h2>
            <p className="mb-2">Queda prohibido usar {productName} para:</p>
            <ul className="ml-4 list-disc space-y-1">
              <li>Actividades ilegales o fraudulentas</li>
              <li>Spam o comunicaciones no solicitadas a clientes</li>
              <li>Intentar vulnerar la seguridad de la plataforma</li>
              <li>Crear reservas falsas o interferir en la agenda de otros negocios</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">5. Pagos</h2>
            <p>
              Si el negocio habilitó pagos online, los cobros se procesan a través de
              MercadoPago. {productName} no almacena datos de tarjetas ni es responsable
              por fallas en la pasarela de pago. Los reembolsos son responsabilidad
              del negocio.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">6. Disponibilidad</h2>
            <p>
              Nos esforzamos por mantener el servicio disponible continuamente, pero no
              garantizamos disponibilidad ininterrumpida. Podemos realizar mantenimientos
              programados avisando con anticipación.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">7. Cancelación</h2>
            <p>
              Los negocios pueden cancelar su cuenta en cualquier momento. Los clientes
              pueden cancelar reservas según la política de cancelación de cada negocio.
              {productName} puede suspender cuentas que violen estos términos.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">8. Limitación de responsabilidad</h2>
            <p>
              {productName} no es responsable por daños indirectos, pérdidas de negocio,
              o perjuicios derivados del uso o imposibilidad de uso de la plataforma.
              Nuestra responsabilidad máxima se limita al monto pagado en los últimos
              30 días por el servicio.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">9. Cambios</h2>
            <p>
              Podemos modificar estos términos. Los cambios significativos se comunicarán
              por email a los administradores con al menos 15 días de anticipación.
              El uso continuado implica aceptación de los nuevos términos.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">10. Contacto</h2>
            <p>
              Para consultas sobre estos términos escribinos a{" "}
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
          <Link href="/privacidad" className="underline underline-offset-4 hover:text-foreground transition-colors">
            Política de privacidad
          </Link>
          <Link href="/" className="underline underline-offset-4 hover:text-foreground transition-colors">
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
