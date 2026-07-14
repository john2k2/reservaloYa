import type { ReactNode } from "react";
import { Inter, JetBrains_Mono, Fraunces } from "next/font/google";

import "./globals.css";
import { defaultMetadata, defaultViewport } from "@/lib/seo/metadata";
import { OrganizationJsonLd, WebSiteJsonLd } from "@/lib/seo/json-ld";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  preload: false,
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  preload: false,
});

export const metadata = defaultMetadata;
export const viewport = defaultViewport;

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="es-AR" suppressHydrationWarning>
      <head>
        <link rel="dns-prefetch" href="https://jshlqmfggyzbnwjejkyb.supabase.co" />
        <link rel="preconnect" href="https://jshlqmfggyzbnwjejkyb.supabase.co" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Reserved top-level routes that are NOT a public business page
                // (the [slug] catch-all lives at the root, so anything not in this
                // list is treated as a business slug).
                const reservedFirstSegments = [
                  'about', 'admin', 'agenda-online-peluquerias', 'api', 'auth',
                  'como-funciona', 'contacto', 'favicon.ico', 'funcionalidades',
                  'login', 'platform', 'precios', 'preguntas-frecuentes', 'privacidad',
                  'sistema-reservas-centros-estetica', 'sobre-reservaya', 'terminos',
                  'turnos-online-barberias', 'turnos-online-consultorios', 'turnos-online-nails'
                ];
                const firstSegment = window.location.pathname.split('/').filter(Boolean)[0] || '';
                const isPublicBusinessPage = firstSegment !== '' && reservedFirstSegments.indexOf(firstSegment) === -1;

                const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                let resolvedDark;

                if (isPublicBusinessPage) {
                  // Mirrors PublicBusinessThemeProvider's initial resolution: explicit
                  // 'public-theme' wins, otherwise fall back to system preference.
                  const publicTheme = localStorage.getItem('public-theme');
                  resolvedDark = publicTheme === 'dark' ? true : publicTheme === 'light' ? false : systemDark;
                } else {
                  const theme = localStorage.getItem('theme') || 'light';
                  resolvedDark = theme === 'system' ? systemDark : theme === 'dark';
                }

                if (resolvedDark) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
        <OrganizationJsonLd />
        <WebSiteJsonLd />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} ${fraunces.variable} antialiased font-sans bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange={false}
        >
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-foreground focus:px-4 focus:py-2 focus:text-background"
          >
            Saltar al contenido
          </a>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
