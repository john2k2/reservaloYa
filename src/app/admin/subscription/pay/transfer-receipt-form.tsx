"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";

import { submitTransferReceiptAction } from "@/server/actions/billing-transfer";
import { cn } from "@/lib/utils";

export function TransferReceiptForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        setError(null);
        startTransition(async () => {
          const result = await submitTransferReceiptAction(formData);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          router.refresh();
        });
      }}
    >
      <label
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-7 text-center transition-colors",
          fileName
            ? "border-sello/50 bg-sello/5"
            : "border-rule bg-background hover:border-sello/40 hover:bg-sello/[0.04]"
        )}
      >
        <span className="flex size-10 items-center justify-center rounded-full bg-sello/10 text-sello">
          <Upload className="size-5" aria-hidden />
        </span>
        <span className="text-sm font-semibold text-foreground">
          {fileName ? fileName : "Subí el comprobante"}
        </span>
        <span className="text-xs text-muted-foreground">JPG, PNG o PDF · máximo 5 MB</span>
        <input
          type="file"
          name="receipt"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          required
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            setFileName(file?.name ?? null);
          }}
        />
      </label>

      {error && (
        <p className="rounded-lg border border-red-300/60 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-500/40 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className={cn(
          "inline-flex h-12 w-full items-center justify-center rounded-full px-6 text-sm font-semibold",
          "bg-ink text-paper shadow-[0_10px_24px_-12px_color-mix(in_srgb,var(--sello)_80%,transparent)]",
          "transition-transform hover:-translate-y-0.5 active:scale-[0.98]",
          "disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
        )}
      >
        {isPending ? "Enviando..." : "Enviar comprobante y activar"}
      </button>
    </form>
  );
}
