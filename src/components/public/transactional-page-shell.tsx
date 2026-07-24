import type { ReactNode } from "react";

type TransactionalPageShellProps = {
  children: ReactNode;
  accentColor: string;
  surfaceTint?: string | null;
};

/**
 * Wrapper `<main>` compartido por las páginas transaccionales del flujo de reserva
 * (confirmación, mi-turno, reservar, reseña): mismo fondo con degradé hacia el
 * `surfaceTint` del profile (o una variante suave del accent si no hay tint) detrás
 * del contenido.
 */
export function TransactionalPageShell({
  children,
  accentColor,
  surfaceTint,
}: TransactionalPageShellProps) {
  return (
    <main
      id="main-content"
      className="min-h-dvh bg-background font-sans text-foreground selection:bg-foreground selection:text-background"
      style={{
        background: `linear-gradient(180deg, ${surfaceTint ?? `${accentColor}08`} 0%, transparent 100%)`,
      }}
    >
      {children}
    </main>
  );
}
