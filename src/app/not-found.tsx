import type { Metadata } from "next";
import Link from "next/link";
import { Home } from "lucide-react";
import { demoBusinessOptions, productName } from "@/constants/site";
import { BackButton } from "@/components/back-button";

export const metadata: Metadata = {
  title: { absolute: "Página no encontrada | ReservaYa" },
  robots: { index: false, follow: false },
  alternates: { canonical: null },
};

export default function NotFoundPage() {
  return (
    <main className="landing-theme flex min-h-screen flex-col items-center justify-center bg-background px-4 text-foreground">
      <div className="w-full max-w-lg text-center">
        <p className="font-mono text-sm font-semibold tracking-[0.3em] text-sello">404</p>
        <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Página no encontrada
        </h1>
        <p className="mx-auto mt-5 max-w-md text-lg text-muted-foreground">
          La página que buscás no existe o fue movida. Volvé al inicio o explorá un negocio de
          ejemplo.
        </p>

        <div className="mt-8 flex w-full flex-col flex-wrap items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-full bg-foreground px-6 text-sm font-semibold text-background sm:w-auto"
          >
            <Home className="size-4 shrink-0" />
            Volver al inicio
          </Link>
          <BackButton />
        </div>

        <div className="mt-12 border-t border-rule pt-8">
          <p className="mb-4 text-sm text-muted-foreground">O explorá un ejemplo en vivo:</p>
          <div className="flex flex-col divide-y divide-rule border-y border-rule text-left">
            {demoBusinessOptions
              .filter((demo) => demo.slug !== "barberia-demo")
              .map((demo) => (
                <Link
                  key={demo.slug}
                  href={`/${demo.slug}`}
                  className="py-3 text-sm font-medium text-foreground transition-colors hover:text-sello"
                >
                  {demo.label}
                </Link>
              ))}
          </div>
        </div>
      </div>

      <p className="mt-16 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} {productName}. Todos los derechos reservados.
      </p>
    </main>
  );
}
