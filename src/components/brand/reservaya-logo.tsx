import type { SVGProps } from "react";

import { cn } from "@/lib/utils";

type ReservaYaLogoProps = {
  variant?: "full" | "isotype";
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClasses = {
  sm: { full: "h-7 w-auto", isotype: "size-7" },
  md: { full: "h-9 w-auto", isotype: "size-9" },
  lg: { full: "h-12 w-auto", isotype: "size-12" },
} as const;

function ReservaYaIsotypeSvg(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" {...props}>
      <path
        d="M7.5 26.5H2.8M9.5 35.5H1.5M14 44.5H6.2"
        stroke="#14B8A6"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <rect x="14" y="13" width="39" height="39" rx="11" stroke="#14B8A6" strokeWidth="5" />
      <path d="M24 9.5V19M43 9.5V19" stroke="#14B8A6" strokeWidth="5" strokeLinecap="round" />
      <path
        d="M24.5 33.5L31 40L43.5 27.5"
        stroke="currentColor"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ReservaYaWordmarkSvg(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 186 44" fill="none" aria-hidden="true" {...props}>
      <text x="0" y="31" fill="currentColor" fontFamily="Inter, ui-sans-serif, system-ui, sans-serif" fontSize="30" fontWeight="800" letterSpacing="-1.2">
        Reserva
      </text>
      <text x="119" y="31" fill="#14B8A6" fontFamily="Inter, ui-sans-serif, system-ui, sans-serif" fontSize="30" fontWeight="800" letterSpacing="-1.2">
        Ya
      </text>
    </svg>
  );
}

export function ReservaYaLogo({ variant = "full", size = "md", className }: ReservaYaLogoProps) {
  if (variant === "isotype") {
    return (
      <ReservaYaIsotypeSvg
        className={cn(sizeClasses[size].isotype, "shrink-0", className)}
        role="img"
        aria-label="ReservaYa"
      />
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-2", className)} aria-label="ReservaYa">
      <ReservaYaIsotypeSvg className={cn(sizeClasses[size].isotype, "shrink-0")} />
      <ReservaYaWordmarkSvg className={cn(sizeClasses[size].full, "hidden text-foreground sm:block")} />
      <span className="sr-only">ReservaYa</span>
    </span>
  );
}
