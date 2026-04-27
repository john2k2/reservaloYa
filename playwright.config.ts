import { defineConfig, devices } from "@playwright/test";
import path from "path";

/**
 * Configuración de Playwright para pruebas E2E de ReservaYa
 * @see https://playwright.dev/docs/test-configuration
 */

const authFile = path.join(__dirname, "e2e/.auth/owner.json");
const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
const shouldStartLocalServer = /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(baseURL);

export default defineConfig({
  testDir: "./e2e",

  /* Ejecutar tests en paralelo */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Reintentos en CI */
  retries: process.env.CI ? 2 : 0,

  /* Timeout por test — más alto para dar margen al dev server (cold-start) */
  timeout: 45000,

  /* Workers para tests */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter */
  reporter: [
    ["html", { outputFolder: "tmp/playwright-report" }],
    ["list"],
  ],
  outputDir: "tmp/test-results",

  /* Shared settings for all the projects below */
  use: {
    /* Base URL para tests */
    baseURL,

    /* Capturar traces en fallos */
    trace: "on-first-retry",

    /* Capturar screenshots en fallos */
    screenshot: "only-on-failure",

    /* Grabar video en fallos */
    video: "on-first-retry",

    /* Usar Chromium completo en lugar del headless shell (fix ICU error en Windows) */
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
    },
  },

  /* Proyectos separados: smoke público estable, admin autenticado y suites manuales */
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },

    {
      name: "public-smoke",
      use: { ...devices["Desktop Firefox"] },
      testMatch: /smoke-test\.spec\.ts/,
      workers: 1,
    },

    {
      name: "manual-chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: /auth\.setup\.ts|admin-authenticated\.spec\.ts|smoke-test\.spec\.ts/,
    },

    {
      name: "admin-authenticated",
      use: {
        ...devices["Desktop Chrome"],
        storageState: authFile,
      },
      testMatch: /admin-authenticated\.spec\.ts/,
      dependencies: ["setup"],
      workers: 1,
    },

    {
      name: "manual-mobile",
      use: { ...devices["Pixel 5"] },
      testIgnore: /auth\.setup\.ts|admin-authenticated\.spec\.ts|smoke-test\.spec\.ts/,
    },

    {
      name: "manual-firefox",
      use: { ...devices["Desktop Firefox"], navigationTimeout: 60000 },
      testIgnore: /auth\.setup\.ts|admin-authenticated\.spec\.ts|smoke-test\.spec\.ts/,
      workers: 1,
    },
  ],

  /* Local dev server */
  webServer: shouldStartLocalServer
    ? {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
      }
    : undefined,
});

