"use client";

import { useTransition } from "react";

import { toggleUserActiveAction } from "@/server/actions/platform";

type UserActionsProps = {
  userId: string;
  businessId: string;
  active: boolean;
  email: string;
};

export function UserActions({ userId, businessId, active, email }: UserActionsProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        const next = !active;
        const label = next ? "activar" : "desactivar";
        if (!window.confirm(`¿${label[0].toUpperCase()}${label.slice(1)} a ${email}?`)) return;
        startTransition(async () => {
          await toggleUserActiveAction(userId, next, businessId);
        });
      }}
      className={
        active
          ? "text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
          : "text-xs font-medium text-emerald-700 hover:text-emerald-900 disabled:opacity-50"
      }
    >
      {isPending ? "..." : active ? "Desactivar" : "Activar"}
    </button>
  );
}
