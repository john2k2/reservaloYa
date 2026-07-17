# Onboarding piloto en 15 minutos

Checklist operativo para dejar a **un negocio piloto** reservando turnos reales hoy. Pensado para barberías y peluquerías que hoy manejan todo por WhatsApp.

**Tiempo total:** ~15 min (con datos del negocio a mano).  
**Quién ejecuta:** operador ReservaYa / John Labs (vos) acompañando al dueño por videollamada o presencial.

---

## Antes de empezar (dueño del negocio)

Pedile que tenga listo:

- [ ] Nombre del negocio y dirección
- [ ] Teléfono de contacto (WhatsApp del local)
- [ ] Email donde quieren recibir avisos de turnos
- [ ] Lista mínima de 3–5 servicios con precio y duración aproximada
- [ ] Horario de apertura por día (ej. lun–vie 10–19, sáb 10–14)
- [ ] Slug deseado para el link público (ej. `barberia-juan` → `reservaya.ar/barberia-juan`)

---

## Minuto 0–3 · Alta de cuenta y seed

| Paso | Acción | URL / ruta |
|------|--------|------------|
| 1 | Abrir signup | https://reservaya.ar/admin/signup |
| 2 | Completar: nombre del dueño, email, contraseña | — |
| 3 | Elegir plantilla **Barbería clásica** (`demo-barberia`) | Siembra servicios + horarios automáticamente |
| 4 | Completar datos del negocio: nombre, teléfono, dirección, slug | — |
| 5 | Confirmar email si Supabase lo pide | Revisar bandeja de entrada |

**Listo cuando:** redirige a `/admin/dashboard` o `/admin/onboarding` con el negocio creado.

### Verificación rápida

- [ ] `/admin/services` muestra servicios precargados
- [ ] `/admin/availability` muestra reglas de horario

---

## Minuto 3–8 · Branding light (sin obsesionarse)

Objetivo: que el link público se vea *del negocio*, no genérico. No hace falta foto profesional el día 1.

| Paso | Acción | Ruta |
|------|--------|------|
| 1 | Entrar al onboarding o edición de página | `/admin/onboarding` |
| 2 | Ajustar **nombre**, **headline** y **descripción** corta | Ej: "Barbería en Palermo · Reservá online" |
| 3 | Elegir **paleta de colores** acorde al local | 1 click — evitar custom hex el día 1 |
| 4 | (Opcional) Subir logo si lo tienen en el celular | PNG/JPG, < 2 MB |
| 5 | Revisar preview en vivo | Panel lateral del onboarding |
| 6 | **Activar** la página pública | Botón "Activar" / `activateLocalBusinessAction` |

**Listo cuando:** `https://reservaya.ar/{slug}` carga sin banner de "negocio inactivo".

### Ajustes mínimos de catálogo

- [ ] Editar precios reales en `/admin/services` (2 min)
- [ ] Confirmar horarios en `/admin/availability` coinciden con la realidad

---

## Minuto 8–11 · Turno de prueba end-to-end

| Paso | Acción |
|------|--------|
| 1 | Abrir `https://reservaya.ar/{slug}/reservar` en incógnito |
| 2 | Reservar un turno con el email del dueño |
| 3 | Confirmar que llega email de confirmación (cliente + negocio) |
| 4 | Mostrar el turno en `/admin/bookings` |

**Listo cuando:** el dueño ve el turno en el panel y recibió el mail.

### Si falla el email

- Revisar carpeta spam
- Confirmar `notificationEmail` del negocio en configuración
- No bloquear el piloto — el turno igual queda en el panel

---

## Minuto 11–13 · Compartir link público

Armá el mensaje para que el dueño lo pegue en Instagram bio / WhatsApp status:

```
Reservá tu turno online 👇
https://reservaya.ar/{slug}
```

| Canal | Acción |
|-------|--------|
| WhatsApp Business | Link en descripción + mensaje fijado |
| Instagram | Link en bio + story con sticker de link |
| Google Maps / cartel | QR apuntando al link (generar con cualquier QR free) |

**Listo cuando:** el dueño tiene el link copiado y sabe dónde publicarlo.

---

## Minuto 13–15 · Suscripción (trial + cómo pagan después)

### Durante el piloto

- [ ] Explicar: **15 días gratis**, sin tarjeta, sin permanencia
- [ ] Mostrar fecha de fin de trial en `/admin/billing`

### Cuando quieran pagar (o al día 14)

| Método | Flujo |
|--------|-------|
| **Transferencia ARS** | Dueño va a `/admin/subscription/pay` → ve alias/CBU y monto en pesos (referencia dólar blue) → transfiere → vos marcás pagado en panel platform |
| **Tarjeta USD (Polar)** | Dueño va a `/admin/subscription/pay` → "Pagar con tarjeta" → checkout Polar → activación automática vía webhook |

**Precio:** USD 22/mes (equivalente ARS visible en pantalla para transferencia).

### Script para el dueño

> "Tenés 15 días para probarlo con clientes reales. Si te sirve, abonás USD 22 por mes — por transferencia en pesos o tarjeta en dólares. Cancelás cuando quieras."

**Listo cuando:** el dueño sabe dónde pagar (`/admin/subscription/pay`) y a quién avisar después de transferir (WhatsApp comercial ReservaYa).

---

## Cierre · Definition of done del piloto

El piloto está **cerrado** cuando el negocio puede:

- [ ] Recibir una reserva real de un cliente externo (no solo la de prueba)
- [ ] Ver el turno en `/admin/bookings`
- [ ] Recibir email de confirmación automático
- [ ] Compartir su link público en al menos un canal
- [ ] Saber cómo pagar la suscripción post-trial

---

## Troubleshooting express

| Problema | Solución |
|----------|----------|
| Slug ocupado | Probar variante (`barberia-juan-palermo`) |
| Sin horarios disponibles al reservar | Revisar `/admin/availability` y bloqueos en `/admin/availability` (blocked slots) |
| Página pública no carga | Verificar negocio activado en onboarding |
| Trial vencido durante piloto | Platform → extender trial o marcar pagado si ya transfirieron |
| Polar no aparece en pay | Vars `POLAR_*` pendientes en prod — usar solo transferencia hasta activar (ver `docs/ops/POLAR_TRANSFER_ACTIVATION.md`) |

---

## Post-onboarding (fuera de los 15 min, semana 1)

- Conectar MercadoPago OAuth si cobran seña online (`/admin/settings` o integraciones)
- Subir fotos reales del local (galería en onboarding)
- Pedir feedback: ¿qué fricción tuvieron los clientes al reservar?
- **No pedir testimonio público** hasta que hayan usado el producto al menos 1–2 semanas con clientes reales

---

## Contacto operador

- WhatsApp comercial: desde footer de https://reservaya.ar
- Email: hola@reservaya.ar
- Panel platform (marcar pagado / extender trial): `/platform/dashboard`
