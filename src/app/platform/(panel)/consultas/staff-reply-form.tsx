"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  closeSupportThreadAction,
  reopenSupportThreadAction,
  replyAsStaffAction,
} from "@/server/actions/support-inbox";
import { buttonVariants } from "@/components/ui/button-variants";
import { LoadingButton } from "@/components/ui/loading-button";
import { cn } from "@/lib/utils";

interface StaffReplyFormProps {
  threadId: string;
  isClosed: boolean;
}

export function StaffReplyForm({ threadId, isClosed }: StaffReplyFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (isClosed) {
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-border/60 bg-secondary/20 px-4 py-3">
          <p className="text-sm text-muted-foreground">Esta consulta está cerrada.</p>
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              startTransition(async () => {
                setError(null);
                const result = await reopenSupportThreadAction(threadId);
                if (!result.ok) setError(result.error);
                else router.refresh();
              });
            }}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Reabrir consulta
          </button>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
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
          const result = await replyAsStaffAction(threadId, formData);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          form.reset();
          router.refresh();
        });
      }}
    >
      <label className="block space-y-3.5">
        <span className="text-sm font-medium text-foreground">Responder</span>
        <textarea
          name="body"
          required
          rows={3}
          maxLength={4000}
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-primary/30 focus:ring-2"
          placeholder="Escribí la respuesta al visitante..."
        />
      </label>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center justify-between gap-3">
        <LoadingButton isLoading={isPending} pendingLabel="Enviando...">
          Enviar respuesta
        </LoadingButton>
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              setError(null);
              const result = await closeSupportThreadAction(threadId);
              if (!result.ok) setError(result.error);
              else router.refresh();
            });
          }}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-muted-foreground")}
        >
          Cerrar consulta
        </button>
      </div>
    </form>
  );
}
