/**
 * Verificar si reservaya.app está verificado en Resend
 */

const RESEND_API_KEY = "re_481FzGcB_PCPo4E6CD8jcCGgkNuusshaU";

async function checkDomain() {
  console.log('🔍 Verificando dominios en Resend...\n');
  
  try {
    // Listar dominios verificados
    const response = await fetch('https://api.resend.com/domains', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Error:', data);
      return;
    }

    console.log('📋 Dominios encontrados:');
    if (data.data && data.data.length > 0) {
      data.data.forEach(domain => {
        console.log(`  - ${domain.name} (${domain.status})`);
      });
      
      const reservaya = data.data.find(d => d.name.includes('reservaya'));
      if (reservaya) {
        console.log('\n✅ reservaya.app está configurado');
        console.log('   Estado:', reservaya.status);
      } else {
        console.log('\n❌ reservaya.app NO está configurado');
      }
    } else {
      console.log('  No hay dominios configurados');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkDomain();
