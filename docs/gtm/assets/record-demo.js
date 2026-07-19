async (page) => {
  const outPath = '/home/john/Documentos/proyectos/reservaloYa/docs/gtm/assets/reservaya-demo-2026-07-17.webm';
  const pause = (ms) => page.waitForTimeout(ms);

  await page.screencast.start({
    path: outPath,
    size: { width: 1280, height: 720 },
  });

  // Shot 1 — Landing
  await page.screencast.showChapter('ReservaYa', {
    description: 'Dejá de perder clientes por WhatsApp',
    duration: 2200,
  });

  await page.goto('https://reservaya.ar/', { waitUntil: 'networkidle' });
  await pause(1200);

  await page.screencast.showOverlay(`
    <div style="position:absolute;top:16px;left:16px;padding:10px 16px;
      background:rgba(26,28,46,.88);color:#fff;border-radius:12px;
      font:600 15px system-ui;box-shadow:0 8px 24px rgba(0,0,0,.25)">
      Dejá de perder clientes por WhatsApp
    </div>
  `, { duration: 2800 });

  await page.evaluate(() => window.scrollBy({ top: 280, behavior: 'smooth' }));
  await pause(1600);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await pause(900);

  // Shot 2–3 — Demo pública
  await page.screencast.showChapter('Tu página pública', {
    description: 'El cliente ve servicios, precios y reserva solo',
    duration: 2000,
  });

  await page.goto('https://reservaya.ar/demo-barberia', { waitUntil: 'networkidle' });
  await pause(1400);

  await page.screencast.showOverlay(`
    <div style="position:absolute;top:16px;right:16px;padding:10px 16px;
      background:rgba(91,63,42,.9);color:#fff;border-radius:12px;
      font:600 14px system-ui">
      Tu cliente reserva solo
    </div>
  `, { duration: 2500 });

  await page.evaluate(() => {
    const el = document.querySelector('#servicios, [id*="servicio"], section');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    else window.scrollBy({ top: 520, behavior: 'smooth' });
  });
  await pause(2200);

  // Shot 4 — Reservar
  await page.screencast.showChapter('Reserva en segundos', {
    description: 'Servicio → fecha → horario → datos',
    duration: 1800,
  });

  // Prefer a weekday with slots
  await page.goto(
    'https://reservaya.ar/demo-barberia/reservar?service=22222222-2222-2222-2222-222222222221&date=2026-07-20',
    { waitUntil: 'networkidle' }
  );
  await pause(1200);

  // Pick a later morning slot to avoid collisions with previous QA booking
  const slot = page.getByRole('radio', { name: /Horario 10:00/i });
  await slot.scrollIntoViewIfNeeded();
  await pause(400);
  // Click the visible label text if radio is covered
  const label = page.getByText('10:00', { exact: true }).first();
  await label.click({ force: true });
  await pause(700);

  const name = page.getByRole('textbox', { name: /Nombre completo/i });
  await name.scrollIntoViewIfNeeded();
  await name.click();
  await name.pressSequentially('Demo ReservaYa', { delay: 45 });
  await pause(300);

  const email = page.getByRole('textbox', { name: /Correo electrónico/i });
  await email.click();
  await email.pressSequentially('demo@reservaya.ar', { delay: 35 });
  await pause(600);

  const confirm = page.getByRole('button', { name: /Confirmar reserva/i });
  await confirm.scrollIntoViewIfNeeded();
  await pause(400);
  await confirm.click();
  await pause(700);

  const yes = page.getByRole('button', { name: /Sí, confirmar turno/i });
  await yes.click();
  await page.waitForURL(/confirmacion/, { timeout: 30000 });
  await pause(1500);

  // Shot 5 — Confirmación
  await page.screencast.showOverlay(`
    <div style="position:absolute;top:20px;left:50%;transform:translateX(-50%);
      padding:12px 20px;background:rgba(22,101,52,.92);color:#fff;
      border-radius:999px;font:700 16px system-ui;box-shadow:0 10px 30px rgba(0,0,0,.28)">
      Turno confirmado ✓
    </div>
  `, { duration: 2800 });
  await pause(2200);

  // Shot 7 — Cierre (sin admin: requiere login)
  await page.screencast.showChapter('reservaya.ar', {
    description: '15 días gratis · Menos mensajes. Más turnos confirmados.',
    duration: 3200,
  });

  await page.goto('https://reservaya.ar/', { waitUntil: 'domcontentloaded' });
  await pause(800);
  await page.screencast.showOverlay(`
    <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
      background:rgba(26,28,46,.55)">
      <div style="background:#fff;border-radius:20px;padding:28px 36px;text-align:center;
        box-shadow:0 20px 60px rgba(0,0,0,.35);max-width:420px">
        <div style="font:800 28px Georgia,serif;color:#1a1c2e;margin-bottom:8px">ReservaYa</div>
        <div style="font:500 15px system-ui;color:#444;margin-bottom:14px">
          Probá 15 días gratis
        </div>
        <div style="font:700 18px system-ui;color:#6b4cff">reservaya.ar</div>
      </div>
    </div>
  `, { duration: 2800 });
  await pause(2600);

  await page.screencast.stop();
  return outPath;
}
