"use client";

import { useEffect } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";

type ToastType = "success" | "error" | "info";

const TOAST_PARAMS = [
  "error",
  "success",
  "saved",
  "savedWeek",
  "savedDay",
  "blocked",
  "blockedMessage",
  "unblocked",
  "reminders",
];

function buildToast(
  searchParams: URLSearchParams,
  pathname: string
): { message: string; type: ToastType } | null {
  const error = searchParams.get("error");
  if (error) return { message: error, type: "error" };

  const success = searchParams.get("success");
  if (success) return { message: success, type: "success" };

  const reminders = searchParams.get("reminders");
  if (reminders) return { message: reminders, type: "info" };

  const savedWeek = searchParams.get("savedWeek");
  if (savedWeek) return { message: "Disponibilidad semanal actualizada.", type: "success" };

  const savedDay = searchParams.get("savedDay");
  if (savedDay) return { message: `Horario actualizado para ${savedDay}.`, type: "success" };

  const blockedMessage = searchParams.get("blockedMessage");
  if (blockedMessage) return { message: blockedMessage, type: "success" };

  const blocked = searchParams.get("blocked");
  if (blocked) return { message: `Bloqueo agregado para ${blocked}.`, type: "success" };

  const unblocked = searchParams.get("unblocked");
  if (unblocked) return { message: `Bloqueo quitado de ${unblocked}.`, type: "success" };

  const saved = searchParams.get("saved");
  if (saved) {
    if (pathname.startsWith("/admin/bookings")) {
      return {
        message: saved === "nuevo" ? "Turno creado correctamente." : "Turno guardado correctamente.",
        type: "success",
      };
    }
    if (pathname.startsWith("/admin/services")) {
      return { message: `Servicio "${saved}" guardado.`, type: "success" };
    }
    return { message: "Cambios guardados.", type: "success" };
  }

  return null;
}

function ToastReaderInner() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    const toast = buildToast(searchParams, pathname);
    if (!toast) return;

    showToast(toast.message, toast.type);

    const params = new URLSearchParams(searchParams.toString());
    TOAST_PARAMS.forEach((p) => params.delete(p));
    const query = params.toString();
    router.replace(pathname + (query ? `?${query}` : ""), { scroll: false });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  return null;
}

export function AdminToastReader() {
  return <ToastReaderInner />;
}
