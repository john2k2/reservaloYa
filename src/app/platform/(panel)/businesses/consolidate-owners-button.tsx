"use client";

import { useTransition } from "react";

import { consolidateOwnersAction } from "@/server/actions/platform";

type ConsolidateOwnersButtonProps = {
  businessId: string;
  businessName: string;
  preferredOwnerEmail?: string;
};

export function ConsolidateOwnersButton({
  businessId,
  businessName,
  preferredOwnerEmail,
}: ConsolidateOwnersButtonProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (
          !window.confirm(
            `¿Dejar un solo dueño en ${businessName}? Los demás pasan a staff inactivo.`
          )
        ) {
          return;
        }
        startTransition(async () => {
          await consolidateOwnersAction(businessId, preferredOwnerEmail);
        });
      }}
      className="text-xs font-medium text-violet-700 hover:text-violet-900 disabled:opacity-50"
    >
      {isPending ? "..." : "Unificar dueños"}
    </button>
  );
}
