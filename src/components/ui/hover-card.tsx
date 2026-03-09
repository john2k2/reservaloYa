"use client";

import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

/**
 * Sistema de Hovers estandarizado
 * 
 * Uso:
 * - hover-card: Cards clickeables
 * - hover-button: Botones interactivos
 * - hover-link: Links de navegación
 * - hover-icon: Iconos interactivos
 */

interface HoverCardProps extends HTMLAttributes<HTMLDivElement> {
  scale?: "sm" | "default" | "lg";
  shadow?: boolean;
}

export function HoverCard({
  className,
  scale = "default",
  shadow = true,
  ...props
}: HoverCardProps) {
  const scales = {
    sm: "hover:scale-[1.01]",
    default: "hover:scale-[1.02]",
    lg: "hover:scale-105",
  };

  return (
    <div
      className={cn(
        "transition-all duration-300 ease-out",
        "active:scale-[0.98]",
        "cursor-pointer",
        scales[scale],
        shadow && "hover:shadow-md hover:border-foreground/20",
        className
      )}
      {...props}
    />
  );
}

interface HoverButtonProps extends HTMLAttributes<HTMLButtonElement> {
  scale?: "sm" | "default";
}

export function HoverButton({
  className,
  scale = "default",
  ...props
}: HoverButtonProps) {
  const scales = {
    sm: "hover:scale-[1.02]",
    default: "hover:scale-105",
  };

  return (
    <button
      className={cn(
        "transition-all duration-200 ease-out",
        "active:scale-95",
        scales[scale],
        className
      )}
      {...props}
    />
  );
}

interface HoverLinkProps extends HTMLAttributes<HTMLAnchorElement> {
  underline?: boolean;
}

export function HoverLink({
  className,
  underline = false,
  ...props
}: HoverLinkProps) {
  return (
    <a
      className={cn(
        "transition-colors duration-200",
        "hover:text-foreground",
        underline && "hover:underline underline-offset-4",
        className
      )}
      {...props}
    />
  );
}

export function HoverIcon({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "transition-transform duration-200 ease-out",
        "hover:scale-110",
        "cursor-pointer",
        className
      )}
      {...props}
    />
  );
}
