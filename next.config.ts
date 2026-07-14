import type { NextConfig } from "next";
import path from "path";
import bundleAnalyzer from "@next/bundle-analyzer";
import { withSentryConfig } from "@sentry/nextjs";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

// Absolute project root — a stray package-lock.json in /home/john makes Turbopack
// climb out of this repo and fail to resolve tailwindcss / app deps.
const projectRoot = path.resolve(__dirname);

const nextConfig: NextConfig = {
  /* config options here */
  // Pin the workspace root: a stray package-lock.json in a parent directory
  // makes Turbopack infer the wrong root and fail to resolve dependencies.
  turbopack: {
    root: projectRoot,
  },
  outputFileTracingRoot: projectRoot,
  // El browser de Cursor / algunos clientes usan 127.0.0.1 en vez de localhost.
  // Sin esto, Next bloquea HMR y chunks de /_next y los client components no hidratan.
  allowedDevOrigins: ["127.0.0.1"],
  experimental: {
    // Optimize package imports for common libraries
    optimizePackageImports: ["lucide-react", "date-fns", "@supabase/supabase-js"],
  },
  images: {
    // Vercel's image optimizer returns 402 once the Hobby-plan transformation
    // quota is exhausted, breaking every remote image on the site. Remote
    // sources are already right-sized (Unsplash w/h/fit params, Meta CDN
    // thumbnails), so serving originals is the safe default. Set
    // NEXT_IMAGE_OPTIMIZED=true to re-enable when the plan has quota.
    unoptimized: process.env.NEXT_IMAGE_OPTIMIZED !== "true",
    formats: ["image/avif", "image/webp"],
    qualities: [75, 85, 90],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      // Meta CDN para thumbnails de Instagram (oEmbed)
      {
        protocol: "https",
        hostname: "**.fbcdn.net",
      },
      {
        protocol: "https",
        hostname: "**.cdninstagram.com",
      },
    ],
  },
  // Compress output for better performance
  compress: true,
  // Enable React strict mode for better development
  reactStrictMode: true,
  poweredByHeader: false, // Remove X-Powered-By header for security
  // Force metadata to be emitted in <head> for crawlers/auditors instead of streamed into <body>.
  htmlLimitedBots: /.*/,

  async headers() {
    // React/Next en desarrollo usan eval() / Function() para hidratar y HMR.
    // Sin 'unsafe-eval' + ws: los client components quedan muertos (p.ej. Menú admin).
    // En producción no hace falta: el bundle no depende de eval.
    const isDev = process.env.NODE_ENV === "development";
    const contentSecurityPolicy = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      `script-src 'self' 'unsafe-inline' https:${isDev ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      `connect-src 'self' https:${isDev ? " ws: wss:" : ""}`,
      "frame-src https://www.google.com https://maps.google.com",
      "upgrade-insecure-requests",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
        ],
      },
    ];
  },

  // Redirecciones para rutas comunes
  async redirects() {
    return [
      ...[
        "/sitemap_index.xml",
        "/sitemap-index.xml",
        "/sitemaps.xml",
        "/sitemap1.xml",
        "/post-sitemap.xml",
        "/page-sitemap.xml",
        "/category-sitemap.xml",
        "/news-sitemap.xml",
      ].map((source) => ({
        source,
        destination: "/sitemap.xml",
        permanent: true,
      })),
      {
        source: "/admin",
        destination: "/admin/dashboard",
        permanent: true,
      },
      {
        source: "/dashboard",
        destination: "/admin/dashboard",
        permanent: true,
      },
      {
        source: "/panel",
        destination: "/admin/dashboard",
        permanent: true,
      },
    ];
  },
};

const analyzedConfig = withBundleAnalyzer(nextConfig);

export default withSentryConfig(analyzedConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
});
