# Supabase Auth email templates

Estos HTML son para los correos transaccionales que envía Supabase Auth, separados de los correos de negocio que ya salen por Resend.

## Templates incluidos

| Tipo Supabase | Archivo | Uso |
| --- | --- | --- |
| `confirmation` | `confirmation.html` | Confirmar alta/verificación de cuenta |
| `recovery` | `recovery.html` | Recuperación de contraseña |
| `magic_link` | `magic_link.html` | Magic link / impersonación segura |
| `invite` | `invite.html` | Invitación a usuarios |
| `email_change` | `email_change.html` | Confirmación de cambio de email |

## Variables Supabase usadas

- `{{ .ConfirmationURL }}`: link seguro generado por Supabase.
- `{{ .NewEmail }}`: nuevo email en el template de cambio de correo.

## Producción hosted Supabase

En proyectos hosted, cargar el contenido desde Dashboard → Authentication → Email Templates o vía Management API. `supabase/config.toml` deja los paths listos para desarrollo local, pero no reemplaza automáticamente la configuración del proyecto hosted.
