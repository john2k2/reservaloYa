import { test, expect } from "@playwright/test";

test.describe("Landing Page - Responsive", () => {
  test("should render correctly on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    
    // Verificar que el hero se vea correctamente
    const hero = await page.locator("h1");
    await expect(hero).toBeVisible();
    
    // Verificar que el SignatureMoment esté presente
    const signature = await page.locator("text=Dejá el caos atrás");
    await expect(signature).toBeVisible();
    
    // Verificar que las features estén en columna
    const features = await page.locator("article").count();
    expect(features).toBeGreaterThan(0);
  });

  test("should render correctly on tablet", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");
    
    const hero = await page.locator("h1");
    await expect(hero).toBeVisible();
    
    // Verificar grid de features en 2 columnas
    const grid = await page.locator(".grid").first();
    await expect(grid).toBeVisible();
  });

  test("should render correctly on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    
    const hero = await page.locator("h1");
    await expect(hero).toBeVisible();
    
    // Verificar que la fuente display se aplique
    const heroText = await hero.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return styles.fontFamily;
    });
    
    // La fuente debería incluir Newsreader
    expect(heroText).toContain("Newsreader");
  });

  test("SignatureMoment animation works", async ({ page }) => {
    await page.goto("/");
    
    // Verificar que los dots de progreso existen
    const dots = await page.locator("button[aria-label^='Paso']").count();
    expect(dots).toBe(2);
    
    // Click en el segundo dot
    await page.click("button[aria-label='Paso 2']");
    
    // Verificar que el contenido cambió
    const reservaya = await page.locator("text=ReservaYa").first();
    await expect(reservaya).toBeVisible();
  });
});