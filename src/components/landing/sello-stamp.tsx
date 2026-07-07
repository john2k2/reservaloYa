import { cn } from "@/lib/utils";

interface SelloStampProps {
  label: string;
  sublabel?: string;
  rotate?: number;
  className?: string;
}

/**
 * Sello de goma violeta — el acento de firma del landing (ver plan de rediseño).
 * Decorativo por diseño: el significado ("plan confirmado", "turno confirmado")
 * ya está en el texto que lo rodea, así que no necesita anunciarse aparte.
 */
export function SelloStamp({ label, sublabel, rotate = -8, className }: SelloStampProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "inline-flex select-none flex-col items-center justify-center gap-0.5 rounded-full border-[3px] border-sello px-5 py-3 text-sello outline outline-1 outline-offset-2 outline-sello/40",
        className
      )}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em]">{label}</span>
      {sublabel ? (
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] opacity-80">{sublabel}</span>
      ) : null}
    </div>
  );
}
