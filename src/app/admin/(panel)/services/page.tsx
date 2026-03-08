import Link from "next/link";
import { Clock3 } from "lucide-react";

import { getAdminServicesData, getAdminShellData } from "@/server/queries/admin";

export default async function AdminServicesPage() {
  const [services, shellData] = await Promise.all([
    getAdminServicesData(),
    getAdminShellData(),
  ]);

  return (
    <div className="flex flex-col items-center space-y-8">
      <section className="flex w-full flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Servicios
          </h2>
          <p className="mt-2 text-base text-muted-foreground">
            Revisión rápida de lo que vendes, su duración y el precio visible en la página pública.
          </p>
        </div>
        <span className="soft-chip">{services.length} activos</span>
      </section>

      <section className="w-full overflow-hidden rounded-xl border border-border/60 bg-background shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-secondary/30">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Servicio
              </th>
              <th className="hidden px-6 py-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground sm:table-cell">
                Descripción
              </th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Duración
              </th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Precio
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {services.map((service) => (
              <tr key={service.id} className="transition-colors hover:bg-secondary/10">
                <td className="px-6 py-4 font-medium text-foreground">{service.name}</td>
                <td className="hidden max-w-[280px] truncate px-6 py-4 text-muted-foreground sm:table-cell">
                  {service.description}
                </td>
                <td className="px-6 py-4 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock3 aria-hidden="true" className="size-3.5" />
                    {service.durationMinutes} min
                  </div>
                </td>
                <td className="px-6 py-4 font-medium text-foreground">{service.priceLabel}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {services.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No hay servicios creados todavía.
          </div>
        )}
      </section>

      {shellData && (
        <section className="w-full rounded-xl border border-border/60 bg-secondary/10 p-6">
          <p className="text-sm text-muted-foreground">
            Para validar esta tabla contra la experiencia real del cliente, abre la demo pública del negocio y comprueba el orden y copy de los servicios.
          </p>
          <Link
            href={`/${shellData.businessSlug}`}
            className="mt-4 inline-flex h-11 items-center text-sm font-medium text-foreground underline underline-offset-4"
          >
            Abrir página pública
          </Link>
        </section>
      )}
    </div>
  );
}
