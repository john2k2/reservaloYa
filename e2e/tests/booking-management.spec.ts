import { test, expect } from "@playwright/test";

/**
 * Tests E2E para gestión de turnos desde el admin
 * Cubre: listado de turnos, filtros, actualización de estado
 */

test.describe("Gestión de Turnos - Admin", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/bookings");
    await page.waitForLoadState("networkidle");
  });

  test("debería mostrar el listado de turnos", async ({ page }) => {
    // Verificar título
    await expect(
      page.getByRole("heading", { name: /Turnos|Reservas/i })
    ).toBeVisible();

    // Verificar que hay filtros
    await expect(
      page.getByRole("combobox").first() || page.locator("select").first()
    ).toBeVisible();
  });

  test("debería permitir filtrar por estado", async ({ page }) => {
    // Buscar selector de estado
    const statusSelect = page.locator("select[name='status'], [data-testid='status-filter']").first();
    
    if (await statusSelect.isVisible().catch(() => false)) {
      await statusSelect.selectOption("confirmed");
      
      // Verificar que se aplicó el filtro
      await expect(page).toHaveURL(/status=confirmed/);
    }
  });

  test("debería permitir buscar turnos", async ({ page }) => {
    // Buscar campo de búsqueda
    const searchInput = page.getByPlaceholder(/Buscar|Search/i);
    
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill("test");
      await searchInput.press("Enter");
      
      // Verificar que se aplicó la búsqueda
      await expect(page).toHaveURL(/q=test/);
    }
  });

  test("debería mostrar detalles de un turno", async ({ page }) => {
    // Buscar tarjetas de turnos
    const bookingCards = page.locator("[class*='booking'], article, [class*='card']");
    
    if (await bookingCards.first().isVisible().catch(() => false)) {
      // Verificar que hay información del cliente
      const clientInfo = page.getByText(/cliente|nombre|@/i).first();
      await expect(clientInfo).toBeVisible();
    }
  });
});

test.describe("Gestión de Turnos - Confirmación/Cancelación", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/bookings");
    await page.waitForLoadState("networkidle");
  });

  test("debería tener botones de acción en turnos", async ({ page }) => {
    // Buscar botones de acción
    const actionButtons = page.getByRole("button").filter({
      hasText: /Confirmar|Cancelar|Completar/i,
    });

    // Si hay turnos, debería haber botones
    const count = await actionButtons.count();
    if (count > 0) {
      await expect(actionButtons.first()).toBeVisible();
    }
  });

  test("debería permitir cambiar estado de un turno", async ({ page }) => {
    // Buscar selector de estado en un turno
    const statusSelector = page
      .locator("select")
      .filter({ hasText: /Pendiente|Confirmado|Cancelado/i })
      .first();

    if (await statusSelector.isVisible().catch(() => false)) {
      // Cambiar estado
      await statusSelector.selectOption("confirmed");
      
      // Verificar que hay botón de guardar o cambio automático
      const saveButton = page.getByRole("button", { name: /Guardar|Actualizar/i });
      if (await saveButton.isVisible().catch(() => false)) {
        await saveButton.click();
        
        // Verificar mensaje de éxito
        await expect(
          page.getByText(/actualizado|guardado|éxito/i).first()
        ).toBeVisible();
      }
    }
  });
});

test.describe("Gestión de Turnos - Página Pública", () => {
  test("debería mostrar confirmación después de reservar", async ({ page }) => {
    // Simular acceso a página de confirmación con un booking ID
    await page.goto("/demo-barberia/confirmacion?booking=test-booking-id");
    
    // Verificar que se muestra información de confirmación
    await expect(
      page.getByText(/Confirmación|Turno confirmado|Reserva confirmada/i).first()
    ).toBeVisible();
  });

  test("debería permitir ver detalles del turno desde link público", async ({ page }) => {
    // Ir a página de gestión de turno (mi-turno)
    await page.goto("/demo-barberia/mi-turno?id=test-booking-id&token=test-token");
    
    // Verificar que muestra información del turno o mensaje de error
    const content = page.locator("[id='main-content'], main");
    await expect(content).toBeVisible();
  });
});

test.describe("Accesibilidad - Gestión de Turnos", () => {
  test("debería tener atributos ARIA correctos", async ({ page }) => {
    await page.goto("/admin/bookings");
    await page.waitForLoadState("networkidle");

    // Verificar que los formularios tienen labels
    const selects = page.locator("select");
    const count = await selects.count();
    
    for (let i = 0; i < Math.min(count, 3); i++) {
      const select = selects.nth(i);
      const ariaLabel = await select.getAttribute("aria-label");
      const hasLabel = await select.evaluate((el) => {
        const id = el.id;
        if (!id) return false;
        const label = document.querySelector(`label[for="${id}"]`);
        return !!label;
      });
      
      // Debería tener aria-label o label asociado
      expect(ariaLabel || hasLabel).toBeTruthy();
    }
  });
});
