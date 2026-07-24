import Link from "next/link";
import type { ReactNode } from "react";

import { ReservaYaLogo } from "@/components/brand/reservaya-logo";
import { cn } from "@/lib/utils";

type AuthSplitLayoutProps = {
  children: ReactNode;
  panelTitle: string;
  panelDescription: string;
  /**
   * "top": el contenido arranca pegado arriba en mobile y recién se centra desde `sm`
   * (forgot-password, reset-password). "center": siempre centrado verticalmente, para
   * formularios más largos que no necesitan ese padding superior (signup).
   */
  contentAlign?: "top" | "center";
};

/**
 * Layout "split-screen" compartido por las páginas de auth (forgot-password, signup,
 * reset-password): logo + contenido del form en una mitad, panel decorativo en la otra.
 * El contenido específico de cada página (heading, banners de error/success, form,
 * links de vuelta) se pasa como children.
 */
export function AuthSplitLayout({
  children,
  panelTitle,
  panelDescription,
  contentAlign = "top",
}: AuthSplitLayoutProps) {
  return (
    <main
      id="main-content"
      className="landing-theme flex min-h-screen overflow-hidden bg-background font-sans text-foreground selection:bg-foreground selection:text-background"
    >
      <div
        className={cn(
          "flex w-full flex-col px-8 py-10 sm:px-12 lg:w-1/2 lg:px-24 xl:px-32",
          contentAlign === "top" ? "justify-start pt-10 sm:justify-center" : "justify-center"
        )}
      >
        <div className="mx-auto w-full max-w-md">
          <Link href="/" className="inline-flex h-11 items-center" aria-label="Ir al inicio de ReservaYa">
            <ReservaYaLogo size="md" />
          </Link>

          {children}
        </div>
      </div>

      <div className="relative hidden w-1/2 items-center justify-center border-l border-border/60 bg-secondary/30 lg:flex">
        <div className="absolute inset-0 subtle-grid opacity-20" />
        <div className="relative max-w-lg p-12">
          <h2 className="mb-4 font-display text-3xl font-semibold tracking-tight">{panelTitle}</h2>
          <p className="text-lg text-muted-foreground">{panelDescription}</p>
        </div>
      </div>
    </main>
  );
}
