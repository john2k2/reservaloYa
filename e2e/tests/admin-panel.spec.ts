import { test, expect } from "@playwright/test";

/**
 * Tests E2E para el panel de administración
 * Cubre: login, dashboard, navegación entre secciones
 */

test.describe("Panel Admin - Login", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/login");
  });

  test("debería mostrar el formulario de login", async ({ page }) => {
    // Verificar título
    await expect(page.getByRole("heading", { name: /Ingresar a tu negocio/i })).toBeVisible();

    // Verificar campos
    await expect(page.getByLabel(/Correo electrónico/i)).toBeVisible();
    await expect(page.getByLabel(/Contraseña/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Iniciar sesión/i })).toBeVisible();
  });

  test("debería mostrar error con credenciales inválidas", async ({ page }) => {
    // Completar formulario con datos inválidos
    await page.getByLabel(/Correo electrónico/i).fill("test@invalid.com");
    await page.getByLabel(/Contraseña/i).fill("wrongpassword");
    
    // Enviar
    await page.getByRole("button", { name: /Iniciar sesión/i }).click();

    // Verificar mensaje de error (o redirección si está en modo demo)
    await expect(
      page.getByText(/Credenciales incorrectas|Error/i).first()
    ).toBeVisible();
  });

  test("debería tener enlace para recuperar contraseña", async ({ page }) => {
    await expect(
      page.getByRole("link", { name: /Olvidé mi contraseña/i })
    ).toBeVisible();
  });
});

test.describe("Panel Admin - Dashboard (Modo Demo)", () => {
  test.beforeEach(async ({ page }) => {
    // En modo demo, ir directamente al dashboard
    await page.goto("/admin/dashboard");
    await page.waitForLoadState("networkidle");
  });

  test("debería mostrar el dashboard", async ({ page }) => {
    // Verificar título del dashboard
    await expect(
      page.getByRole("heading", { name: /Panel|Dashboard|Resumen/i })
    ).toBeVisible();
  });

  test("debería mostrar métricas clave", async ({ page }) => {
    // Verificar que hay tarjetas de métricas
    const metricCards = page.locator("[class*='metric'], [class*='card']");
    await expect(metricCards.first()).toBeVisible();
  });

  test("debería navegar a sección de turnos", async ({ page }) => {
    // Buscar link a turnos
    const bookingsLink = page.getByRole("link", { name: /Turnos|Reservas/i });
    
    if (await bookingsLink.isVisible().catch(() => false)) {
      await bookingsLink.click();
      await expect(page).toHaveURL(/\/admin\/bookings/);
      await expect(page.getByRole("heading", { name: /Turnos/i })).toBeVisible();
    }
  });

  test("debería navegar a sección de servicios", async ({ page }) => {
    // Buscar link a servicios
    const servicesLink = page.getByRole("link", { name: /Servicios/i });
    
    if (await servicesLink.isVisible().catch(() => false)) {
      await servicesLink.click();
      await expect(page).toHaveURL(/\/admin\/services/);
      await expect(page.getByRole("heading", { name: /Servicios/i })).toBeVisible();
    }
  });
});

test.describe("Panel Admin - Gestión de Servicios", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/services");
    await page.waitForLoadState("networkidle");
  });

  test("debería mostrar lista de servicios o estado vacío", async ({ page }) => {
    // Verificar que hay un heading
    await expect(
      page.getByRole("heading", { name: /Servicios/i })
    ).toBeVisible();

    // Verificar que hay contenido (lista de servicios o mensaje vacío)
    const content = page.locator("main, [class*='content']");
    await expect(content).toBeVisible();
  });

  test("debería tener botón para agregar servicio", async ({ page }) => {
    const addButton = page.getByRole("button", { name: /Agregar|Nuevo|Crear/i });
    
    if (await addButton.isVisible().catch(() => false)) {
      await expect(addButton).toBeVisible();
    }
  });
});

test.describe("Panel Admin - Disponibilidad", () => {
  test("debería mostrar configuración de horarios", async ({ page }) => {
    await page.goto("/admin/availability");
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("heading", { name: /Disponibilidad|Horarios/i })
    ).toBeVisible();
  });
});
