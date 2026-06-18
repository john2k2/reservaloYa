"use client";

import { useState } from "react";

const CSRF_TOKEN_HEADER = "X-CSRF-Token";

type SubscriptionPayButtonProps = {
  csrfToken: string;
  label: string;
};

export function SubscriptionPayButton({ csrfToken, label }: SubscriptionPayButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/payments/create-preference", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          [CSRF_TOKEN_HEADER]: csrfToken,
        },
      });

      const data = (await response.json().catch(() => ({ ok: false, error: "unknown" }))) as {
        ok?: boolean;
        error?: string;
        checkoutUrl?: string;
      };

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (!response.ok || !data.ok || !data.checkoutUrl) {
        const error = data.error ?? "preference_failed";
        window.location.href = `/admin/subscription/pay?error=${encodeURIComponent(error)}`;
        return;
      }

      window.location.href = data.checkoutUrl;
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-lg bg-[#00B1EA] px-4 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-[#0096D6] disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isLoading ? "Procesando..." : label}
      </button>
    </form>
  );
}
