"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface WhatsAppWidgetProps {
  phone: string;
  message?: string;
  className?: string;
}

export function WhatsAppWidget({ 
  phone, 
  message = "Hola, quiero hacer una consulta",
  className 
}: WhatsAppWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);

  const whatsappUrl = `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;

  return (
    <div className={cn("fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2", className)}>
      {/* Ventana de chat */}
      {isOpen && (
        <div className="mb-2 w-72 rounded-2xl bg-white p-4 shadow-2xl animate-in slide-in-from-bottom-2 fade-in duration-200">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 text-white">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">¿Necesitás ayuda?</p>
              <p className="text-xs text-gray-500">Respondemos en minutos</p>
            </div>
          </div>
          <div className="py-3">
            <p className="text-sm text-gray-600">
              Escribinos por WhatsApp y te ayudamos con tu reserva o cualquier consulta.
            </p>
          </div>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 py-3 text-sm font-medium text-white transition-colors hover:bg-green-600"
          >
            <MessageCircle className="h-4 w-4" />
            Iniciar conversación
          </a>
        </div>
      )}

      {/* Botón flotante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-200 hover:scale-110",
          isOpen ? "bg-gray-600 hover:bg-gray-700" : "bg-green-500 hover:bg-green-600"
        )}
        aria-label={isOpen ? "Cerrar chat" : "Abrir chat de WhatsApp"}
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <MessageCircle className="h-6 w-6 text-white" />
        )}
      </button>
    </div>
  );
}
