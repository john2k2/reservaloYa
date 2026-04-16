"use client";

import { useState } from "react";
import { useTransition } from "react";
import {
  enableTrialAction,
  extendTrialAction,
  cancelSubscriptionAction,
  unlockSubscriptionAction,
} from "@/server/actions/platform";

type TrialAction =
  | { type: "enable"; days: number }
  | { type: "extend"; days: number }
  | { type: "cancel" }
  | { type: "unlock" };

interface TrialActionsProps {
  businessId: string;
  subscriptionStatus: string;
  lockedAt?: string;
}

export function TrialActions({
  businessId,
  subscriptionStatus,
  lockedAt,
}: TrialActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [showEnableForm, setShowEnableForm] = useState(false);
  const [showExtendForm, setShowExtendForm] = useState(false);
  const [days, setDays] = useState("90");

  function handleAction(action: TrialAction) {
    startTransition(async () => {
      switch (action.type) {
        case "enable":
          await enableTrialAction(businessId, action.days);
          setShowEnableForm(false);
          break;
        case "extend":
          await extendTrialAction(businessId, action.days);
          setShowExtendForm(false);
          break;
        case "cancel":
          if (window.confirm("¿Cancelar la suscripción de este negocio?")) {
            await cancelSubscriptionAction(businessId);
          }
          break;
        case "unlock":
          if (window.confirm("¿Desbloquear la suscripción de este negocio?")) {
            await unlockSubscriptionAction(businessId);
          }
          break;
      }
    });
  }

  if (showEnableForm) {
    return (
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={days}
          onChange={(e) => setDays(e.target.value)}
          className="w-16 h-6 text-xs border border-border rounded px-1"
          min="1"
          max="365"
        />
        <span className="text-xs text-muted-foreground">días</span>
        <button
          onClick={() => handleAction({ type: "enable", days: parseInt(days, 10) || 90 })}
          disabled={isPending}
          className="text-xs font-medium text-emerald-600 hover:text-emerald-800 disabled:opacity-50"
        >
          {isPending ? "..." : "OK"}
        </button>
        <button
          onClick={() => setShowEnableForm(false)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          ✕
        </button>
      </div>
    );
  }

  if (showExtendForm) {
    return (
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={days}
          onChange={(e) => setDays(e.target.value)}
          className="w-16 h-6 text-xs border border-border rounded px-1"
          min="1"
          max="365"
        />
        <span className="text-xs text-muted-foreground">días</span>
        <button
          onClick={() => handleAction({ type: "extend", days: parseInt(days, 10) || 30 })}
          disabled={isPending}
          className="text-xs font-medium text-amber-600 hover:text-amber-800 disabled:opacity-50"
        >
          {isPending ? "..." : "OK"}
        </button>
        <button
          onClick={() => setShowExtendForm(false)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {(subscriptionStatus === "none" || subscriptionStatus === "cancelled") && (
        <button
          onClick={() => setShowEnableForm(true)}
          className="text-xs font-medium text-emerald-600 hover:text-emerald-800 disabled:opacity-50"
          disabled={isPending}
        >
          + Trial
        </button>
      )}

      {(subscriptionStatus === "trial" || subscriptionStatus === "active") && (
        <>
          <button
            onClick={() => setShowExtendForm(true)}
            className="text-xs font-medium text-amber-600 hover:text-amber-800 disabled:opacity-50"
            disabled={isPending}
          >
            Extender
          </button>
          <button
            onClick={() => handleAction({ type: "cancel" })}
            className="text-xs font-medium text-red-500 hover:text-red-700 disabled:opacity-50"
            disabled={isPending}
          >
            Cancelar
          </button>
        </>
      )}

      {lockedAt && (
        <button
          onClick={() => handleAction({ type: "unlock" })}
          className="text-xs font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50"
          disabled={isPending}
        >
          Desbloquear
        </button>
      )}
    </div>
  );
}