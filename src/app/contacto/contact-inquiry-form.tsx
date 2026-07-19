"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { createSupportThreadAction } from "@/server/actions/support-inbox";
import { cn } from "@/lib/utils";

export function ContactInquiryForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        setError(null);
        startTransition(async () => {
          const result = await createSupportThreadAction(formData);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          if (result.accessToken) {
            router.push(`/consulta/${result.accessToken}`);
          }
        });
      }}
    >
      <input type="hidden" name="source" value="contacto" />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5 sm:col-span-1">
          <span className="text-sm font-medium text-foreground">Nombre</span>
          <input
            name="visitorName"
            required
            minLength={2}
            maxLength={120}
            autoComplete="name"
            className="h-11 w-full rounded-xl border border-rule bg-background px-3 text-sm outline-none ring-sello/30 focus:ring-2"
            placeholder="Tu nombre"
          />
        </label>
        <label className="block space-y-1.5 sm:col-span-1">
          <span className="text-sm font-medium text-foreground">Email</span>
          <input
            name="visitorEmail"
            type="email"
            required
            maxLength={200}
            autoComplete="email"
            className="h-11 w-full rounded-xl border border-rule bg-background px-3 text-sm outline-none ring-sello/30 focus:ring-2"
            placeholder="vos@negocio.com"
          />
        </label>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-foreground">
          Teléfono <span className="font-normal text-muted-foreground">(opcional)</span>
        </span>
        <input
          name="visitorPhone"
          type="tel"
          maxLength={30}
          autoComplete="tel"
          className="h-11 w-full rounded-xl border border-rule bg-background px-3 text-sm outline-none ring-sello/30 focus:ring-2"
          placeholder="+54 11 ..."
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-foreground">Mensaje</span>
        <textarea
          name="body"
          required
          minLength={10}
          maxLength={4000}
          rows={5}
          className="w-full rounded-xl border border-rule bg-background px-3 py-2.5 text-sm outline-none ring-sello/30 focus:ring-2"
          placeholder="Contanos rubro, cómo tomás reservas hoy y qué necesitás."
        />
      </label>

      {error && (
        <p className="rounded-xl border border-red-300/60 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-500/40 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className={cn(
          "inline-flex h-12 w-full items-center justify-center rounded-full px-6 text-sm font-semibold sm:w-auto",
          "bg-ink text-paper transition-transform hover:-translate-y-0.5 active:scale-[0.98]",
          "disabled:cursor-not-allowed disabled:opacity-70"
        )}
      >
        {isPending ? "Enviando..." : "Enviar consulta"}
      </button>

      <p className="text-xs text-muted-foreground">
        Te abrimos un hilo privado en la web para seguir la conversación. También vas a recibir avisos
        por email cuando respondamos.
      </p>
    </form>
  );
}
