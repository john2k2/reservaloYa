"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  closeSupportThreadAction,
  reopenSupportThreadAction,
  replyAsStaffAction,
} from "@/server/actions/support-inbox";
import { cn } from "@/lib/utils";

interface StaffReplyFormProps {
  threadId: string;
  isClosed: boolean;
}

export function StaffReplyForm({ threadId, isClosed }: StaffReplyFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {!isClosed && (
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
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Responder</span>
            <textarea
              name="body"
              required
              rows={4}
              maxLength={4000}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
              placeholder="Escribí la respuesta al visitante..."
            />
          </label>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={isPending}
            className={cn(
              "inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-semibold",
              "bg-foreground text-background hover:bg-foreground/90 disabled:opacity-60"
            )}
          >
            {isPending ? "Enviando..." : "Enviar respuesta"}
          </button>
        </form>
      )}

      <div className="flex flex-wrap gap-2">
        {isClosed ? (
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
            className="inline-flex h-9 items-center rounded-lg border border-border px-3 text-xs font-semibold hover:bg-secondary disabled:opacity-60"
          >
            Reabrir consulta
          </button>
        ) : (
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
            className="inline-flex h-9 items-center rounded-lg border border-border px-3 text-xs font-semibold hover:bg-secondary disabled:opacity-60"
          >
            Cerrar consulta
          </button>
        )}
      </div>
    </div>
  );
}
