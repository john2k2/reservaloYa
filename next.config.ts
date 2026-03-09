import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // Optimize package imports for common libraries
    optimizePackageImports: ["lucide-react"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
    ],
  },
  // Compress output for better performance
  compress: true,
  // Enable React strict mode for better development
  reactStrictMode: true,
  poweredByHeader: false, // Remove X-Powered-By header for security
  
  // Redirecciones para rutas comunes
  async redirects() {
    return [
      {
        source: "/admin",
        destination: "/admin/login",
        permanent: true,
      },
      {
        source: "/dashboard",
        destination: "/admin/dashboard",
        permanent: true,
      },
      {
        source: "/login",
        destination: "/admin/login",
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

export default withBundleAnalyzer(nextConfig);
