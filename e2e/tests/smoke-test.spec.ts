import { test, expect } from "@playwright/test";

/**
 * Smoke tests - Verificación básica de funcionamiento
 */

test.describe("Smoke Tests - Páginas principales", () => {
  test("Homepage debería cargar", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await expect(page.locator("body")).toBeVisible();
  });

  test("Demo barbería debería cargar", async ({ page }) => {
    const response = await page.goto("/demo-barberia");
    expect(response?.status()).toBe(200);
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("[id='main-content']")).toBeVisible();
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
});
