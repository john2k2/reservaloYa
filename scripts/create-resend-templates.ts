/**
 * Script para crear plantillas de email en Resend
 * Ejecutar: npx tsx scripts/create-resend-templates.ts
 */

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Plantilla HTML para confirmación de reserva al cliente
const customerConfirmationTemplate = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmación de Reserva</title>
  <style>
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; padding: 20px !important; }
      .header { padding: 30px 20px !important; }
      .content { padding: 30px 20px !important; }
      .details { padding: 20px !important; }
      .footer { padding: 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="container" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td class="header" style="background: linear-gradient(135deg, {{{BRAND_COLOR}}} 0%, {{{BRAND_COLOR_DARK}}} 100%); padding: 40px 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">{{{BUSINESS_NAME}}}</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">Confirmación de Reserva</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td class="content" style="padding: 40px;">
              <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Hola <strong style="color: #0f172a;">{{{CUSTOMER_NAME}}}</strong>,
              </p>
              <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Tu reserva ha sido confirmada. Aquí están los detalles:
              </p>
              
              <!-- Details Box -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="details" style="background-color: #f1f5f9; border-radius: 12px; padding: 24px; margin: 24px 0;">
                <tr>
                  <td style="padding-bottom: 16px;">
                    <p style="margin: 0; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Servicio</p>
                    <p style="margin: 4px 0 0 0; color: #0f172a; font-size: 18px; font-weight: 600;">{{{SERVICE_NAME}}}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 16px;">
                    <p style="margin: 0; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Fecha</p>
                    <p style="margin: 4px 0 0 0; color: #0f172a; font-size: 18px; font-weight: 600;">{{{DATE}}}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 16px;">
                    <p style="margin: 0; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Hora</p>
                    <p style="margin: 4px 0 0 0; color: #0f172a; font-size: 18px; font-weight: 600;">{{{TIME}}}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 16px;">
                    <p style="margin: 0; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Duración</p>
                    <p style="margin: 4px 0 0 0; color: #0f172a; font-size: 18px; font-weight: 600;">{{{DURATION}}}</p>
                  </td>
                </tr>
                {{#PRICE}}
                <tr>
                  <td>
                    <p style="margin: 0; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Precio</p>
                    <p style="margin: 4px 0 0 0; color: {{{BRAND_COLOR}}}; font-size: 18px; font-weight: 700;">{{{PRICE}}}</p>
                  </td>
                </tr>
                {{/PRICE}}
              </table>
              
              <!-- Location -->
              {{#ADDRESS}}
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0;">
                <tr>
                  <td style="border-top: 1px solid #e2e8f0; padding-top: 24px;">
                    <p style="margin: 0 0 8px 0; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Ubicación</p>
                    <p style="margin: 0; color: #334155; font-size: 15px; line-height: 1.5;">{{{ADDRESS}}}</p>
                  </td>
                </tr>
              </table>
              {{/ADDRESS}}
              
              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="{{{MANAGE_URL}}}" style="display: inline-block; background-color: {{{BRAND_COLOR}}}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;">Gestionar mi Reserva</a>
                  </td>
                </tr>
              </table>
              
              <!-- Notes -->
              <p style="color: #64748b; font-size: 14px; line-height: 1.5; margin: 24px 0 0 0; text-align: center;">
                Si necesitas cancelar o modificar tu reserva, haz clic en el botón de arriba o contacta directamente con {{{BUSINESS_NAME}}}.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td class="footer" style="background-color: #f8fafc; padding: 24px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #94a3b8; font-size: 13px;">
                Enviado por <strong style="color: #64748b;">ReservaYa</strong><br>
                Tu plataforma de reservas online
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

// Plantilla HTML para notificación al negocio
const businessNotificationTemplate = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nueva Reserva</title>
  <style>
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; padding: 20px !important; }
      .header { padding: 30px 20px !important; }
      .content { padding: 30px 20px !important; }
      .details { padding: 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="container" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td class="header" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">🎉 Nueva Reserva</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">{{{BUSINESS_NAME}}}</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td class="content" style="padding: 40px;">
              <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Tienes una nueva reserva confirmada.
              </p>
              
              <!-- Customer Info -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ecfdf5; border-left: 4px solid #10b981; border-radius: 8px; padding: 20px; margin: 24px 0;">
                <tr>
                  <td>
                    <p style="margin: 0; color: #059669; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Cliente</p>
                    <p style="margin: 4px 0 0 0; color: #064e3b; font-size: 20px; font-weight: 700;">{{{CUSTOMER_NAME}}}</p>
                    {{#CUSTOMER_EMAIL}}
                    <p style="margin: 8px 0 0 0; color: #065f46; font-size: 14px;">{{{CUSTOMER_EMAIL}}}</p>
                    {{/CUSTOMER_EMAIL}}
                    {{#CUSTOMER_PHONE}}
                    <p style="margin: 4px 0 0 0; color: #065f46; font-size: 14px;">{{{CUSTOMER_PHONE}}}</p>
                    {{/CUSTOMER_PHONE}}
                  </td>
                </tr>
              </table>
              
              <!-- Booking Details -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="details" style="background-color: #f1f5f9; border-radius: 12px; padding: 24px; margin: 24px 0;">
                <tr>
                  <td style="padding-bottom: 16px;">
                    <p style="margin: 0; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Servicio</p>
                    <p style="margin: 4px 0 0 0; color: #0f172a; font-size: 18px; font-weight: 600;">{{{SERVICE_NAME}}}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 16px;">
                    <p style="margin: 0; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Fecha</p>
                    <p style="margin: 4px 0 0 0; color: #0f172a; font-size: 18px; font-weight: 600;">{{{DATE}}}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 16px;">
                    <p style="margin: 0; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Hora</p>
                    <p style="margin: 4px 0 0 0; color: #0f172a; font-size: 18px; font-weight: 600;">{{{TIME}}}</p>
                  </td>
                </tr>
                <tr>
                  <td>
                    <p style="margin: 0; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Duración</p>
                    <p style="margin: 4px 0 0 0; color: #0f172a; font-size: 18px; font-weight: 600;">{{{DURATION}}}</p>
                  </td>
                </tr>
              </table>
              
              <!-- Action Buttons -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="{{{ADMIN_URL}}}" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;">Ver en Admin</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td class="footer" style="background-color: #f8fafc; padding: 24px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #94a3b8; font-size: 13px;">
                ReservaYa - Sistema de Reservas<br>
                <a href="{{{ADMIN_URL}}}" style="color: {{{BRAND_COLOR}}}; text-decoration: none;">Panel de Administración</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

async function createTemplates() {
  console.log('🚀 Creando plantillas en Resend...\n');

  // 1. Plantilla para cliente
  console.log('📧 Creando plantilla: customer-booking-confirmation...');
  const customerResult = await resend.templates.create({
    name: 'Confirmación de Reserva - Cliente',
    alias: 'customer-booking-confirmation',
    subject: '✅ Tu reserva en {{{BUSINESS_NAME}}} está confirmada',
    html: customerConfirmationTemplate,
    variables: [
      { key: 'BUSINESS_NAME', type: 'string' },
      { key: 'BRAND_COLOR', type: 'string', fallbackValue: '#3b82f6' },
      { key: 'BRAND_COLOR_DARK', type: 'string', fallbackValue: '#2563eb' },
      { key: 'CUSTOMER_NAME', type: 'string' },
      { key: 'SERVICE_NAME', type: 'string' },
      { key: 'DATE', type: 'string' },
      { key: 'TIME', type: 'string' },
      { key: 'DURATION', type: 'string' },
      { key: 'PRICE', type: 'string', fallbackValue: '' },
      { key: 'ADDRESS', type: 'string', fallbackValue: '' },
      { key: 'MANAGE_URL', type: 'string' },
    ],
  });

  if (customerResult.error) {
    console.error('❌ Error:', customerResult.error);
    process.exit(1);
  }

  console.log('✅ Plantilla creada:', customerResult.data?.id);

  // Publicar plantilla
  await resend.templates.publish(customerResult.data!.id);
  console.log('✅ Plantilla publicada\n');

  // 2. Plantilla para negocio
  console.log('📧 Creando plantilla: business-booking-notification...');
  const businessResult = await resend.templates.create({
    name: 'Notificación de Nueva Reserva - Negocio',
    alias: 'business-booking-notification',
    subject: '🎉 Nueva reserva: {{{SERVICE_NAME}}} - {{{CUSTOMER_NAME}}}',
    html: businessNotificationTemplate,
    variables: [
      { key: 'BUSINESS_NAME', type: 'string' },
      { key: 'BRAND_COLOR', type: 'string', fallbackValue: '#3b82f6' },
      { key: 'CUSTOMER_NAME', type: 'string' },
      { key: 'CUSTOMER_EMAIL', type: 'string', fallbackValue: '' },
      { key: 'CUSTOMER_PHONE', type: 'string', fallbackValue: '' },
      { key: 'SERVICE_NAME', type: 'string' },
      { key: 'DATE', type: 'string' },
      { key: 'TIME', type: 'string' },
      { key: 'DURATION', type: 'string' },
      { key: 'ADMIN_URL', type: 'string' },
    ],
  });

  if (businessResult.error) {
    console.error('❌ Error:', businessResult.error);
    process.exit(1);
  }

  console.log('✅ Plantilla creada:', businessResult.data?.id);

  // Publicar plantilla
  await resend.templates.publish(businessResult.data!.id);
  console.log('✅ Plantilla publicada\n');

  console.log('🎉 ¡Todas las plantillas creadas exitosamente!');
  console.log('\nAlias para usar en el código:');
  console.log('  - customer-booking-confirmation');
  console.log('  - business-booking-notification');
}

createTemplates().catch(console.error);
