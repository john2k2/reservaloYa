"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface ThreadAutoRefreshProps {
  enabled?: boolean;
  intervalMs?: number;
}

/**
 * Refresca el server component del hilo cada `intervalMs` mientras la pestaña
 * está visible, para que los mensajes de la otra parte aparezcan sin que
 * alguien tenga que recargar manualmente.
 */
export function ThreadAutoRefresh({ enabled = true, intervalMs = 4000 }: ThreadAutoRefreshProps) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;

    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [enabled, intervalMs, router]);

  return null;
}
