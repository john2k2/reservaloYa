"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Eye, LogOut } from "lucide-react";

import { adminNavigation, demoBusinessSlug, productName } from "@/constants/site";
import { cn, humanizeSlug } from "@/lib/utils";

interface AdminShellProps {
  children: React.ReactNode;
  businessName: string;
  businessSlug: string;
  userEmail: string;
  profileName: string;
  demoMode: boolean;
}

export function AdminShell({
  children,
  businessName,
  businessSlug,
  userEmail,
  profileName,
  demoMode,
}: AdminShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen overflow-hidden bg-background font-sans text-foreground selection:bg-foreground selection:text-background">
      <aside className="hidden w-64 flex-col border-r border-border/60 bg-secondary/20 lg:flex">
        <div className="px-6 py-8">
          <Link href="/" className="inline-flex h-11 items-center text-xl font-bold tracking-tight">
            {productName}
          </Link>
          <div className="mt-6 flex flex-col gap-1">
            <span className="mr-auto rounded-md bg-secondary px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {demoMode ? "Demo Mode" : "Modo real"}
            </span>
            <span className="mt-2 pr-4 text-sm font-medium">{businessName}</span>
            <span className="text-xs text-muted-foreground">{humanizeSlug(businessSlug)}</span>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {adminNavigation.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                  active
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Icon aria-hidden="true" className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border/60 p-4">
          <div className="rounded-md bg-secondary/50 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Usuario
            </p>
            <p className="truncate text-sm font-medium">{profileName}</p>
            <p className="truncate text-xs text-muted-foreground">{userEmail}</p>

            <Link
              href={`/${businessSlug || demoBusinessSlug}`}
              className="mt-4 inline-flex h-11 items-center gap-2 px-2 text-sm font-medium transition-colors hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <Eye aria-hidden="true" className="size-3.5" />
              Ver página pública
            </Link>
          </div>

          {!demoMode && (
            <form action="/auth/signout" method="post" className="mt-2">
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <LogOut aria-hidden="true" className="size-4" />
                Cerrar sesión
              </button>
            </form>
          )}
        </div>
      </aside>

      <div className="flex h-screen flex-1 flex-col overflow-hidden">
        <header className="border-b border-border/60 bg-background px-4 sm:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {demoMode ? "Vista demo" : "Panel de control"}
              </p>
              <h1 className="truncate text-sm font-semibold sm:text-base">{businessName}</h1>
            </div>
            <Link
              href={`/${businessSlug || demoBusinessSlug}`}
              className="inline-flex h-11 items-center rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 lg:hidden"
            >
              Ver sitio
            </Link>
          </div>

          <nav className="flex flex-wrap gap-2 pb-4 lg:hidden">
            {adminNavigation.map((item) => {
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex h-11 items-center whitespace-nowrap rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                    active
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-background text-muted-foreground hover:text-foreground"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>

        <main id="main-content" className="flex-1 overflow-y-auto bg-background p-4 sm:p-8">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
