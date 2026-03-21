import { test, expect } from "@playwright/test";

/**
 * Smoke tests - Verificación básica de funcionamiento
 */

test.describe("Smoke Tests - Páginas principales", () => {
  test.describe.configure({ mode: "serial" });

  test("Homepage debería cargar", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await expect(page.locator("body")).toBeVisible();
  });

  test("Demo barbería debería cargar", async ({ page }) => {
    const response = await page.goto("/demo-barberia");
    expect(response?.status()).toBe(200);
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("#main-content").first()).toBeVisible();
  });

  test("Página de reserva debería cargar", async ({ page }) => {
    const response = await page.goto("/demo-barberia/reservar");
    expect(response?.status()).toBe(200);
    await expect(page.locator("body")).toBeVisible();
  });

  test("Admin login debería cargar", async ({ page }) => {
    const response = await page.goto("/admin/login");
    expect(response?.status()).toBe(200);
    await expect(page.locator("body")).toBeVisible();
  });

  test("Admin dashboard debería cargar (modo demo)", async ({ page }) => {
    const response = await page.goto("/admin/dashboard");
    expect(response?.status()).toBe(200);
    await expect(page.locator("body")).toBeVisible();
  });

  test("Admin onboarding debería cargar", async ({ page }) => {
    const response = await page.goto("/admin/onboarding");
    expect(response?.status()).toBe(200);
    await expect(page.locator("body")).toBeVisible();
  });

  test("Admin bookings debería cargar", async ({ page }) => {
    const response = await page.goto("/admin/bookings");
    expect(response?.status()).toBe(200);
    await expect(page.locator("body")).toBeVisible();
  });

  test("Admin services debería cargar", async ({ page }) => {
    const response = await page.goto("/admin/services");
    expect(response?.status()).toBe(200);
    await expect(page.locator("body")).toBeVisible();
  });

  test("Admin availability debería cargar", async ({ page }) => {
    const response = await page.goto("/admin/availability");
    expect(response?.status()).toBe(200);
    await expect(page.locator("body")).toBeVisible();
  });

  test("Ruta 404 debería manejarse", async ({ page }) => {
    await page.goto("/ruta-que-no-existe-abc123");
    await expect(page.locator("body")).toBeVisible();
    // Not found page o redirect — debe cargar sin crash
    const status = await page.evaluate(() => document.title);
    expect(status).toBeTruthy();
  });
});
