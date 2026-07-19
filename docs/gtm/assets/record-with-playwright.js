const { chromium } = require('playwright');
const path = require('path');

const OUT_DIR = path.join(__dirname);
const VIDEO_DIR = path.join(OUT_DIR, 'pw-video-raw');

async function pause(page, ms) {
  await page.waitForTimeout(ms);
}

(async () => {
  const browser = await chromium.launch({
    executablePath:
      process.env.CHROME_PATH ||
      '/home/john/.cache/ms-playwright/chromium-1229/chrome-linux64/chrome',
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: VIDEO_DIR,
      size: { width: 1280, height: 720 },
    },
    locale: 'es-AR',
  });

  const page = await context.newPage();

  // Landing
  await page.goto('https://reservaya.ar/', { waitUntil: 'networkidle' });
  await pause(page, 1500);
  await page.evaluate(() => window.scrollBy({ top: 260, behavior: 'smooth' }));
  await pause(page, 1500);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await pause(page, 800);

  // Demo
  await page.goto('https://reservaya.ar/demo-barberia', { waitUntil: 'networkidle' });
  await pause(page, 1400);
  await page.evaluate(() => window.scrollBy({ top: 480, behavior: 'smooth' }));
  await pause(page, 1800);

  // Booking
  await page.goto(
    'https://reservaya.ar/demo-barberia/reservar?service=22222222-2222-2222-2222-222222222221&date=2026-07-24',
    { waitUntil: 'networkidle' }
  );
  await pause(page, 1000);

  await page.evaluate(() => {
    const el = document.querySelector('input[value="10:30"]') || document.querySelector('input[value="11:00"]') || document.querySelector('input[type=radio]');
    if (el) {
      el.scrollIntoView({ block: 'center' });
      el.click();
    }
  });
  await pause(page, 700);

  await page.getByRole('textbox', { name: /Nombre completo/i }).fill('Demo ReservaYa');
  await page.getByRole('textbox', { name: /Correo electrónico/i }).fill('demo@reservaya.ar');
  await pause(page, 600);

  await page.getByRole('button', { name: /Confirmar reserva/i }).first().click();
  await pause(page, 600);
  await page.getByRole('button', { name: /Sí, confirmar turno/i }).click();
  await page.waitForURL(/confirmacion/, { timeout: 30000 });
  await pause(page, 2500);

  // Close CTA
  await page.goto('https://reservaya.ar/', { waitUntil: 'domcontentloaded' });
  await pause(page, 2000);

  await context.close();
  await browser.close();

  const fs = require('fs');
  const files = fs.readdirSync(VIDEO_DIR).filter((f) => f.endsWith('.webm'));
  if (!files.length) throw new Error('No video produced');
  const src = path.join(VIDEO_DIR, files[0]);
  const dest = path.join(OUT_DIR, 'reservaya-demo-2026-07-17.webm');
  fs.copyFileSync(src, dest);
  console.log('OK', dest, fs.statSync(dest).size);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
