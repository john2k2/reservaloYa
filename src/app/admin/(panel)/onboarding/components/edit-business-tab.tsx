import type { Dispatch, SetStateAction } from "react";

import { Store } from "lucide-react";

import { FormField } from "./form-field";

type ValidationFn = (value: string) => string | null;

type BusinessData = {
  name: string;
  phone: string;
  email: string;
  address: string;
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
          <p className="mt-1 text-sm text-muted-foreground">Informacion basica de tu negocio.</p>
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
          hint="Este nombre aparecera en el titulo de tu pagina"
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
            hint="Con codigo de pais para WhatsApp"
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
          label="Direccion"
          placeholder="Ej: Honduras 4821, Palermo"
          required
          value={businessData.address}
          onChange={(value) => setBusinessData((d) => ({ ...d, address: value }))}
          validate={validations.address}
          hint="Direccion completa de tu local"
        />
      </div>
    </article>
  );
}
