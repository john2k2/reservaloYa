"use client";

import { ArrowLeft } from "lucide-react";

export function BackButton() {
  return (
    <button
      type="button"
      onClick={() => window.history.back()}
      className="inline-flex h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-full border border-rule px-6 text-sm font-semibold text-foreground transition-colors hover:bg-secondary/50 sm:w-auto"
    >
      <ArrowLeft className="size-4 shrink-0" />
      Volver atrás
    </button>
  );
}
