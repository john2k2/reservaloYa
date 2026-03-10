import type { Dispatch, SetStateAction } from "react";

import { Store } from "lucide-react";

import { FormField } from "./form-field";
import { OnboardingStepActions } from "./onboarding-step-actions";

type Step1Data = {
  templateSlug: string;
  name: string;
  slug: string;
  phone: string;
  email: string;
  address: string;
};

type ValidationFn = (value: string) => string | null;

type BusinessStepProps = {
  hasExistingBusiness: boolean;
  step1Data: Step1Data;
  setStep1Data: Dispatch<SetStateAction<Step1Data>>;
  templates: { slug: string; label: string; category: string }[];
  validations: {
    name: ValidationFn;
    slug: ValidationFn;
    phone: ValidationFn;
    email: ValidationFn;
    address: ValidationFn;
  };
  isSubmitting: boolean;
  isStepValid: boolean;
  onNext: () => void;
  onSubmit: () => void;
};

export function BusinessStep({
  hasExistingBusiness,
  step1Data,
  setStep1Data,
  templates,
  validations,
  isSubmitting,
  isStepValid,
  onNext,
  onSubmit,
}: BusinessStepProps) {
  return (
    <article className="rounded-3xl border border-border/60 bg-card p-8 shadow-sm">
      <div className="mb-8 flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-secondary/30">
          <Store aria-hidden="true" className="size-5 text-foreground" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-card-foreground">
            {hasExistingBusiness ? "Paso 1: Editar datos del negocio" : "Paso 1: Datos del negocio"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasExistingBusiness
              ? "Modifica los datos basicos de tu negocio. Los cambios se aplican inmediatamente."
              : "Completa los datos basicos para crear tu pagina. El link publico es como tus clientes accederan."}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <FormField
          id="templateSlug"
          label="Tipo de negocio"
          type="select"
          required
          value={step1Data.templateSlug}
          onChange={(value) => setStep1Data((d) => ({ ...d, templateSlug: value }))}
          options={templates.map((t) => ({
            value: t.slug,
            label: `${t.label} - ${t.category}`,
          }))}
          hint="Elegi el tipo que mas se parezca a tu negocio"
        />

        <FormField
          id="name"
          label="Nombre del negocio"
          placeholder="Ej: Aura Studio Palermo"
          required
          value={step1Data.name}
          onChange={(value) => setStep1Data((d) => ({ ...d, name: value }))}
          validate={validations.name}
          hint="Este nombre aparecera en el titulo de tu pagina"
        />

        <div className="grid gap-6 sm:grid-cols-2">
          <FormField
            id="slug"
            label="Link publico"
            placeholder="Ej: aura-studio"
            value={step1Data.slug}
            onChange={(value) =>
              setStep1Data((d) => ({ ...d, slug: value.toLowerCase().replace(/\s+/g, "-") }))
            }
            validate={validations.slug}
            hint="reservaya.com/tu-link"
          />

          <FormField
            id="phone"
            label="WhatsApp"
            type="tel"
            placeholder="Ej: +54 11 5555 0000"
            required
            value={step1Data.phone}
            onChange={(value) => setStep1Data((d) => ({ ...d, phone: value }))}
            validate={validations.phone}
            hint="Con codigo de pais para WhatsApp"
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <FormField
            id="email"
            label="Email"
            type="email"
            placeholder="Ej: hola@negocio.com"
            value={step1Data.email}
            onChange={(value) => setStep1Data((d) => ({ ...d, email: value }))}
            validate={validations.email}
            hint="Para recibir notificaciones de turnos"
          />

          <FormField
            id="address"
            label="Direccion"
            placeholder="Ej: Honduras 4821, Palermo"
            required
            value={step1Data.address}
            onChange={(value) => setStep1Data((d) => ({ ...d, address: value }))}
            validate={validations.address}
            hint="Direccion completa de tu local"
          />
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Paso 1 de 4</span>
        <OnboardingStepActions
          onNext={hasExistingBusiness ? onNext : undefined}
          onPrimary={onSubmit}
          primaryLabel={
            isSubmitting
              ? hasExistingBusiness
                ? "Guardando..."
                : "Creando..."
              : hasExistingBusiness
                ? "Guardar cambios"
                : "Crear negocio"
          }
          primaryDisabled={!isStepValid}
          nextLabel="Siguiente paso"
        />
      </div>
    </article>
  );
}
