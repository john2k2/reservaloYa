import { test, expect } from "@playwright/test";

/**
 * Tests E2E para el flujo público de reserva
 * Cubre: visualización de negocio, selección de servicio, reserva
 */

test.describe("Flujo público de reserva", () => {
  test.beforeEach(async ({ page }) => {
    // Ir a la página demo de barbería
    await page.goto("/demo-barberia");
    // Esperar a que cargue el contenido principal
    await page.waitForSelector("[id=\"main-content\"]");
  });

  test("debería mostrar la página del negocio con información correcta", async ({
    page,
  }) => {
    // Verificar título
    await expect(page).toHaveTitle(/Barbería|ReservaYa/);

    // Verificar elementos clave del hero
    await expect(
      page.getByRole("heading", { name: /Reserva online|Reservá tu turno/i })
    ).toBeVisible();

    // Verificar botón de reserva
    await expect(
      page.getByRole("link", { name: /Reservar turno|Reservar/i })
    ).toBeVisible();

    // Verificar servicios
    await expect(page.getByText(/Corte|Servicios/i)).toBeVisible();
  });

  test("debería navegar al formulario de reserva", async ({ page }) => {
    // Click en reservar
    await page.getByRole("link", { name: /Reservar/i }).first().click();

    // Verificar que estamos en la página de reserva
    await expect(page).toHaveURL(/\/demo-barberia\/reservar/);

    // Verificar título de la página de reserva
    await expect(
      page.getByRole("heading", { name: /Elige un servicio|Selecciona el servicio/i })
    ).toBeVisible();
  });

  test("debería permitir seleccionar un servicio", async ({ page }) => {
    // Ir a reserva
    await page.goto("/demo-barberia/reservar");
    await page.waitForSelector("[id=\"main-content\"]");

    // Verificar que hay servicios disponibles
    const serviceCards = page.locator("a[href*=\"service=\"]");
    await expect(serviceCards.first()).toBeVisible();

    // Seleccionar primer servicio
    await serviceCards.first().click();

    // Verificar que avanzamos al paso 2 (selección de fecha)
    await expect(page).toHaveURL(/service=/);
    await expect(
      page.getByRole("heading", { name: /Elige día y hora/i })
    ).toBeVisible();
  });

  test("debería mostrar el formulario de datos del cliente", async ({ page }) => {
    // Ir directamente a reserva con servicio seleccionado
    await page.goto("/demo-barberia/reservar?service=22222222-2222-2222-2222-222222222221");
    await page.waitForSelector("[id=\"main-content\"]");

    // Verificar campos del formulario
    await expect(page.getByLabel(/Nombre completo/i)).toBeVisible();
    await expect(page.getByLabel(/WhatsApp/i)).toBeVisible();
    await expect(page.getByLabel(/Correo electrónico/i)).toBeVisible();
    await expect(page.getByLabel(/Notas adicionales/i)).toBeVisible();
  });

  test("debería validar campos requeridos", async ({ page }) => {
    // Ir a reserva con servicio
    await page.goto("/demo-barberia/reservar?service=22222222-2222-2222-2222-222222222221");
    await page.waitForSelector("[id=\"main-content\"]");

    // Intentar enviar sin completar datos
    const submitButton = page.getByRole("button", { name: /Confirmar reserva/i });
    
    // El botón debería estar presente
    await expect(submitButton).toBeVisible();
    
    // Verificar que los campos requeridos tienen el atributo required
    await expect(page.getByLabel(/Nombre completo/i)).toHaveAttribute("required");
    await expect(page.getByLabel(/WhatsApp/i)).toHaveAttribute("required");
  });
});

test.describe("SEO - Página pública", () => {
  test("debería tener metadatos correctos", async ({ page }) => {
    await page.goto("/demo-barberia");

    // Verificar title
    await expect(page).toHaveTitle(/Reserva tu turno online/);

    // Verificar meta description
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute("content", /Reserva tu turno/);
  });

  test("debería tener JSON-LD estructurado", async ({ page }) => {
    await page.goto("/demo-barberia");

    // Verificar que existe el script de JSON-LD
    const jsonLdScript = page.locator('script[type="application/ld+json"]');
    await expect(jsonLdScript.first()).toBeVisible();

    // Verificar que contiene LocalBusiness
    const jsonContent = await jsonLdScript.first().textContent();
    expect(jsonContent).toContain("LocalBusiness");
    expect(jsonContent).toContain("Barbería");
  });
});

test.describe("Responsive - Mobile", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("debería mostrar correctamente en móvil", async ({ page }) => {
    await page.goto("/demo-barberia");
    await page.waitForSelector("[id=\"main-content\"]");

    // Verificar que no hay scroll horizontal
    const body = page.locator("body");
    const bodyWidth = await body.evaluate((el) => el.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);

    // Verificar botón sticky visible
    await expect(
      page.getByRole("link", { name: /Reservar/i }).first()
    ).toBeVisible();
  });
});
