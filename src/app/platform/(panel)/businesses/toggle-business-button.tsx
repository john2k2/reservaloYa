"use client";

import { useTransition } from "react";
import { toggleBusinessActiveAction } from "@/server/actions/platform";

export function ToggleBusinessButton({
  businessId,
  active,
  businessName,
}: {
  businessId: string;
  active: boolean;
  businessName: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const confirmed = window.confirm(
      active
        ? `¿Desactivar "${businessName}"? El negocio no podrá acceder al panel.`
        : `¿Activar "${businessName}"?`
    );
    if (!confirmed) return;

    startTransition(async () => {
      await toggleBusinessActiveAction(businessId, !active);
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`text-xs font-medium transition-colors disabled:opacity-50 ${
        active
          ? "text-red-500 hover:text-red-700"
          : "text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
      }`}
    >
      {isPending ? "..." : active ? "Suspender" : "Activar"}
    </button>
  );
}
