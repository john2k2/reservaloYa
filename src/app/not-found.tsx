import Link from "next/link";
import { Home, Search, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Página no encontrada | ReservaYa",
  description: "La página que buscás no existe. Volvé al inicio o probá con otra búsqueda.",
};

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-secondary/20 px-4">
      <div className="text-center">
        {/* Ilustración */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="flex h-32 w-32 items-center justify-center rounded-full bg-secondary">
              <Search className="h-16 w-16 text-muted-foreground" />
            </div>
            <div className="absolute -bottom-2 -right-2 flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background font-bold text-lg">
              404
            </div>
          </div>
        </div>

        {/* Título */}
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Página no encontrada
        </h1>

        {/* Descripción */}
        <p className="mb-8 max-w-md mx-auto text-lg text-muted-foreground">
          La página que buscás no existe o fue movida. 
          Volvé al inicio o probá con una de nuestras demos.
        </p>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
          >
            <Home className="h-4 w-4" />
            Volver al inicio
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver atrás
          </button>
        </div>

        {/* Demos disponibles */}
        <div className="mt-12">
          <p className="mb-4 text-sm text-muted-foreground">
            O probá una de nuestras demos:
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/demo-barberia"
              className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              Demo Barbería
            </Link>
            <Link
              href="/demo-estetica"
              className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              Demo Estética
            </Link>
            <Link
              href="/demo-nails"
              className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              Demo Nails
            </Link>
          </div>
        </div>
      </div>

      {/* Footer simple */}
      <footer className="absolute bottom-6 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} ReservaYa. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
