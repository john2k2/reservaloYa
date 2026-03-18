"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart2, Building2, LogOut, Menu, Moon, Sun, Users, X } from "lucide-react";
import { useTheme } from "next-themes";

import { productName } from "@/constants/site";
import { cn } from "@/lib/utils";

const platformNavigation = [
  { href: "/platform/dashboard", label: "Dashboard", icon: BarChart2 },
  { href: "/platform/businesses", label: "Negocios", icon: Building2 },
  { href: "/platform/users", label: "Usuarios", icon: Users },
];

function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleToggle = () => {
    const current = resolvedTheme || theme;
    setTheme(current === "dark" ? "light" : "dark");
  };

  const isDark = mounted && (resolvedTheme ?? theme) === "dark";

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="relative z-10 flex h-10 w-full cursor-pointer items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-all hover:bg-secondary hover:text-foreground active:scale-[0.98]"
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
      <span>{isDark ? "Modo claro" : "Modo oscuro"}</span>
    </button>
  );
}

interface PlatformShellProps {
  children: React.ReactNode;
  userEmail: string;
}

export function PlatformShell({ children, userEmail }: PlatformShellProps) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  React.useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen overflow-hidden bg-background font-sans text-foreground selection:bg-foreground selection:text-background">
      {/* Sidebar Desktop */}
      <aside className="hidden w-56 flex-col border-r border-border/60 bg-secondary/20 xl:flex">
        <div className="px-4 py-6">
          <Link href="/" className="inline-flex items-center text-lg font-bold tracking-tight">
            {productName}
          </Link>
          <div className="mt-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Plataforma
            </span>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 px-2">
          {platformNavigation.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
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

        <div className="border-t border-border/60 p-3 space-y-1">
          <div className="rounded-lg bg-secondary/40 p-3 mb-2">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Superadmin
            </p>
            <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
          </div>

          <ThemeToggle />

          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="flex w-full h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <LogOut aria-hidden="true" className="size-4" />
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex h-screen flex-1 flex-col overflow-hidden">
        {/* Header Mobile */}
        <header className="border-b border-border/60 bg-background px-4 lg:px-6">
          <div className="flex min-h-14 items-center justify-between gap-4 py-2">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Plataforma
              </p>
              <h1 className="truncate text-sm font-semibold">{productName}</h1>
            </div>
            <button
              type="button"
              onClick={() => setMobileNavOpen((open) => !open)}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-border/60 px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground xl:hidden"
              aria-expanded={mobileNavOpen}
            >
              {mobileNavOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </div>

          {mobileNavOpen ? (
            <div className="mb-3 space-y-3 rounded-2xl border border-border/60 bg-card p-3 shadow-sm xl:hidden">
              <nav className="grid grid-cols-2 gap-2">
                {platformNavigation.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-background text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Icon aria-hidden="true" className="size-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="space-y-1">
                <ThemeToggle />
                <form action="/auth/signout" method="post">
                  <button
                    type="submit"
                    className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    <LogOut aria-hidden="true" className="size-4" />
                    Cerrar sesión
                  </button>
                </form>
              </div>
            </div>
          ) : null}
        </header>

        {/* Page Content */}
        <main id="main-content" className="flex-1 overflow-y-auto bg-background p-4 lg:p-6 xl:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
