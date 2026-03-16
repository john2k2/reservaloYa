import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

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
    "pocketbase/pb_data/**",
    "pocketbase/pb_data_corrupt_*/**",
    "pocketbase/pb_migrations/**",
    "pocketbase/pb_hooks/**",
    "pocketbase/pb_public/**",
    "pocketbase_*/**",
  ]),
]);

export default eslintConfig;
