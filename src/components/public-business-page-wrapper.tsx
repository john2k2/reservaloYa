import type { ReactNode } from "react";

import { PublicBusinessThemeProvider } from "./public-business-theme-provider";
import type { PublicBusinessProfile } from "@/constants/public-business-profiles";

interface PublicBusinessPageWrapperProps {
  children: ReactNode;
  profile: PublicBusinessProfile;
}

export function PublicBusinessPageWrapper({
  children,
  profile,
}: PublicBusinessPageWrapperProps) {
  if (!profile.enableDarkMode) {
    return <>{children}</>;
  }

  return (
    <PublicBusinessThemeProvider
      enableDarkMode={profile.enableDarkMode}
      darkModeColors={profile.darkModeColors}
    >
      {children}
    </PublicBusinessThemeProvider>
  );
}

export type { PublicBusinessProfile };
