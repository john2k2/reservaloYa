import { test as setup, expect } from "@playwright/test";
import path from "path";

/**
 * Setup de autenticación: hace login real con el owner del demo
 * y guarda la sesión en un archivo para reutilizarla en los tests.
 *
 * Se ejecuta ANTES de los tests que usan authFile (project "authenticated").
 */

export const ADMIN_OWNER_EMAIL = "owner@reservaya.local";
export const ADMIN_OWNER_PASSWORD = "ReservaYaOwner_2026_Local!";
export const authFile = path.join(__dirname, "../.auth/owner.json");

setup("autenticar como owner del negocio", async ({ page }) => {
  await page.goto("/admin/login");
  await page.waitForLoadState("domcontentloaded");

  // Verificar que estamos en el login (no redirigió en demo mode)
  const url = page.url();
  if (!url.includes("/admin/login")) {
    // Ya está en el dashboard (demo mode) — no podemos hacer login real
    console.warn("[auth.setup] No hay formulario de login (demo mode activo). Tests autenticados se saltan.");
    await page.context().storageState({ path: authFile });
    return;
  }

  // Llenar el formulario de login
  const emailInput = page.locator('input[name="email"], input#email').first();
  const passwordInput = page.locator('input[name="password"], input#password').first();

  await expect(emailInput).toBeVisible({ timeout: 5000 });
  await emailInput.fill(ADMIN_OWNER_EMAIL);
  await passwordInput.fill(ADMIN_OWNER_PASSWORD);

  // Hacer submit y esperar redirección al dashboard
  const submitBtn = page.locator('button[type="submit"]').first();
  await submitBtn.click();

  // Esperar que llegue al dashboard
  await page.waitForURL(/\/admin\/(dashboard|onboarding)/, { timeout: 15000 });

  const finalUrl = page.url();
  console.log(`[auth.setup] Login exitoso. URL final: ${finalUrl}`);

  // Guardar la sesión (cookies + localStorage)
  await page.context().storageState({ path: authFile });
});
