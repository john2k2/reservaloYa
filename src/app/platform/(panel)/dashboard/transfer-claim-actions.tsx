"use client";

import { useState, useTransition } from "react";
import { Check, ExternalLink, X } from "lucide-react";

import {
  approveTransferClaimAction,
  rejectTransferClaimAction,
} from "@/server/actions/platform";

interface TransferClaimActionsProps {
  claimId: string;
  businessId: string;
  receiptUrl: string | null;
  receiptMime: string | null;
}

export function TransferClaimActions({
  claimId,
  businessId,
  receiptUrl,
  receiptMime,
}: TransferClaimActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: "approve" | "reject") {
    startTransition(async () => {
      setError(null);
      try {
        if (action === "approve") {
          if (!window.confirm("¿Aprobar este comprobante y activar la suscripción (+30 días)?")) {
            return;
          }
          await approveTransferClaimAction(claimId, businessId);
          return;
        }
        const note = window.prompt("Motivo del rechazo (opcional):") ?? undefined;
        if (note === undefined) return;
        await rejectTransferClaimAction(claimId, businessId, note || undefined);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo completar la acción.");
      }
    });
  }

  const isImage = receiptMime?.startsWith("image/");

  return (
    <div className="flex flex-col items-end gap-2 shrink-0">
      {receiptUrl && (
        <a
          href={receiptUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-sky-700 hover:underline dark:text-sky-400"
        >
          {isImage ? "Ver comprobante" : "Abrir PDF"}
          <ExternalLink className="size-3" />
        </a>
      )}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={isPending}
          onClick={() => run("approve")}
          className="inline-flex h-7 items-center gap-1 rounded-md bg-emerald-600 px-2.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          <Check className="size-3" />
          Aprobar
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => run("reject")}
          className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-background px-2.5 text-xs font-semibold text-foreground hover:bg-secondary disabled:opacity-60"
        >
          <X className="size-3" />
          Rechazar
        </button>
      </div>
      {error && <p className="max-w-[200px] text-right text-[10px] text-red-600">{error}</p>}
    </div>
  );
}
