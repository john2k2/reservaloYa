import { test, expect } from "@playwright/test";

/**
 * Tests E2E para el panel de administracion sin sesión autenticada.
 * Verifican login y protección de rutas privadas.
 */

test.describe("Panel Admin - Login", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/login");
    await page.waitForLoadState("domcontentloaded");
  });

  test("deberia mostrar el formulario de login", async ({ page }) => {
    await expect(page).toHaveURL(/\/admin\/login|\/login/);
    await expect(page.locator("form")).toBeVisible();
    await expect(page.locator('input[type="email"], input[type="text"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test("deberia manejar credenciales invalidas", async ({ page }) => {
    const submitBtn = page.locator('button[type="submit"]');
    const hasSubmit = await submitBtn.isVisible({ timeout: 2000 }).catch(() => false);
    if (!hasSubmit || !page.url().includes("/admin/login")) return;

    await page.locator('input[type="email"], input[type="text"]').first().fill("invalido@test.com");
    await page.locator('input[type="password"]').first().fill("wrongpassword");
    await submitBtn.click();
    await page.waitForLoadState("networkidle");

    const showsError = await page.getByText(/incorrecto|invalido|error|wrong|invalid/i).isVisible().catch(() => false);
    // La app puede redirigir a /login?error=... o quedarse en /admin/login
    const staysOnLogin = page.url().includes("/login");
    expect(showsError || staysOnLogin).toBeTruthy();
  });
});

test.describe("Panel Admin - Rutas protegidas", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/dashboard");
    await page.waitForLoadState("domcontentloaded");
  });

  test("dashboard sin sesión redirige a login", async ({ page }) => {
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator("form")).toBeVisible();
  });

  for (const route of ["bookings", "services", "availability", "onboarding", "customers"] as const) {
    test(`${route} sin sesión redirige a login`, async ({ page }) => {
      await page.goto(`/admin/${route}`);
      await page.waitForLoadState("domcontentloaded");
      await expect(page).toHaveURL(/\/login/);
      await expect(page.locator("form")).toBeVisible();
    });
  }
});
