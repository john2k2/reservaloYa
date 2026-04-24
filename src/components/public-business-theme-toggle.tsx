"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";

const PUBLIC_THEME_KEY = "public-theme";
const PUBLIC_THEME_CHANGE_EVENT = "public-theme-change";

interface PublicBusinessThemeToggleProps {
  enableDarkMode: boolean;
}

export function PublicBusinessThemeToggle({
  enableDarkMode,
}: PublicBusinessThemeToggleProps) {
  const [isDark, setIsDark] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    if (!enableDarkMode) return;
    const saved = localStorage.getItem(PUBLIC_THEME_KEY);
    if (saved === "dark") {
      setIsDark(true);
    } else if (!saved) {
      setIsDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
  }, [enableDarkMode]);

  if (!enableDarkMode) return null;

  if (!mounted) {
    return (
      <button className="inline-flex size-9 items-center justify-center rounded-full border border-border/60 bg-background/80 backdrop-blur-sm">
        <Sun className="size-4" />
        <span className="sr-only">Cambiar tema</span>
      </button>
    );
  }

  const handleToggle = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem(PUBLIC_THEME_KEY, next ? "dark" : "light");
    window.dispatchEvent(new Event(PUBLIC_THEME_CHANGE_EVENT));
    if (next) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <button
      onClick={handleToggle}
      className="inline-flex size-9 items-center justify-center rounded-full border border-border/60 bg-background/80 backdrop-blur-sm transition-colors hover:bg-background"
      aria-label={isDark ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
    >
      <Sun
        className={`size-4 transition-all ${isDark ? "rotate-90 scale-0" : "rotate-0 scale-100"}`}
      />
      <Moon
        className={`absolute size-4 transition-all ${isDark ? "rotate-0 scale-100" : "-rotate-90 scale-0"}`}
      />
      <span className="sr-only">Cambiar tema</span>
    </button>
  );
}
