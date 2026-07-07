# Sistema de diseño - ReservaYa

## Alcance

Este documento rige **las páginas propias de ReservaYa** (el producto, no los negocios que lo usan):
marketing (`/`, `/precios`, `/funcionalidades`, `/como-funciona`, `/preguntas-frecuentes`), páginas
institucionales (`/sobre-reservaya`, `/contacto`, `/terminos`, `/privacidad`), las páginas SEO por
rubro (`src/app/(seo)/*`), y el panel de auth/admin/platform (`/login`, `/admin/*`, `/platform/*`).

**No rige** `src/app/(public)/[slug]/*` — la página pública de cada negocio. Esas páginas usan su
propio sistema de theming (`PublicBusinessThemeProvider`, campo `PublicBusinessProfile.accent`),
customizable por cada dueño de negocio. Nunca apliques `.landing-theme` ni los tokens de este
documento ahí: son sistemas deliberadamente distintos.

## Por qué existe esto

Antes de esta pasada, la landing no tenía ningún documento vivo de reglas — `UI_IMPROVEMENTS.md` es
un changelog de una pasada anterior (referenciaba una skill externa, "Huashu Design", que no está
instalada en este entorno), no una regla que se vuelva a aplicar sola. El resultado: paleta teal
"de fábrica" de shadcn sin ninguna decisión detrás, tres secciones seguidas con el mismo grid de
cards genérico, tres CTA distintos repitiendo el mismo mensaje, y bugs de responsive (texto de botón
partido a la mitad) que nadie había codificado como regla a chequear. Este documento existe para que
la próxima persona (o IA) que toque estas páginas parta de una decisión ya tomada, no de los
defaults de shadcn.

## Paleta

Tokens definidos en `src/app/globals.css`, activos solo dentro de `.landing-theme` (aplicada por
`LandingPageShell` — ver "Qué falta cubrir" más abajo para saber qué páginas todavía no la usan).

| Token | Light | Dark | Uso |
|---|---|---|---|
| `ink` | `#131b2e` | `#f5f3ed` | texto, headlines, botón primario |
| `paper` | `#fafaf7` | `#14171f` | fondo — blanco papel neutro, nunca crema |
| `rule` | `#d8d2c2` | `#2b2e38` | líneas finas tipo renglón de agenda — reemplazan bordes de card pesados |
| `sello` | `#4b3a8f` | `#a394e8` | acento de firma: badges, el sello de goma, focus rings, highlights puntuales |
| `ticket` | `#e2a33b` | `#f0c57a` | ámbar de talón de ticket — solo para tags chicos e indicadores "en vivo" |

`sello` reemplaza a `--primary` dentro de `.landing-theme` (ver el bloque `.landing-theme` en
`globals.css`). No introduzcas un color de acento nuevo sin agregarlo acá primero.

## Tipografía

- **Display** (`--font-display`, Fraunces): headlines y títulos de sección. Uso restringido — nunca
  para párrafos ni UI copy.
- **Body** (`--font-sans`, Inter): todo el texto de lectura.
- **Mono** (`--font-mono`, JetBrains Mono): deliberado para horas, precios y números de turno
  ("09:00", "$33.330", "Turno #001", "DEMO #01"). No es una utility caption genérica — si el dato es
  un número que el usuario puede necesitar copiar o comparar, va en mono.

## El motivo de firma: agenda / ticket / sello

El sitio no tiene gradientes ni ilustraciones de stock. Tiene un motivo propio, anclado en el
vocabulario real del rubro (turnos, agendas, sellos de goma):

- **`TicketStub`** (`src/components/landing/ticket-stub.tsx`): el talón de turno perforado. Aparece
  en el Hero.
- **`SelloStamp`** (`src/components/landing/sello-stamp.tsx`): el sello violeta rotado. Aparece en
  el `TicketStub` y en `PricingSection`.
- **`stampHit`** (keyframe en `landing-animations.css`): la animación de "sello estampándose contra
  el papel" — usada en los contadores de `TimeCalculatorSection`, el único momento animado con
  personalidad propia de la página.

**Regla de contención**: este motivo aparece en Hero, Pricing y el time-calculator — y en ningún
lado más. Si un componente nuevo "necesita" un ticket o un sello, primero preguntate si de verdad es
un momento de decisión importante (precio, confirmación, el gancho numérico). Si no, no lo uses —
la regla de oro es gastar la audacia visual en un solo lugar por página, no repartirla.

## Estructura y layout

- **Rule-dividers, no card-chrome repetido**: separá secciones con `border-t border-rule`, no con
  cards individuales de `border + shadow + rounded-xl` apiladas una tras otra. Si tres secciones
  seguidas usan el mismo card con sombra, el ojo deja de distinguirlas — pasó en la primera versión
  de `DemoSelector` y se corrigió aplanando todo menos el motivo de firma.
- **No dupliques CTAs**: cada CTA en la página debe tener un trabajo distinto. Si dos bloques dicen
  esencialmente "empezá gratis" a menos de dos scrolls de distancia, sacá uno. (Se borró
  `CTASection` completo por esto — quedaba redundante entre el botón propio de `PricingSection` y el
  CTA final del `Footer`.)
- **No expliques en abstracto lo que ya se ve en concreto**: si tenés 4 cards de demos reales
  (`DemoSelector`), no agregues además 3 cards de "esto es lo que vas a ver" describiendo lo mismo
  con íconos genéricos. Elegí una sola forma de comunicarlo.
- **Código muerto**: si un componente de `src/components/landing/` no está importado en ningún
  `src/app/**/page.tsx`, o lo conectás o lo borrás. No lo dejes "por si acaso" — así se acumularon
  `TimeCalculatorSection`, `TargetAudienceSection` y `MetricsBar` sin usar antes de esta pasada.

## Responsive

- **Filas de dos botones (CTA pares)**: nunca dejes que el texto de un botón haga wrap a mitad de
  palabra. Patrón obligatorio:
  ```
  contenedor: flex flex-col flex-wrap items-center justify-center gap-4 w-full sm:w-auto sm:flex-row
  cada botón:  whitespace-nowrap (+ el ícono con shrink-0)
  ```
  Con esto, si no entran los dos botones en una fila, el segundo baja completo a la línea
  siguiente — nunca se parte el texto de uno solo. Verificalo en el rango 640-820px (tablet chico /
  celular horizontal), que es donde se rompe en la práctica, no solo en 375px y 1440px.
- Probá siempre en al menos tres anchos: ~375px (mobile), ~700-820px (el rango que rompe en la
  práctica), y desktop (≥1280px). Los primeros dos son los que un chequeo superficial en desktop se
  salta.

## Motion

- `AnimatedSection` (`animation-section.tsx`) ya respeta `prefers-reduced-motion` — no dupliques esa
  lógica, reusala.
- Cualquier keyframe nuevo en `landing-animations.css` debe caer bajo el bloque
  `@media (prefers-reduced-motion: reduce)` existente al final del archivo (ya reduce todas las
  animaciones a 0.01ms — no hace falta un guard por-componente además de eso, salvo en JS puro como
  `AnimatedCounter`, que sí necesita su propio chequeo porque no anima vía CSS).

## Qué ya sigue el sistema y qué falta (deuda conocida)

Con `.landing-theme` aplicado (vía `LandingPageShell` en marketing, o directo en el `<main>`/root de
cada página en el resto):

- ✅ `/` (home), `/precios`, `/funcionalidades`, `/como-funciona`, `/preguntas-frecuentes`
- ✅ `/sobre-reservaya`, `/contacto`, `/terminos`, `/privacidad`
- ✅ `src/app/(seo)/*` (las 3 landing pages por rubro — además usan `LandingHeader` compartido en vez
  de un header bespoke duplicado, y se les sacó un CTA redundante pegado al del `Footer`)
- ✅ `/login`, `/admin/signup`, `/admin/forgot-password`, `/admin/reset-password`,
  `/admin/subscription` (expirada/pay/success), `admin/(panel)/error.tsx` — pantallas de
  auth/decisión, con headline en Fraunces donde corresponde
- ✅ `AdminShell` y `PlatformShell` (`src/components/layout/`) — al tener `.landing-theme` en su
  root, cascada automáticamente a las 18 páginas de `admin/(panel)/*` y las 4 de
  `platform/(panel)/*` sin tocar cada `page.tsx` individualmente, porque ya usaban tokens semánticos
  (`bg-background`, `text-foreground`, `border-border`, etc.) en vez de hex hardcodeado.

⬜ Pendiente real: **QA visual en browser de `/login`, `/admin/*` y `/platform/*` no se pudo hacer**
en este entorno — el dev server no tiene `.env.local` con credenciales de Supabase (`.env.test` sí
las tiene, por eso los tests unitarios corren bien). Los cambios de esta sección se verificaron por
lectura de código + `tsc`/`eslint`/tests, no con captura de pantalla. Antes de dar por cerrada la
migración de admin/platform, alguien con `.env.local` configurado debería revisar visualmente al
menos: login, dashboard (admin y platform), bookings, y una pantalla de onboarding.

### Regla nueva: colores semánticos y de marca de terceros quedan fuera del sistema de tokens

En admin/platform aparecen colores hex fuera de la tabla de arriba que **no son un error, son
intencionales** — no los reemplaces por `ink`/`paper`/`rule`/`sello`/`ticket`:

- **Estados semánticos** (verde/emerald = confirmado, ámbar = pendiente/advertencia, rojo = error o
  cancelado, azul = informativo): son el vocabulario estándar de un dashboard de reservas y
  cambiarlos a la paleta decorativa de marca haría perder la distinción entre estados de un vistazo.
  Viven sobre todo en `admin/(panel)/bookings`, `admin/(panel)/dashboard`, banners de alerta.
- **Colores de marca de terceros** (`#00B1EA`/`#009EE3` MercadoPago, `#25D366` WhatsApp): identifican
  botones/badges de un servicio externo — tienen que verse reconocibles con la marca de ese
  servicio, no con la nuestra. Viven en `edit-integrations-tab.tsx` y
  `subscription-pay-button.tsx`.
- **El color accent elegible por el dueño del negocio** (`palette-selector.tsx`, campo
  `PublicBusinessProfile.accent`): es parte del sistema de theming de `(public)/[slug]`, fuera del
  alcance de este documento por definición (ver "Alcance" arriba), aunque el selector viva
  físicamente dentro de `admin/(panel)/onboarding`.

### Regla nueva: Fraunces (font-display) en admin/platform, con criterio

A diferencia de marketing (donde Fraunces va en todos los headlines), en admin/platform reservalo
para pantallas que son un momento de bienvenida/decisión sobre fondo vacío — login, signup,
forgot/reset password, error boundary, subscription expirada/pago/éxito. **No lo uses en headers de
dashboard, bookings, customers, services, settings ni team**: son pantallas densas en datos donde un
serif editorial en el título reduce la escaneabilidad y desentona con tablas/números de abajo. Si
dudás si una pantalla es "momento" o "dato", dejala en `font-sans` (Inter) — ese es el default
correcto en admin.

## Checklist antes de mergear una página o componente nuevo acá

1. ¿Usa los tokens de esta tabla, o inventó un color nuevo? (los estados semánticos de
   admin/platform y los colores de marca de terceros están exentos — ver la sección de arriba)
2. ¿El motivo ticket/sello aparece en más de un lugar "porque queda lindo", sin ser un momento real
   de decisión? (y en admin/platform: directamente no debería aparecer)
3. ¿Hay dos CTAs a menos de dos scrolls diciendo lo mismo?
4. ¿Hay una fila de dos botones sin `whitespace-nowrap` + `flex-wrap`? Probaste 700-820px?
5. ¿Agregaste un componente en `src/components/landing/` que nadie importa todavía?
6. En admin/platform: ¿le pusiste Fraunces a un título de pantalla densa en datos? Si dudás, Inter.
