"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  exiting?: boolean;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

const DURATIONS: Record<ToastType, number> = {
  success: 4000,
  info: 4000,
  error: 8000,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => hideToast(id), DURATIONS[type]);
    },
    [hideToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <ToastContainer toasts={toasts} onHide={hideToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, onHide }: { toasts: Toast[]; onHide: (id: string) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onHide={() => onHide(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onHide }: { toast: Toast; onHide: () => void }) {
  const icons: Record<ToastType, ReactNode> = {
    success: <CheckCircle className="size-5 shrink-0 text-success" />,
    error: <AlertCircle className="size-5 shrink-0 text-destructive" />,
    info: <Info className="size-5 shrink-0 text-foreground" />,
  };

  const styles: Record<ToastType, string> = {
    success: "border-success/20 bg-success/10",
    error: "border-destructive/20 bg-destructive/10",
    info: "border-border/60 bg-card",
  };

  return (
    <div
      className={cn(
        "flex min-w-[300px] max-w-md items-center gap-3 rounded-lg border p-4 shadow-lg transition-all duration-300",
        toast.exiting
          ? "translate-x-2 opacity-0"
          : "animate-in slide-in-from-bottom-2",
        styles[toast.type]
      )}
      role="alert"
    >
      {icons[toast.type]}
      <p className="flex-1 text-sm font-medium text-foreground">{toast.message}</p>
      <button
        onClick={onHide}
        className="rounded p-1 text-muted-foreground transition-colors hover:bg-background/80"
        aria-label="Cerrar notificación"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
