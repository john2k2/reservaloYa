"use client";

import { useTransition } from "react";
import { LogIn } from "lucide-react";
import { impersonateBusinessOwnerAction } from "@/server/actions/platform";

export function ImpersonateButton({
  businessId,
  ownerEmail,
}: {
  businessId: string;
  ownerEmail: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (ownerEmail === "—") return;

    startTransition(async () => {
      try {
        const link = await impersonateBusinessOwnerAction(businessId);
        window.open(link, "_blank");
      } catch (err) {
        alert(err instanceof Error ? err.message : "Error al generar el link");
      }
    });
  }

  if (ownerEmail === "—") return null;

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50 transition-colors"
    >
      <LogIn className="size-3" />
      {isPending ? "..." : "Panel"}
    </button>
  );
}
