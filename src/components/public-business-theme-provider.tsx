"use client";

import { useLayoutEffect, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import type { DarkModeColors } from "@/constants/public-business-profiles";
import {
  getPublicBusinessThemeStyle,
  type PublicBusinessLightColors,
} from "@/lib/public-business-theme";

const PUBLIC_THEME_KEY = "public-theme";
const PUBLIC_THEME_CHANGE_EVENT = "public-theme-change";

interface PublicBusinessThemeProviderProps {
  children: ReactNode;
  enableDarkMode: boolean;
  lightColors: PublicBusinessLightColors;
  darkModeColors?: DarkModeColors;
}

function readStoredDarkPreference(enableDarkMode: boolean): boolean {
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
}

function restoreAdminThemeClass() {
  const root = document.documentElement;
  const adminTheme = localStorage.getItem("theme");
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const resolvedAdminDark =
    adminTheme === "dark" || ((adminTheme === "system" || !adminTheme) && systemDark);

  root.classList.toggle("dark", resolvedAdminDark);
}

function fallbackDarkColors(light: PublicBusinessLightColors): DarkModeColors {
  return {
    accent: light.accent,
    accentSoft: "#27272a",
    surfaceTint: "#18181b",
    background: "#111111",
    foreground: "#fafafa",
    card: "#1a1a1a",
    cardForeground: "#fafafa",
  };
}

export function PublicBusinessThemeProvider({
  children,
  enableDarkMode,
  lightColors,
  darkModeColors,
}: PublicBusinessThemeProviderProps) {
  const [storedDarkPreference, setStoredDarkPreference] = useState(() =>
    readStoredDarkPreference(enableDarkMode)
  );
  const isDark = enableDarkMode && storedDarkPreference;

  const themeStyle = (
    isDark
      ? getPublicBusinessThemeStyle(darkModeColors ?? fallbackDarkColors(lightColors), "dark")
      : getPublicBusinessThemeStyle(lightColors, "light")
  ) as CSSProperties;

  useLayoutEffect(() => {
    if (!enableDarkMode) {
      return;
    }

    const updatePreference = () => {
      setStoredDarkPreference(readStoredDarkPreference(true));
    };

    window.addEventListener(PUBLIC_THEME_CHANGE_EVENT, updatePreference);
    window.addEventListener("storage", updatePreference);

    return () => {
      window.removeEventListener(PUBLIC_THEME_CHANGE_EVENT, updatePreference);
      window.removeEventListener("storage", updatePreference);
    };
  }, [enableDarkMode]);

  // Forzar la clase dark del documento para esta página pública, incluso si
  // next-themes (tema del admin/sistema) intenta pisarla.
  useLayoutEffect(() => {
    const root = document.documentElement;

    const enforce = () => {
      root.classList.toggle("dark", isDark);
    };

    enforce();

    const observer = new MutationObserver(enforce);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    return () => {
      observer.disconnect();
      restoreAdminThemeClass();
    };
  }, [isDark]);

  return (
    <div className="public-business-theme min-h-dvh bg-background text-foreground" style={themeStyle}>
      {children}
    </div>
  );
}
