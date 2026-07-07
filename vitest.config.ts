import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";
import dotenv from "dotenv";

// Carga .env.test cuando existe para tests que necesitan configuración local.
dotenv.config({ path: ".env.test" });

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.tsx"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    fileParallelism: false,
    coverage: {
      provider: "v8",
      reportsDirectory: "tmp/coverage",
      reporter: ["text", "json", "html"],
      // Measured real coverage as of 2026-07-06: statements 63.81%, branches
      // 47.05%, functions 61.24%, lines 65.37%. Thresholds below keep a
      // 5-7 point margin so normal PR-to-PR fluctuation doesn't break CI.
      thresholds: {
        statements: 58,
        branches: 40,
        functions: 55,
        lines: 60,
      },
      exclude: [
        "node_modules/",
        "src/test/",
        "**/*.d.ts",
        "**/*.config.*",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
