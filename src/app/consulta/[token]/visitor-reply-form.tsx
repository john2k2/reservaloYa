"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { replyAsVisitorAction } from "@/server/actions/support-inbox";
import { cn } from "@/lib/utils";

interface VisitorReplyFormProps {
  accessToken: string;
  disabled?: boolean;
}

export function VisitorReplyForm({ accessToken, disabled }: VisitorReplyFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (disabled) {
    return (
      <p className="rounded-xl border border-rule bg-secondary/40 px-4 py-3 text-sm text-muted-foreground">
        Esta consulta está cerrada. Si necesitás algo más, abrí una nueva desde{" "}
        <Link href="/contacto" className="font-medium text-sello underline underline-offset-2">
          Contacto
        </Link>
        .
      </p>
    );
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const formData = new FormData(form);
        setError(null);
        startTransition(async () => {
          const result = await replyAsVisitorAction(accessToken, formData);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          form.reset();
          router.refresh();
        });
      }}
    >
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-foreground">Tu respuesta</span>
        <textarea
          name="body"
          required
          minLength={1}
          maxLength={4000}
          rows={4}
          className="w-full rounded-xl border border-rule bg-background px-3 py-2.5 text-sm outline-none ring-sello/30 focus:ring-2"
          placeholder="Escribí acá para seguir la conversación..."
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
          "inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-semibold",
          "bg-ink text-paper transition-transform hover:-translate-y-0.5 active:scale-[0.98]",
          "disabled:cursor-not-allowed disabled:opacity-70"
        )}
      >
        {isPending ? "Enviando..." : "Enviar mensaje"}
      </button>
    </form>
  );
}
