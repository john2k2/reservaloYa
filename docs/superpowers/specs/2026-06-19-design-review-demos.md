# Revisión de diseño — Páginas demos de ReservaYa

**Fecha:** 2026-06-19  
**Alcance:** landing principal, página pública de negocio demo, flujo de reserva (desktop + mobile) y panel de administración.  
**Herramientas:** Chrome DevTools + Lighthouse + Visual Companion (`http://localhost:61335`).  
**Capturas:** `.superpowers/brainstorm/270917-1781885522/state/`

---

## Resumen ejecutivo

El producto tiene una base sólida: buena accesibilidad, SEO perfecto y un flujo de reserva claro. Los problemas más importantes hoy son **bugs de copy/espaciado**, **fricción en el selector de horarios** y **la experiencia del panel admin de turnos**, que expone demasiados controles edición por turno.

| Aspecto | Estado | Nota |
|---------|--------|------|
| Estética visual | ✅ Buena | Consistente, limpia, branding claro |
| UX / conversión | ⚠️ Regular | Bugs de copy y selector de horarios generan fricción |
| Responsive | ⚠️ Regular | Funciona, pero el step 2 de reserva requiere mucho scroll |
| Accesibilidad | ✅ Buena | 96-98 en Lighthouse |
| Performance | ⚠️ Regular | Iframes de mapa pueden afectar LCP |

---

## Hallazgos por página

### 1. Landing principal (`/`)

**URL revisada:** https://reservaya.ar/  
**Lighthouse:** Accessibility 98 | Best Practices 92 | SEO 100

#### Problemas

1. **Copy roto en el H1:** "Dejá de perder clientes**por** WhatsApp" — falta el espacio entre "clientes" y "por".
2. **Sección de demos confusa:** "Barbería demo" se describe como "alias histórico de la demo de barbería, mantenido para enlaces compartidos". Esa información interna no debería mostrarse al visitante.
3. **Precio poco claro:** "$32.560 ARS/mes al blue" puede no entenderse para usuarios fuera de Argentina.
4. **CTA secundario poco visible:** "Ver ejemplo en vivo" es clave para conversión, pero queda abajo en el flujo.

#### Recomendaciones

- Corregir el espacio en el H1.
- Ocultar el demo "alias histórico" de la landing o renombrarlo.
- Agregar aclaración del precio: "~USD XX al tipo de cambio blue" o mostrar monto en USD.
- Repetir el CTA "Ver ejemplo en vivo" cerca del hero.

---

### 2. Página pública del negocio (`/demo-barberia`)

**URL revisada:** https://reservaya.ar/demo-barberia  
**Lighthouse:** Accessibility 96 | Best Practices 92 | SEO 100

#### Problemas

1. **Testimonio inconsistente:** Matías Gómez aparece como "Barbero independiente". Suena a que el dueño se recomienda a sí mismo.
2. **Footer con texto truncado:** "Sin mensajes de WhatsApp cruzados..." aparece cortado con "...". Verificar si es intencional o bug.
3. **Horarios desordenados:** muestra solo Lunes, Miércoles, Viernes. Los días cerrados no están indicados.
4. **Mapa con iframe vacío:** en el snapshot aparece `about:blank`. Verificar lazy load.

#### Recomendaciones

- Cambiar el rol de Matías Gómez a "Cliente frecuente" o usar otro testimonio.
- Revisar el clamp/ellipsis del footer.
- Mostrar todos los días de la semana con "Cerrado" donde corresponda.
- Verificar que el iframe del mapa cargue correctamente.

---

### 3. Flujo de reserva (`/demo-barberia/reservar`)

**URL revisada:** https://reservaya.ar/demo-barberia/reservar

#### Step 1 — Elegir servicio

- ✅ Clara, buena jerarquía de precio/duración.
- ⚠️ El sidebar con políticas y WhatsApp ocupa mucho espacio en mobile.

#### Step 2 — Fecha, hora y datos

##### Problemas desktop

1. **Labels pegados:** "WhatsApp**opcional**" y "Notas adicionales**opcional**" no tienen espacio entre la palabra y el badge.
2. **33 horarios visibles:** mostrar todos los slots de 15 min es abrumador.
3. **Formulario de datos aparece debajo de horarios:** en desktop el CTA queda lejos del calendario.
4. **Radio buttons `invalid="true"`:** los horarios disponibles se marcan como inválidos en el árbol de accesibilidad.

##### Problemas mobile

1. **Scroll excesivo:** calendario → horarios → formulario → resumen requiere mucho scroll.
2. **Resumen al final:** el usuario no ve precio/políticas hasta el final.
3. **CTA confirmar inaccesible:** aparece solo después de completar todo.

#### Recomendaciones

- Agregar espacio entre label y badge "opcional".
- Agrupar horarios en franjas (Mañana/Tarde/Noche) y mostrar solo las franjas expandidas, o usar un dropdown/select.
- En mobile, considerar un stepper condicional: 1) fecha, 2) hora, 3) datos, 4) resumen.
- Corregir el atributo `invalid` de los radio buttons.
- Mantener un resumen flotante o sticky en mobile con precio y CTA.

---

### 4. Panel de administración (`/admin/*`)

**URL revisada:** https://reservaya.ar/admin/dashboard, /bookings, /services, /availability, /customers, /team, /onboarding, /billing

#### Dashboard

- ✅ Limpio, métricas claras.
- ⚠️ "Origen de clientes" está vacío sin explicación de cómo se llena.

#### Turnos (`/admin/bookings`)

1. **Cada turno es un formulario completo:** ocupa mucho espacio visual.
2. **Selectores nativos feos:** spinbuttons de día/mes/año y AM/PM.
3. **Botón Guardar por turno:** no queda claro si los cambios son auto-guardados.
4. **Falta vista de calendario/agenda:** una lista de formularios no escala.

#### Horarios (`/admin/availability`)

1. **Selector AM/PM:** no es el formato habitual en Argentina.
2. **Días cerrados muestran campos deshabilitados:** ocupan mucho espacio.
3. **Falta "copiar horario":** para negocios con horarios similares.

#### Suscripción (`/admin/billing`)

1. **Mensaje contradictorio:** dice "Período de prueba" y "No encontramos información de suscripción" al mismo tiempo.
2. **CTA de cancelar prominente:** en un negocio suspendido puede confundir.

#### Clientes (`/admin/customers`)

- ✅ Información útil y enlaces a turnos.
- ⚠️ Podría presentarse en tabla para escanear más rápido.

#### Equipo (`/admin/team`)

- ✅ Simple y claro.
- ⚠️ El campo "Contraseña temporal" se muestra como textbox (revisar type=password).

#### Mi negocio (`/admin/onboarding`)

- ✅ Buena organización por tabs.
- ⚠️ "Guardar todo" no indica qué tabs tienen cambios pendientes.

---

## Cambios aplicados

- ✅ H1 landing: reemplazado el espacio JSX por `&nbsp;` para evitar que se pegue "clientespor" en el build.
- ✅ Labels "opcional": agregado espacio explícito entre label y badge en WhatsApp y Notas adicionales.
- ✅ Footer de página pública: removido el corte forzado a 100 caracteres; ahora usa `line-clamp-2` sobre la descripción completa.
- ✅ Demo "Barbería demo": oculto de la sección de demos en la landing (el slug sigue funcionando para enlaces compartidos).
- ✅ Testimonio de Matías Gómez: cambiado de "Barbero independiente" a "Cliente frecuente".
- ✅ Selector de horarios: agregado "Mostrar más/menos" por franja (máximo 6 visibles por defecto) y removido `required` de los radio buttons para evitar `invalid="true"` en accesibilidad.
- ✅ Panel admin de turnos: diseño más compacto con inputs más chicos y menos padding.
- ✅ Panel de suscripción: mensaje más claro cuando no hay registro de suscripción en período de prueba.

## Pendientes

1. **Resumen sticky/flotante en mobile** durante la reserva.
2. **Vista de calendario semanal** en el panel admin de turnos (mejora mayor, fuera del scope de esta pasada).
3. **Formato 24h en admin**: los inputs ya son `type="time"` nativos; el formato depende del locale del navegador del usuario.

---

## Métricas de Lighthouse

| Página | Accessibility | Best Practices | SEO |
|--------|---------------|----------------|-----|
| Landing | 98 | 92 | 100 |
| Demo negocio | 96 | 92 | 100 |

**Notas:** los scores son buenos. Los principales issues son de usabilidad y copy, no de accesibilidad técnica.

---

## Archivos de referencia

- Visual Companion: http://localhost:61335 (screenshots anotados)
- Capturas: `.superpowers/brainstorm/270917-1781885522/state/`
- Este documento: `docs/superpowers/specs/2026-06-19-design-review-demos.md`
