import { defineConfig, devices } from "@playwright/test";

/**
 * Configuración de Playwright para pruebas E2E de ReservaYa
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./e2e",
  
  /* Ejecutar tests en paralelo */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,
  
  /* Reintentos en CI */
  retries: process.env.CI ? 2 : 0,
  
  /* Workers para tests */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter */
  reporter: [
    ["html", { outputFolder: "playwright-report" }],
    ["list"],
  ],
  
  /* Shared settings for all the projects below */
  use: {
    /* Base URL para tests */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    
    /* Capturar traces en fallos */
    trace: "on-first-retry",
    
    /* Capturar screenshots en fallos */
    screenshot: "only-on-failure",
    
    /* Grabar video en fallos */
    video: "on-first-retry",
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    
    /* Mobile tests */
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
  ],

  /* Local dev server */
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
