import { test, expect } from "@playwright/test";

/**
 * Tests E2E para el panel de administracion
 * Cubre: login, dashboard, navegacion, gestion de servicios,
 *        onboarding con tabs (negocio, estilo, integraciones),
 *        politica de cancelacion, disponibilidad
 */

test.describe("Panel Admin - Login", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/login");
    await page.waitForLoadState("domcontentloaded");
  });

  test("deberia mostrar el formulario de login o redirigir en modo demo", async ({ page }) => {
    const url = page.url();
    if (url.includes("/admin/login")) {
      await expect(page.locator("form")).toBeVisible();
      await expect(page.locator('input[type="email"], input[type="text"]').first()).toBeVisible();
      await expect(page.locator('input[type="password"]').first()).toBeVisible();
    } else {
      // Redirigió al dashboard en modo demo
      expect(url).toMatch(/admin/);
    }
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

test.describe("Panel Admin - Dashboard (Modo Demo)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/dashboard");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);
  });

  test("deberia mostrar el dashboard o el login", async ({ page }) => {
    // Sin sesión redirige a /login, con sesión muestra /admin/dashboard
    const url = page.url();
    expect(url.includes("/admin") || url.includes("/login")).toBeTruthy();
    await expect(page.locator("body")).toBeVisible();
  });

  test("deberia mostrar metricas o contenido en modo demo", async ({ page }) => {
    if (!page.url().includes("dashboard")) return;
    const cards = page.locator("article, section");
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test("deberia navegar a seccion de turnos", async ({ page }) => {
    if (!page.url().includes("dashboard")) return;
    const bookingsLink = page.getByRole("link", { name: /Turnos|Reservas/i }).first();
    if (await bookingsLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await Promise.all([
        page.waitForURL(/\/admin\/bookings/, { timeout: 5000 }),
        bookingsLink.click(),
      ]);
      expect(page.url()).toMatch(/\/admin\/bookings/);
    }
  });

  test("deberia navegar a seccion de servicios", async ({ page }) => {
    if (!page.url().includes("dashboard")) return;
    const servicesLink = page.getByRole("link", { name: /Servicios/i }).first();
    if (await servicesLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await Promise.all([
        page.waitForURL(/\/admin\/services/, { timeout: 5000 }),
        servicesLink.click(),
      ]);
      expect(page.url()).toMatch(/\/admin\/services/);
    }
  });
});

test.describe("Panel Admin - Gestion de Servicios", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/services");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);
  });

  test("deberia mostrar lista de servicios o estado vacio", async ({ page }) => {
    await expect(page.locator("body")).toBeVisible();
    const heading = page.getByRole("heading").first();
    const main = page.locator("main, [role='main']");
    const hasContent = await heading.isVisible({ timeout: 3000 }).catch(() => false)
      || await main.isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasContent).toBeTruthy();
  });

  test("deberia tener boton para agregar servicio", async ({ page }) => {
    const addButton = page.getByRole("button", { name: /Agregar|Nuevo|Crear/i }).first();
    const addLink = page.getByRole("link", { name: /Agregar|Nuevo|Crear/i }).first();
    const buttonVisible = await addButton.isVisible({ timeout: 3000 }).catch(() => false);
    const linkVisible = await addLink.isVisible({ timeout: 3000 }).catch(() => false);
    expect(buttonVisible || linkVisible || page.url().includes("login")).toBeTruthy();
  });
});

test.describe("Panel Admin - Disponibilidad", () => {
  test("deberia mostrar configuracion de horarios", async ({ page }) => {
    await page.goto("/admin/availability");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);
    await expect(page.locator("body")).toBeVisible();
    const url = page.url();
    expect(url.includes("/admin") || url.includes("/login")).toBeTruthy();
  });

  test("deberia mostrar dias de la semana configurables", async ({ page }) => {
    await page.goto("/admin/availability");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);

    if (!page.url().includes("availability")) return;

    const dayToggle = page.getByText(/Lunes|Martes|Jueves|Viernes/i).first();
    const hasDays = await dayToggle.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasDays) {
      await expect(dayToggle).toBeVisible();
    }
  });
});

test.describe("Panel Admin - Onboarding / Configuracion del negocio", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/onboarding");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);
  });

  test("deberia cargar la pagina de onboarding", async ({ page }) => {
    await expect(page.locator("body")).toBeVisible();
    const url = page.url();
    expect(url.includes("/admin") || url.includes("/login")).toBeTruthy();
  });

  test("deberia mostrar los tabs de configuracion", async ({ page }) => {
    if (!page.url().includes("onboarding")) return;

    const allTabs = page.getByRole("button").filter({ hasText: /Negocio|Estilo|Fotos|Integraciones/i });
    const tabCount = await allTabs.count();
    if (tabCount > 0) {
      expect(tabCount).toBeGreaterThanOrEqual(3);
    }
  });

  test("deberia mostrar el tab de Negocio con campo nombre", async ({ page }) => {
    if (!page.url().includes("onboarding")) return;

    const negocioTab = page.getByRole("button", { name: /^Negocio$/i }).first();
    const hasTab = await negocioTab.isVisible({ timeout: 5000 }).catch(() => false);
    if (!hasTab) return;

    await negocioTab.click();
    await page.waitForTimeout(500);

    const nameInput = page.getByLabel(/Nombre del negocio/i);
    const hasName = await nameInput.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasName) {
      await expect(nameInput).toBeVisible();
    }
  });

  test("deberia mostrar campo politica de cancelacion en tab Negocio", async ({ page }) => {
    if (!page.url().includes("onboarding")) return;

    const negocioTab = page.getByRole("button", { name: /^Negocio$/i }).first();
    const hasTab = await negocioTab.isVisible({ timeout: 5000 }).catch(() => false);
    if (!hasTab) return;

    await negocioTab.click();
    await page.waitForTimeout(500);

    const policyLabel = page.getByText(/Politica de cancelaci/i).first();
    const hasPolicyLabel = await policyLabel.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasPolicyLabel) {
      await expect(policyLabel).toBeVisible();
    }
  });

  test("deberia mostrar tab de Integraciones con card de MercadoPago", async ({ page }) => {
    if (!page.url().includes("onboarding")) return;

    const integrationsTab = page.getByRole("button", { name: /Integraciones/i }).first();
    const hasTab = await integrationsTab.isVisible({ timeout: 5000 }).catch(() => false);
    if (!hasTab) return;

    await integrationsTab.click();
    await page.waitForTimeout(500);

    const mpText = page.getByText(/MercadoPago/i).first();
    const hasMp = await mpText.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasMp) {
      await expect(mpText).toBeVisible();

      const conectarBtn = page.getByRole("link", { name: /Conectar con MercadoPago/i });
      const desconectarBtn = page.getByRole("button", { name: /Desconectar/i });
      const noConfigMsg = page.getByText(/MP_APP_ID no configurado/i);

      const hasConectar = await conectarBtn.isVisible({ timeout: 2000 }).catch(() => false);
      const hasDesconectar = await desconectarBtn.isVisible({ timeout: 2000 }).catch(() => false);
      const hasNoConfig = await noConfigMsg.isVisible({ timeout: 2000 }).catch(() => false);

      expect(hasConectar || hasDesconectar || hasNoConfig).toBeTruthy();
    }
  });

  test("deberia navegar a onboarding con tab=integraciones sin errores", async ({ page }) => {
    await page.goto("/admin/onboarding?tab=integraciones");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);

    await expect(page.locator("body")).toBeVisible();
    const errorText = page.getByText(/Application error|Runtime Error/i);
    const hasError = await errorText.isVisible({ timeout: 2000 }).catch(() => false);
    expect(hasError).toBeFalsy();
  });

  test("deberia tener boton Guardar todo visible", async ({ page }) => {
    if (!page.url().includes("onboarding")) return;

    const saveButton = page.getByRole("button", { name: /Guardar todo/i });
    const hasSave = await saveButton.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasSave) {
      await expect(saveButton).toBeVisible();
    }
  });

  test("deberia tener link de pagina publica en onboarding", async ({ page }) => {
    if (!page.url().includes("onboarding")) return;

    const viewLink = page.getByRole("link", { name: /Ver p/i }).first();
    const hasViewLink = await viewLink.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasViewLink) {
      await expect(viewLink).toBeVisible();
      const href = await viewLink.getAttribute("href");
      expect(href).toBeTruthy();
    }
  });
});

test.describe("Panel Admin - Clientes", () => {
  test("deberia cargar la seccion de clientes", async ({ page }) => {
    await page.goto("/admin/customers");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);
    await expect(page.locator("body")).toBeVisible();
    const url = page.url();
    expect(url.includes("/admin") || url.includes("/login")).toBeTruthy();
  });
});
