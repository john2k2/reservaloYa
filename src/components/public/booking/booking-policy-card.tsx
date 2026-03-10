import { Shield } from "lucide-react";

export function BookingPolicyCard() {
  return (
    <div className="rounded-xl border border-border/70 bg-secondary/30 p-4">
      <div className="flex items-start gap-3">
        <Shield className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Políticas de reserva</p>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li>• Puedes cancelar o reprogramar hasta 24hs antes</li>
            <li>• Si el negocio activa recordatorios, te avisaremos por el canal configurado</li>
            <li>• Llega 10 minutos antes de tu horario</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
