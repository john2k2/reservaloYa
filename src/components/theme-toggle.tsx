"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { startCircularThemeTransition } from "@/lib/theme-transition";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="size-9">
        <Sun className="size-4" />
        <span className="sr-only">Cambiar tema</span>
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";

  const handleToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    const next = isDark ? "light" : "dark";
    startCircularThemeTransition(event, () => {
      setTheme(next);
    });
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative size-9"
      onClick={handleToggle}
      aria-label={isDark ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
    >
      <Sun
        className={`size-4 transition-all ${isDark ? "rotate-90 scale-0" : "rotate-0 scale-100"}`}
      />
      <Moon
        className={`absolute size-4 transition-all ${isDark ? "rotate-0 scale-100" : "-rotate-90 scale-0"}`}
      />
      <span className="sr-only">Cambiar tema</span>
    </Button>
  );
}
