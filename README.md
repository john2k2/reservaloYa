# ReservaYa

Sistema de turnos online para barberias, peluquerias y centros de estetica chicos.

El objetivo no es construir un SaaS gigante primero. El objetivo es cerrar el primer cliente pago rapido con una demo estable, clara y facil de mostrar.

## Stack

- Next.js 16
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- Supabase
- PocketBase (opcion local/self-hosted)
- Resend
- Vercel

## Estado actual

- Base del proyecto creada con App Router
- shadcn/ui inicializado
- Landing comercial inicial lista
- Rutas publicas y admin del MVP ya creadas
- Helpers base para dominio y validacion agregados
- Modo local funcional con persistencia en archivo JSON
- Reserva publica local ya impacta en el dashboard
- Integracion con Supabase preparada para activarse cuando haya proyecto
- Base local para levantar PocketBase con Docker

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

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` o `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` para procesos server-only futuros

Si no completas estas variables, la app corre en modo local automaticamente.

3. Levantar el proyecto:

```bash
npm run dev
```

4. Abrir `http://localhost:3000`

## PocketBase local con Docker

Si queres dejar de depender del store JSON y probar un backend local autocontenido:

1. Levantar PocketBase:

```bash
npm run pb:up
```

2. Abrir el admin en `http://127.0.0.1:8090/_/`

3. Ver logs si hace falta:

```bash
npm run pb:logs
```

4. Apagar el contenedor:

```bash
npm run pb:down
```

Notas:

- La base usa la release oficial `v0.36.6` de PocketBase dentro de Docker.
- Los datos quedan persistidos en `pocketbase/pb_data`.
- Las carpetas `pocketbase/pb_migrations`, `pocketbase/pb_hooks` y `pocketbase/pb_public` ya quedaron preparadas.
- La app todavia no consume PocketBase; esto deja lista la infraestructura local para la siguiente integracion.

## Modo local

Sin Supabase configurado, `ReservaYa` funciona con un store local en archivo:

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

1. Vender y probar la demo local con negocios reales
2. Crear proyecto Supabase cuando el servicio quede validado o necesitemos deploy serio
3. Aplicar migracion y seed ya preparadas
4. Activar auth admin real
5. Enviar email de confirmacion con Resend

Ver tambien:

- [PROJECT_STATE.md](c:\Users\John\Desktop\Nueva carpeta\ReservaYa\PROJECT_STATE.md)
- [NEXT.md](c:\Users\John\Desktop\Nueva carpeta\ReservaYa\NEXT.md)
