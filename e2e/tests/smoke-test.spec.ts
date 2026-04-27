import { test, expect } from "@playwright/test";

async function expectNoRenderedNotFound(page: import("@playwright/test").Page) {
  await expect(page.getByRole("heading", { name: /página no encontrada|page not found/i })).toHaveCount(0);
  await expect(page.locator('meta[name="next-error"][content="not-found"]')).toHaveCount(0);
}

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
    await expectNoRenderedNotFound(page);
    await expect(page.locator("#main-content").first()).toBeVisible();
  });

  test("Pagina de reserva deberia cargar", async ({ page }) => {
    const response = await page.goto("/demo-barberia/reservar");
    expect(response?.status()).toBe(200);
    await expect(page.locator("body")).toBeVisible();
    await expectNoRenderedNotFound(page);
    await expect(page.getByText(/reserva online/i)).toBeVisible();
    await expect(page.getByRole("heading", { name: "¿Qué servicio querés reservar?" })).toBeVisible();
  });

  test("Admin login deberia cargar", async ({ page }) => {
    const response = await page.goto("/admin/login");
    expect(response?.status()).toBe(200);
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("main, form").first()).toBeVisible();
    await expect(page.getByText(/iniciar sesi[oó]n|ingresar a tu negocio/i).first()).toBeVisible();
  });

  test("Admin dashboard sin sesión deberia redirigir a login", async ({ page }) => {
    const response = await page.goto("/admin/dashboard");
    expect(response?.status()).toBe(200);
    await expect(page.locator("body")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator("form")).toBeVisible();
  });

  test("Admin onboarding deberia cargar", async ({ page }) => {
    const response = await page.goto("/admin/onboarding");
    expect(response?.status()).toBe(200);
    await expect(page.locator("body")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("Admin bookings deberia cargar", async ({ page }) => {
    const response = await page.goto("/admin/bookings");
    expect(response?.status()).toBe(200);
    await expect(page.locator("body")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("Admin services deberia cargar", async ({ page }) => {
    const response = await page.goto("/admin/services");
    expect(response?.status()).toBe(200);
    await expect(page.locator("body")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("Admin availability deberia cargar", async ({ page }) => {
    const response = await page.goto("/admin/availability");
    expect(response?.status()).toBe(200);
    await expect(page.locator("body")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("Ruta inexistente deberia mostrar pagina de error", async ({ page }) => {
    await page.goto("/ruta-que-no-existe-abc123");
    await page.waitForLoadState("networkidle");
    // Next.js llama notFound() en el [slug] page — renderiza el not-found.tsx
    const heading = page.getByRole("heading", { level: 1 });
    const headingText = await heading.textContent({ timeout: 5000 }).catch(() => "");
    const bodyText = await page.locator("body").textContent().catch(() => "");
    const hasNotFound = /404|no encontrad|not found|p.gina no/i.test(headingText + " " + bodyText);
    expect(hasNotFound).toBeTruthy();
  });
});
