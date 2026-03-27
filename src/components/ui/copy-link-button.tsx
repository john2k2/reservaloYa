"use client";

import { useState } from "react";
import { Check, Copy, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

type CopyLinkButtonProps = {
  url: string;
  label?: string;
  className?: string;
  variant?: "default" | "outline" | "ghost";
};

export function CopyLinkButton({
  url,
  label = "Copiar link de reservas",
  className,
  variant = "outline",
}: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback para navegadores sin clipboard API
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const base =
    "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-ring";

  const variants = {
    default: "bg-foreground text-background hover:bg-foreground/90",
    outline: "border border-border bg-background hover:bg-secondary/40",
    ghost: "hover:bg-secondary/40",
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(base, variants[variant], className)}
      title={url}
    >
      {copied ? (
        <>
          <Check className="size-4 text-emerald-500" />
          <span className="text-emerald-600 dark:text-emerald-400">¡Copiado!</span>
        </>
      ) : (
        <>
          <Copy className="size-4" />
          {label}
        </>
      )}
    </button>
  );
}

/** Versión compacta: muestra la URL + botón copiar, útil en dashboards */
export function BookingLinkBar({
  businessSlug,
  appUrl,
}: {
  businessSlug: string;
  appUrl: string;
}) {
  const bookingUrl = `${appUrl}/${businessSlug}/reservar`;

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 rounded-xl border border-border/60 bg-secondary/10 p-3 sm:p-4">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Link2 className="size-4 shrink-0 text-muted-foreground" />
        <span className="text-sm text-muted-foreground truncate">{bookingUrl}</span>
      </div>
      <CopyLinkButton
        url={bookingUrl}
        label="Copiar link"
        variant="default"
        className="shrink-0 justify-center sm:justify-start"
      />
    </div>
  );
}
