import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import vitest from "eslint-plugin-vitest";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "next-env.d.ts",
    ".codex-output/**",
  ]),
  {
    // Playwright already sets forbidOnly in CI; Vitest has no built-in
    // equivalent, so a stray `.only` would silently skip the rest of a
    // test file while `npm test` still exits green.
    files: ["src/**/*.{test,spec}.{ts,tsx}"],
    plugins: { vitest },
    rules: {
      "vitest/no-focused-tests": "error",
    },
  },
]);

export default eslintConfig;
