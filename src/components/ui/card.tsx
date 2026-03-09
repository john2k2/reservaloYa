import { cn } from "@/lib/utils";
import { type HTMLAttributes, forwardRef } from "react";

/**
 * Sistema de Cards estandarizado
 * 
 * Uso:
 * - Card: Contenedor base
 * - CardHeader: Encabezado con título y descripción
 * - CardContent: Contenido principal
 * - CardFooter: Pie de card (acciones)
 * 
 * Variantes de tamaño:
 * - default: rounded-xl (12px) - Uso general
 * - lg: rounded-2xl (16px) - Cards destacadas
 * - sm: rounded-lg (8px) - Elementos pequeños
 */

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "lg" | "sm";
  hover?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", size = "default", hover = false, ...props }, ref) => {
    const variants = {
      default: "bg-card text-card-foreground shadow-sm",
      outline: "border border-border/60 bg-transparent",
      ghost: "bg-transparent shadow-none",
    };

    const sizes = {
      default: "rounded-xl",
      lg: "rounded-2xl",
      sm: "rounded-lg",
    };

    return (
      <div
        ref={ref}
        className={cn(
          variants[variant],
          sizes[size],
          "border border-border/60",
          hover && "transition-all duration-300 hover:shadow-md hover:border-foreground/20 hover:scale-[1.01] cursor-pointer",
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 p-6", className)}
      {...props}
    />
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  )
);
CardTitle.displayName = "CardTitle";

const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
);
CardDescription.displayName = "CardDescription";

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center p-6 pt-0", className)}
      {...props}
    />
  )
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
