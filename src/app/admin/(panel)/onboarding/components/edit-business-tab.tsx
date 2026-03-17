import type { Dispatch, SetStateAction } from "react";

import { Store } from "lucide-react";

import { FormField } from "./form-field";

type ValidationFn = (value: string) => string | null;

type BusinessData = {
  name: string;
  phone: string;
  email: string;
  address: string;
  cancellationPolicy: string;
};

type EditBusinessTabProps = {
  businessData: BusinessData;
  setBusinessData: Dispatch<SetStateAction<BusinessData>>;
  validations: {
    name: ValidationFn;
    phone: ValidationFn;
    email: ValidationFn;
    address: ValidationFn;
  };
};

export function EditBusinessTab({
  businessData,
  setBusinessData,
  validations,
}: EditBusinessTabProps) {
  return (
    <article className="rounded-3xl border border-border/60 bg-card p-8 shadow-sm">
      <div className="mb-8 flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-secondary/30">
          <Store aria-hidden="true" className="size-5 text-foreground" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-card-foreground">Datos del negocio</h3>
          <p className="mt-1 text-sm text-muted-foreground">Información básica de tu negocio.</p>
        </div>
      </div>

      <div className="space-y-6">
        <FormField
          id="name"
          label="Nombre del negocio"
          placeholder="Ej: Aura Studio Palermo"
          required
          value={businessData.name}
          onChange={(value) => setBusinessData((d) => ({ ...d, name: value }))}
          validate={validations.name}
          hint="Este nombre aparecerá en el título de tu página"
        />

        <div className="grid gap-6 sm:grid-cols-2">
          <FormField
            id="phone"
            label="WhatsApp"
            type="tel"
            placeholder="Ej: +54 11 5555 0000"
            required
            value={businessData.phone}
            onChange={(value) => setBusinessData((d) => ({ ...d, phone: value }))}
            validate={validations.phone}
            hint="Con código de país para WhatsApp"
          />

          <FormField
            id="email"
            label="Email"
            type="email"
            placeholder="Ej: hola@negocio.com"
            value={businessData.email}
            onChange={(value) => setBusinessData((d) => ({ ...d, email: value }))}
            validate={validations.email}
            hint="Para recibir notificaciones de turnos"
          />
        </div>

        <FormField
          id="address"
          label="Dirección"
          placeholder="Ej: Honduras 4821, Palermo"
          required
          value={businessData.address}
          onChange={(value) => setBusinessData((d) => ({ ...d, address: value }))}
          validate={validations.address}
          hint="Dirección completa de tu local"
        />

        <div className="space-y-1.5">
          <label htmlFor="cancellationPolicy" className="block text-sm font-medium text-foreground">
            Política de cancelación
          </label>
          <textarea
            id="cancellationPolicy"
            name="cancellationPolicy"
            rows={3}
            maxLength={300}
            placeholder="Ej: Cancelaciones con 24hs de anticipación sin cargo. Cancelaciones tardías pueden tener un cargo del 50%."
            value={businessData.cancellationPolicy}
            onChange={(e) => setBusinessData((d) => ({ ...d, cancellationPolicy: e.target.value }))}
            className="w-full resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p className="text-xs text-muted-foreground">
            Se muestra en la página pública de tu negocio. Máx. 300 caracteres.
          </p>
        </div>
      </div>
    </article>
  );
}
