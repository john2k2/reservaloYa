"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { DarkModeColors } from "@/constants/public-business-profiles";

// Key de localStorage separada para la página pública, para no pisar el tema del admin.
const PUBLIC_THEME_KEY = "public-theme";
const PUBLIC_THEME_CHANGE_EVENT = "public-theme-change";

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
  const [storedDarkPreference, setStoredDarkPreference] = useState(() => {
    if (typeof window === "undefined" || !enableDarkMode) {
      return false;
    }

    const saved = localStorage.getItem(PUBLIC_THEME_KEY);

    if (saved === "dark") {
      return true;
    }

    if (saved === "light") {
      return false;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const isDark = enableDarkMode && storedDarkPreference;

  useEffect(() => {
    if (!enableDarkMode) return;

    const updatePreference = () => {
      const saved = localStorage.getItem(PUBLIC_THEME_KEY);

      if (saved === "dark") {
        setStoredDarkPreference(true);
      } else if (saved === "light") {
        setStoredDarkPreference(false);
      }
    };

    window.addEventListener(PUBLIC_THEME_CHANGE_EVENT, updatePreference);
    window.addEventListener("storage", updatePreference);

    return () => {
      window.removeEventListener(PUBLIC_THEME_CHANGE_EVENT, updatePreference);
      window.removeEventListener("storage", updatePreference);
    };
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
