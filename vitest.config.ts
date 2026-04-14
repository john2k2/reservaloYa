import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";
import dotenv from "dotenv";

// Carga .env.test para integration tests con PocketBase real.
// Solo cuando el archivo existe — en CI sin credenciales los tests se saltean.
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
      thresholds: {
        statements: 35,
        branches: 20,
        functions: 35,
        lines: 35,
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
