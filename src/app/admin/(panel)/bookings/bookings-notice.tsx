"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { cn } from "@/lib/utils";

type BookingsNoticeProps = {
  message: string;
  tone: "success" | "error";
  dismissAfterMs?: number;
};

export function BookingsNotice({
  message,
  tone,
  dismissAfterMs = 2500,
}: Readonly<BookingsNoticeProps>) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (tone !== "success") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      router.replace(pathname, { scroll: false });
    }, dismissAfterMs);

    return () => window.clearTimeout(timeoutId);
  }, [dismissAfterMs, pathname, router, tone]);

  return (
    <section
      className={cn(
        "w-full rounded-xl border px-4 py-3 text-sm shadow-sm transition-opacity duration-300",
        tone === "error"
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
      )}
    >
      {message}
    </section>
  );
}
