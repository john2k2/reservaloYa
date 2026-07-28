import { cn } from "@/lib/utils";

type WeeklyHourSlot = {
  dayLabel: string;
  hoursLabel: string;
};

type HoursLocationSectionProps = {
  accentColor: string;
  surfaceTint: string;
  weeklyHours: WeeklyHourSlot[];
  businessName: string;
  address?: string | null;
  mapEmbedSrc: string;
};

export function HoursLocationSection({
  accentColor,
  surfaceTint,
  weeklyHours,
  businessName,
  address,
  mapEmbedSrc,
}: HoursLocationSectionProps) {
  const hasWeeklyHours = weeklyHours.length > 0;

  return (
    <section className="border-t border-border/40 py-12 sm:py-16 lg:py-20" style={{ backgroundColor: surfaceTint }}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14 lg:items-start">

          {/* Horarios */}
          {hasWeeklyHours && (
            <div>
              <div className="mb-6">
                <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest" style={{ color: accentColor }}>
                  Horarios
                </p>
                <h2 className="mt-2 text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
                  Días y horarios de atención
                </h2>
              </div>
              <div className="overflow-hidden rounded-2xl border border-border/60 bg-background shadow-sm">
                {weeklyHours.map((slot, idx) => {
                  const isClosed = slot.hoursLabel.toLowerCase().includes("cerrado");
                  return (
                    <div
                      key={slot.dayLabel}
                      className={cn(
                        "flex items-center justify-between px-5 py-3.5 text-sm",
                        idx !== 0 && "border-t border-border/40"
                      )}
                    >
                      {/* Los días cerrados se atenúan con color, no con opacity: un
                          opacity-50 sobre toda la fila bajaba el contraste a 1.87:1
                          (WCAG AA pide 4.5:1) y dejaba el texto casi ilegible. */}
                      <span
                        className={cn(
                          "font-medium",
                          isClosed ? "text-muted-foreground" : "text-foreground"
                        )}
                      >
                        {slot.dayLabel}
                      </span>
                      <span className={cn("text-right", isClosed ? "text-muted-foreground" : "font-semibold")} style={isClosed ? undefined : { color: accentColor }}>
                        {slot.hoursLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ubicación */}
          <div className={hasWeeklyHours ? "" : "lg:col-span-2"}>
            <div className="mb-6">
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest" style={{ color: accentColor }}>
                Ubicación
              </p>
              <h2 className="mt-2 text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
                {address ?? "Dirección a definir"}
              </h2>
            </div>
            <div className="overflow-hidden rounded-2xl border border-border/60 shadow-sm">
              <iframe
                title={`Mapa de ${businessName}`}
                src={mapEmbedSrc}
                width="640"
                height="320"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-56 sm:h-72 lg:h-80 w-full"
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
