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
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-background px-4 py-6 text-center transition-colors hover:bg-secondary/40">
        <Upload className="size-5 text-muted-foreground" aria-hidden />
        <span className="text-sm font-medium text-foreground">
          {fileName ? fileName : "Subí el comprobante (JPG, PNG o PDF)"}
        </span>
        <span className="text-xs text-muted-foreground">Máximo 5 MB</span>
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
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className={cn(
          "inline-flex h-12 w-full items-center justify-center rounded-full px-6 text-sm font-semibold",
          "bg-emerald-600 text-white transition-transform hover:-translate-y-0.5 active:scale-[0.98]",
          "disabled:cursor-not-allowed disabled:opacity-70"
        )}
      >
        {isPending ? "Enviando..." : "Enviar comprobante"}
      </button>
    </form>
  );
}
