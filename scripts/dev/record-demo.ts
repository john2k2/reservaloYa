/**
 * Script para grabar un video demo del flujo de reserva en ReservaYa.
 * Usa Playwright directamente (no el test runner) contra producción.
 *
 * Uso:
 *   npx tsx scripts/record-demo.ts
 *
 * El video queda en: videos/demo-reservaya.webm
 * Convertir a mp4 (opcional): ffmpeg -i videos/demo-reservaya.webm videos/demo-reservaya.mp4
 */

import { chromium } from "@playwright/test";
import path from "path";
import fs from "fs";

const BASE_URL = "https://reservaya.ar";
const SLUG = "demo-barberia";
const VIDEO_DIR = path.join(process.cwd(), "videos");

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  fs.mkdirSync(VIDEO_DIR, { recursive: true });

  const browser = await chromium.launch({
    headless: false, // visible para poder ver qué está pasando
    slowMo: 60,      // frena cada acción 60ms — movimientos más naturales
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordVideo: {
      dir: VIDEO_DIR,
      size: { width: 1280, height: 800 },
    },
    locale: "es-AR",
  });

  const page = await context.newPage();

  try {
    // ── 1. Landing del negocio ──────────────────────────────────────────────
    console.log("▶ Abriendo página del negocio...");
    await page.goto(`${BASE_URL}/${SLUG}`, { waitUntil: "networkidle" });
    await sleep(2500); // dejar que el usuario "lea" el hero

    // Scroll suave para mostrar servicios
    await page.evaluate(() => window.scrollBy({ top: 400, behavior: "smooth" }));
    await sleep(1800);

    // Scroll un poco más para mostrar el resto
    await page.evaluate(() => window.scrollBy({ top: 300, behavior: "smooth" }));
    await sleep(1500);

    // Volver arriba
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    await sleep(1200);

    // ── 2. Click en "Reservar" ──────────────────────────────────────────────
    console.log("▶ Haciendo click en Reservar...");
    const reservarBtn = page.getByRole("link", { name: /Reservar/i }).first();
    await reservarBtn.scrollIntoViewIfNeeded();
    await sleep(600);
    await reservarBtn.click();
    await page.waitForURL(`**/${SLUG}/reservar**`, { timeout: 15000 });
    await page.waitForLoadState("networkidle");
    await sleep(2000);

    // ── 3. Elegir servicio ─────────────────────────────────────────────────
    console.log("▶ Seleccionando servicio...");
    // Hover sobre el primer servicio antes de clickear
    const firstService = page.locator("a[href*='service=']").first();
    await firstService.scrollIntoViewIfNeeded();
    await sleep(800);
    await firstService.hover();
    await sleep(600);
    await firstService.click();
    await page.waitForLoadState("networkidle");
    await sleep(2000);

    // ── 4. Elegir fecha con horarios disponibles ───────────────────────────
    console.log("▶ Buscando una fecha con horarios disponibles...");

    // Los días clickeables del calendario son <button> con spans adentro que tienen el número
    // Los días sin disponibilidad son <div> (no <button>)
    const calendarDayBtns = page.locator(
      "div.grid.grid-cols-7 button"
    );

    let slotFound = false;

    const dayCount = await calendarDayBtns.count();
    console.log(`   Encontré ${dayCount} días disponibles en el calendario`);

    for (let i = 0; i < dayCount && !slotFound; i++) {
      const btn = calendarDayBtns.nth(i);
      await btn.scrollIntoViewIfNeeded();
      await sleep(300);
      await btn.hover();
      await sleep(300);
      await btn.click();

      // Esperar a que carguen los slots (o aparezca "Sin horarios")
      await sleep(1800);

      const slots = page.locator(".dt-picker-slot");
      const noSlots = page.locator("text=Sin horarios").first();

      const slotCount = await slots.count();
      const hasNoSlots = await noSlots.isVisible().catch(() => false);

      if (slotCount > 0 && !hasNoSlots) {
        console.log(`   ✓ Día con ${slotCount} horarios encontrado`);
        slotFound = true;
        await sleep(500);

        // ── 5. Elegir horario ───────────────────────────────────────────
        console.log("▶ Eligiendo horario...");
        const timeSlot = slots.first();
        await timeSlot.scrollIntoViewIfNeeded();
        await sleep(600);
        await timeSlot.hover();
        await sleep(500);
        await timeSlot.click();
        await sleep(1800);
      } else {
        console.log(`   ✗ Sin horarios, probando el siguiente día...`);
      }
    }

    if (!slotFound) {
      throw new Error("No se encontró ningún día con horarios disponibles en el demo.");
    }

    // ── 6. Completar datos del cliente ────────────────────────────────────
    console.log("▶ Completando datos...");
    const nameInput = page.locator("input#fullName");
    await nameInput.scrollIntoViewIfNeeded();
    await sleep(600);
    await nameInput.click();
    await sleep(300);
    await nameInput.type("Maria Gonzalez", { delay: 60 });
    await sleep(500);

    const emailInput = page.locator("input#email");
    await emailInput.click();
    await sleep(300);
    await emailInput.type("maria@email.com", { delay: 60 });
    await sleep(500);

    const phoneInput = page.locator("input#phone");
    await phoneInput.click();
    await sleep(300);
    await phoneInput.type("11 5555 5555", { delay: 60 });
    await sleep(800);

    // ── 7. Scroll al botón de confirmar ───────────────────────────────────
    console.log("▶ Mostrando botón de confirmar...");
    const confirmBtn = page.getByRole("button", { name: /Confirmar|Continuar al pago/i }).first();
    await confirmBtn.scrollIntoViewIfNeeded();
    await sleep(1500);

    // Hover sobre el botón para que se vea el estado hover
    await confirmBtn.hover();
    await sleep(1200);

    // ── 8. Pausa final antes de cerrar ────────────────────────────────────
    await sleep(2000);

    console.log("✅ Flujo grabado. Guardando video...");
  } catch (err) {
    console.error("❌ Error durante la grabación:", err);
  } finally {
    await context.close(); // esto guarda el video
    await browser.close();
  }

  // Renombrar el video generado al nombre deseado
  const files = fs.readdirSync(VIDEO_DIR).filter((f) => f.endsWith(".webm"));
  if (files.length > 0) {
    const generated = path.join(VIDEO_DIR, files[files.length - 1]);
    const target = path.join(VIDEO_DIR, "demo-reservaya.webm");
    if (generated !== target) {
      fs.renameSync(generated, target);
    }
    console.log(`\n🎬 Video guardado en: ${target}`);
    console.log(`   Convertir a MP4: ffmpeg -i ${target} videos/demo-reservaya.mp4`);
  } else {
    console.log("⚠️  No se encontró el archivo de video.");
  }
}

main().catch(console.error);
