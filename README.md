# ReservaYa

Sistema de turnos online para barberias, peluquerias y centros de estetica chicos.

El objetivo no es construir un SaaS gigante primero. El objetivo es cerrar el primer cliente pago rapido con una demo estable, clara y facil de mostrar.

## Stack

- Next.js 16
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- PocketBase
- Resend
- Vercel

## Estado actual

- Base del proyecto creada con App Router
- shadcn/ui inicializado
- Landing comercial inicial lista
- Rutas publicas y admin del MVP ya creadas
- Helpers base para dominio y validacion agregados
- Modo local funcional con persistencia en archivo JSON
- Reserva publica y panel admin conectados a PocketBase cuando se configura el backend
- Base local para levantar PocketBase con Docker
- Script de bootstrap para crear colecciones y seed demo en PocketBase
- Editor real de pagina publica ya operativo
- Admin todavia incompleto en servicios, disponibilidad y acciones sobre turnos

## Puesta en marcha

1. Instalar dependencias:

```bash
npm install
```

2. Crear variables de entorno:

```bash
cp .env.example .env.local
```

Claves necesarias:

- `NEXT_PUBLIC_POCKETBASE_URL`
- `POCKETBASE_ADMIN_EMAIL`
- `POCKETBASE_ADMIN_PASSWORD`

Opcionales recomendadas:

- `POCKETBASE_DEMO_OWNER_EMAIL`
- `POCKETBASE_DEMO_OWNER_PASSWORD`
- `POCKETBASE_DEMO_OWNER_BUSINESS_SLUG`
- `BOOKING_LINK_SECRET`
- `BOOKING_JOBS_SECRET`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

Si no completas las variables de PocketBase, la app corre en modo demo/local automaticamente.

3. Levantar el proyecto:

```bash
npm run dev
```

4. Abrir `http://localhost:3000`

## PocketBase local con Docker

Si queres correr el proyecto sobre PocketBase local:

1. Levantar PocketBase:

```bash
npm run pb:up
```

2. Crear un superuser en PocketBase desde `http://127.0.0.1:8090/_/`

3. Completar `.env.local` con `NEXT_PUBLIC_POCKETBASE_URL`, `POCKETBASE_ADMIN_EMAIL` y `POCKETBASE_ADMIN_PASSWORD`

4. Bootstrapear colecciones y seed demo:

```bash
npm run pb:bootstrap
```

5. Ver logs si hace falta:

```bash
npm run pb:logs
```

6. Apagar el contenedor:

```bash
npm run pb:down
```

Notas:

- La base usa la release oficial `v0.36.6` de PocketBase dentro de Docker.
- Los datos quedan persistidos en `pocketbase/pb_data`.
- Las carpetas `pocketbase/pb_migrations`, `pocketbase/pb_hooks` y `pocketbase/pb_public` ya quedaron preparadas.
- La app ya consume PocketBase para auth admin, reservas, analytics y recordatorios cuando el backend esta configurado.

## Modo local

Sin PocketBase configurado, `ReservaYa` funciona con un store local en archivo:

- seed base: `data/local-store.seed.json`
- runtime local: `data/local-store.json`

Cada reserva nueva impacta en:

- `/demo-barberia/reservar`
- `/demo-barberia/confirmacion`
- `/demo-estetica/reservar`
- `/demo-estetica/confirmacion`
- `/admin/dashboard`

Para resetear la demo antes de mostrarla:

```bash
npm run demo:reset
```

## Rutas base

- `/` landing comercial de ReservaYa
- `/demo-barberia` demo publica del negocio
- `/demo-estetica` demo publica del negocio
- `/demo-barberia/reservar` flujo visual de reserva
- `/demo-estetica/reservar` flujo visual de reserva
- `/demo-barberia/confirmacion` confirmacion visual
- `/demo-estetica/confirmacion` confirmacion visual
- `/admin/login` acceso admin
- `/admin/dashboard` panel base

## Prioridad inmediata

1. Cerrar CRUD de servicios
2. Cerrar gestion de disponibilidad y bloqueos
3. Cerrar acciones operativas de turnos
4. Activar email y jobs con secretos productivos
5. Cerrar observabilidad y backups

Ver tambien:

- [PROJECT_STATE.md](c:\Users\John\Desktop\Nueva carpeta\ReservaYa\PROJECT_STATE.md)
- [NEXT.md](c:\Users\John\Desktop\Nueva carpeta\ReservaYa\NEXT.md)
