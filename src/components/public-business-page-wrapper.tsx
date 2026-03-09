"use client";

import type { ReactNode } from "react";
import { PublicBusinessThemeProvider } from "./public-business-theme-provider";
import { PublicBusinessThemeToggle } from "./public-business-theme-toggle";
import type { PublicBusinessProfile } from "@/constants/public-business-profiles";

interface PublicBusinessPageWrapperProps {
  children: ReactNode;
  profile: PublicBusinessProfile;
}

export function PublicBusinessPageWrapper({
  children,
  profile,
}: PublicBusinessPageWrapperProps) {
  return (
    <PublicBusinessThemeProvider
      enableDarkMode={profile.enableDarkMode}
      darkModeColors={profile.darkModeColors}
    >
      {children}
    </PublicBusinessThemeProvider>
  );
}

// Exportar el toggle para usarlo en el header
export { PublicBusinessThemeToggle };
export type { PublicBusinessProfile };
