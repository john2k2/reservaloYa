import { test, expect } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";

/**
 * Chequeo de accesibilidad con axe-core sobre las páginas públicas del negocio demo.
 *
 * Decisión de umbral: solo fallamos ante violaciones `critical` o `serious`.
 * Las de impacto `moderate`/`minor` se reportan como warning en consola pero no
 * bloquean CI: el objetivo es detectar regresiones graves (contraste roto,
 * imágenes sin alt, controles sin nombre) sin que el suite quede rehén de
 * ruido menor de librerías de terceros (iframes de mapas, embeds).
 *
 * Ojo: el primer run en CI puede revelar violaciones serious/critical
 * preexistentes; en ese caso hay que arreglarlas o relajar el umbral.
 */

const pagesToAudit = [
  { path: "/demo-barberia", name: "landing del negocio" },
  { path: "/demo-barberia/reservar", name: "flujo de reserva" },
];

test.describe("Accesibilidad (axe-core) - páginas públicas", () => {
  test.describe.configure({ mode: "serial" });

  for (const { path, name } of pagesToAudit) {
    test(`${name} (${path}) no tiene violaciones critical/serious`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator("body")).toBeVisible();

      const results = await new AxeBuilder({ page }).analyze();

      const blocking = results.violations.filter(
        (violation) => violation.impact === "critical" || violation.impact === "serious"
      );

      const minor = results.violations.filter(
        (violation) => violation.impact !== "critical" && violation.impact !== "serious"
      );
      if (minor.length > 0) {
        console.warn(
          `[a11y] Violaciones moderate/minor en ${path} (no bloquean):`,
          minor.map((v) => `${v.impact}: ${v.id}`).join(", ")
        );
      }

      expect(
        blocking,
        `Violaciones de accesibilidad critical/serious en ${path}:\n${blocking
          .map(
            (v) =>
              `- [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} elemento/s) — ${v.helpUrl}`
          )
          .join("\n")}`
      ).toEqual([]);
    });
  }
});
