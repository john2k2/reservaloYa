import { test, expect } from "@playwright/test";

/**
 * Smoke tests - verificacion basica de funcionamiento
 */

test.describe("Smoke Tests - Paginas principales", () => {
  test.describe.configure({ mode: "serial" });

  test("Homepage deberia cargar", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await expect(page.locator("body")).toBeVisible();
  });

  test("Demo barberia deberia cargar", async ({ page }) => {
    const response = await page.goto("/demo-barberia");
    expect(response?.status()).toBe(200);
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("#main-content").first()).toBeVisible();
  });

  test("Pagina de reserva deberia cargar", async ({ page }) => {
    const response = await page.goto("/demo-barberia/reservar");
    expect(response?.status()).toBe(200);
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByText(/reserva online/i)).toBeVisible();
    await expect(page.getByRole("heading", { name: /selecciona el servicio que quieres reservar/i })).toBeVisible();
  });

  test("Admin login deberia cargar", async ({ page }) => {
    const response = await page.goto("/admin/login");
    expect(response?.status()).toBe(200);
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("main, form").first()).toBeVisible();
    await expect(page.getByText(/iniciar sesion|panel de/i).first()).toBeVisible();
  });

  test("Admin dashboard deberia cargar (modo demo)", async ({ page }) => {
    const response = await page.goto("/admin/dashboard");
    expect(response?.status()).toBe(200);
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("main")).toBeVisible();
  });

  test("Admin onboarding deberia cargar", async ({ page }) => {
    const response = await page.goto("/admin/onboarding");
    expect(response?.status()).toBe(200);
    await expect(page.locator("body")).toBeVisible();
    // Sin sesión redirige a /login, con sesión muestra /admin/onboarding o /admin/dashboard
    const url = page.url();
    expect(url.includes("/admin") || url.includes("/login")).toBeTruthy();
  });

  test("Admin bookings deberia cargar", async ({ page }) => {
    const response = await page.goto("/admin/bookings");
    expect(response?.status()).toBe(200);
    await expect(page.locator("body")).toBeVisible();
    const url = page.url();
    expect(url.includes("/admin") || url.includes("/login")).toBeTruthy();
  });

  test("Admin services deberia cargar", async ({ page }) => {
    const response = await page.goto("/admin/services");
    expect(response?.status()).toBe(200);
    await expect(page.locator("body")).toBeVisible();
    const url = page.url();
    expect(url.includes("/admin") || url.includes("/login")).toBeTruthy();
  });

  test("Admin availability deberia cargar", async ({ page }) => {
    const response = await page.goto("/admin/availability");
    expect(response?.status()).toBe(200);
    await expect(page.locator("body")).toBeVisible();
    const url = page.url();
    expect(url.includes("/admin") || url.includes("/login")).toBeTruthy();
  });

  test("Ruta inexistente deberia devolver 404", async ({ page }) => {
    await page.goto("/ruta-que-no-existe-abc123");
    await expect(page.locator("body")).toBeVisible();
    // Next.js renderiza la página 404 — verificar contenido visual
    const has404 = await page.getByText(/404|no encontrada|not found/i).first().isVisible({ timeout: 3000 }).catch(() => false);
    expect(has404).toBeTruthy();
  });
});
