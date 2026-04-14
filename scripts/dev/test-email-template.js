/**
 * Script para testear el envío de email con la plantilla de Resend
 * Ejecutar: node scripts/test-email-template.js
 */

function requireEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

const RESEND_API_KEY = requireEnv("RESEND_API_KEY");
const TEST_EMAIL_TO = process.env.TEST_EMAIL_TO || process.env.RESEND_FROM_EMAIL;
const TEST_EMAIL_FROM = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

async function sendTestEmail() {
  console.log('🚀 Enviando email de prueba...\n');

  if (!TEST_EMAIL_TO) {
    throw new Error("Define TEST_EMAIL_TO o RESEND_FROM_EMAIL antes de ejecutar el script.");
  }

  const testData = {
    from: `ReservaYa <${TEST_EMAIL_FROM}>`,
    to: [TEST_EMAIL_TO],
    subject: "✅ Tu reserva en Demo Barbería está confirmada",
    template: {
      id: "reservation-confirmation",
      variables: {
        BUSINESS_NAME: "Demo Barbería",
        BRAND_COLOR: "#3b82f6",
        BRAND_COLOR_DARK: "#2563eb",
        CUSTOMER_NAME: "Juan Pérez",
        SERVICE_NAME: "Corte + Barba",
        DATE: "lunes 17 de marzo",
        TIME: "14:30",
        DURATION: "60 minutos",
        PRICE: "$5.500",
        ADDRESS: "Av. del Libertador 214, Palermo, Buenos Aires",
        MANAGE_URL: "https://reservaya-kappa.vercel.app/demo-barberia/reserva/abc123"
      }
    }
  };

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Error al enviar:');
      console.error(data);
      return;
    }

    console.log('✅ Email enviado exitosamente!');
    console.log('📧 ID:', data.id);
    console.log('\n📋 Detalles:');
    console.log(`  Para: ${TEST_EMAIL_TO}`);
    console.log('  Plantilla: customer-booking-confirmation');
    console.log('  Variables usadas:');
    console.log('    - Negocio: Demo Barbería');
    console.log('    - Cliente: Juan Pérez');
    console.log('    - Servicio: Corte + Barba');
    console.log('    - Fecha: lunes 17 de marzo a las 14:30');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

sendTestEmail();
