/**
 * Script para testear el envío de email con la plantilla de Resend
 * Ejecutar: node scripts/test-email-template.js
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY || "re_481FzGcB_PCPo4E6CD8jcCGgkNuusshaU";

async function sendTestEmail() {
  console.log('🚀 Enviando email de prueba...\n');

  const testData = {
    from: "ReservaYa <ortiz.jonathan2k@gmail.com>",
    to: ["johnmarket36@gmail.com"],
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
    console.log('  Para: johnmarket36@gmail.com');
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
