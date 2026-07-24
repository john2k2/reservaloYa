import type { ReactNode } from "react";

import {
  PublicBusinessThemeProvider,
  fallbackDarkColors,
} from "./public-business-theme-provider";
import type { PublicBusinessProfile } from "@/constants/public-business-profiles";
import {
  getPublicBusinessThemeStyle,
  publicBusinessThemeStyleToCssText,
} from "@/lib/public-business-theme";

interface PublicBusinessPageWrapperProps {
  children: ReactNode;
  profile: PublicBusinessProfile;
}

/**
 * Aplica la paleta del negocio en SSR (evita flash) y monta el provider
 * para dark mode / sincronización con el toggle.
 */
export function PublicBusinessPageWrapper({
  children,
  profile,
}: PublicBusinessPageWrapperProps) {
  const lightCss = publicBusinessThemeStyleToCssText(
    getPublicBusinessThemeStyle(
      {
        accent: profile.accent,
        accentSoft: profile.accentSoft,
        surfaceTint: profile.surfaceTint,
      },
      "light"
    )
  );

  const darkColors =
    profile.enableDarkMode
      ? profile.darkModeColors ?? fallbackDarkColors(profile)
      : null;

  const darkCss = darkColors
    ? publicBusinessThemeStyleToCssText(getPublicBusinessThemeStyle(darkColors, "dark"))
    : null;

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: [
            `.public-business-theme { ${lightCss} }`,
            darkCss ? `html.dark .public-business-theme { ${darkCss} }` : "",
          ]
            .filter(Boolean)
            .join("\n"),
        }}
      />
      <PublicBusinessThemeProvider
        enableDarkMode={Boolean(profile.enableDarkMode)}
        lightColors={{
          accent: profile.accent,
          accentSoft: profile.accentSoft,
          surfaceTint: profile.surfaceTint,
        }}
        darkModeColors={profile.darkModeColors}
      >
        {children}
      </PublicBusinessThemeProvider>
    </>
  );
}

export type { PublicBusinessProfile };
