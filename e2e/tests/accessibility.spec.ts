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

/**
 * Techo de nodos que axe declara `incomplete` (no pudo evaluar) para
 * color-contrast. NO es cero y no puede serlo: el hero pinta un
 * radial-gradient (business-hero.tsx) y axe no sabe resolver el fondo
 * efectivo de un elemento sobre un gradiente, asi que se abstiene.
 *
 * Por que existe este techo: `incomplete` no es `violation`, asi que sin este
 * chequeo el suite da verde sobre texto que nunca se evaluo. Paso de verdad:
 * los cuatro flujos de reserva pasaban mientras el calendario tenia texto a
 * 1.58:1. Si este numero sube, algo nuevo quedo fuera del chequeo — revisalo a
 * mano antes de subir el techo.
 */
const maxUnevaluatedNodes: Record<string, number> = {
  "/demo-barberia": 25,
  "/demo-barberia/reservar": 45,
};

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

      const incomplete = results.incomplete.filter((v) => v.id === "color-contrast");
      const incompleteNodes = incomplete.reduce((acc, v) => acc + v.nodes.length, 0);
      if (incompleteNodes > 0) {
        const reasons = new Set(
          incomplete.flatMap((v) =>
            v.nodes.flatMap((n) => (n.any ?? []).map((c) => c.message ?? "(sin mensaje)"))
          )
        );
        console.warn(
          `[a11y] SIN EVALUAR en ${path}: ${incompleteNodes} nodo/s\n` +
            [...reasons].map((r) => `   · ${r}`).join("\n")
        );
      }

      const maxUnevaluated = maxUnevaluatedNodes[path] ?? 0;
      expect(
        incompleteNodes,
        `axe no pudo evaluar el contraste de ${incompleteNodes} elemento/s en ${path} ` +
          `(techo: ${maxUnevaluated}). Son puntos ciegos: el resto del test puede dar verde ` +
          `sobre texto ilegible. Revisá esos elementos a mano antes de subir el techo.`
      ).toBeLessThanOrEqual(maxUnevaluated);

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
