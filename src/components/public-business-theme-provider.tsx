"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { DarkModeColors } from "@/constants/public-business-profiles";

// Key de localStorage separada para la página pública, para no pisar el tema del admin.
const PUBLIC_THEME_KEY = "public-theme";

interface PublicBusinessThemeProviderProps {
  children: ReactNode;
  enableDarkMode: boolean;
  darkModeColors?: DarkModeColors;
}

export function PublicBusinessThemeProvider({
  children,
  enableDarkMode,
  darkModeColors,
}: PublicBusinessThemeProviderProps) {
  const [isDark, setIsDark] = useState(false);

  // Al montar, leer la preferencia guardada para esta página pública.
  // Si el negocio no tiene dark mode, forzar siempre claro.
  useEffect(() => {
    if (!enableDarkMode) {
      setIsDark(false);
      return;
    }
    const saved = localStorage.getItem(PUBLIC_THEME_KEY);
    if (saved === "dark") {
      setIsDark(true);
    } else if (!saved) {
      // Si no hay preferencia guardada, usar la preferencia del sistema
      setIsDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
  }, [enableDarkMode]);

  // Aplicar/quitar la clase "dark" en <html> sin tocar el localStorage del admin.
  // Al desmontar, restaurar la clase según el tema del admin (key "theme").
  useEffect(() => {
    const root = document.documentElement;

    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Al desmontar esta página pública, restaurar la clase según el tema del admin
    return () => {
      const adminTheme = localStorage.getItem("theme");
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const resolvedAdminDark =
        adminTheme === "dark" || (adminTheme !== "light" && systemDark);
      if (resolvedAdminDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    };
  }, [isDark]);

  // Aplicar colores personalizados de dark mode cuando está activo
  useEffect(() => {
    if (!enableDarkMode || !darkModeColors || !isDark) return;
    const root = document.documentElement;
    root.style.setProperty("--accent", darkModeColors.accent);
    root.style.setProperty("--accent-soft", darkModeColors.accentSoft);
    root.style.setProperty("--surface-tint", darkModeColors.surfaceTint);
    root.style.setProperty("--background", darkModeColors.background);
    root.style.setProperty("--foreground", darkModeColors.foreground);
    root.style.setProperty("--card", darkModeColors.card);
    root.style.setProperty("--card-foreground", darkModeColors.cardForeground);

    return () => {
      root.style.removeProperty("--accent");
      root.style.removeProperty("--accent-soft");
      root.style.removeProperty("--surface-tint");
      root.style.removeProperty("--background");
      root.style.removeProperty("--foreground");
      root.style.removeProperty("--card");
      root.style.removeProperty("--card-foreground");
    };
  }, [enableDarkMode, darkModeColors, isDark]);

  return (
    <>
      {children}
    </>
  );
}
