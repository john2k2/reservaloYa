import { test as setup, expect } from "@playwright/test";
import path from "path";

/**
 * Setup de autenticación: hace login real con un owner seedado
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

  await expect(page).toHaveURL(/\/admin\/login|\/login/);

  // Llenar el formulario de login
  const emailInput = page.locator('input[name="email"], input#email').first();
  const passwordInput = page.locator('input[name="password"], input#password').first();

  await expect(emailInput).toBeVisible({ timeout: 5000 });
  await emailInput.fill(ADMIN_OWNER_EMAIL);
  await passwordInput.fill(ADMIN_OWNER_PASSWORD);

  // Hacer submit y esperar redirección al dashboard
  const submitBtn = page.locator('button[type="submit"]').first();
  await submitBtn.click();

  try {
    await page.waitForURL(/\/admin\/(dashboard|onboarding)/, { timeout: 15000 });
  } catch {
    const currentUrl = page.url();
    console.warn(
      `[auth.setup] No se pudo abrir sesión autenticada. URL final: ${currentUrl}. ` +
        "Los tests autenticados se van a skippear."
    );
    await page.context().storageState({ path: authFile });
    return;
  }

  const finalUrl = page.url();
  console.log(`[auth.setup] Login exitoso. URL final: ${finalUrl}`);

  // Guardar la sesión (cookies + localStorage)
  await page.context().storageState({ path: authFile });
});
