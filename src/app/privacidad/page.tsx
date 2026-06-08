import Link from 'next/link';

export default function Privacidad() {
  return (
    <div style={{ background: '#020617', color: 'white', minHeight: '100vh', padding: '60px 20px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', background: 'rgba(255,255,255,0.03)', padding: '40px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '20px', color: '#06b6d4' }}>Política de Privacidad</h1>
        <p style={{ color: '#94a3b8', marginBottom: '30px' }}>Última actualización: Junio de 2026</p>
        
        <h2 style={{ fontSize: '1.5rem', marginBottom: '15px', color: '#e2e8f0' }}>1. Tratamiento de Datos Personales (Ley 25.326)</h2>
        <p style={{ color: '#94a3b8', marginBottom: '20px', lineHeight: '1.6' }}>
          En cumplimiento con la <strong>Ley de Protección de los Datos Personales N° 25.326 de la República Argentina</strong>, le informamos que los datos recabados en esta Plataforma (incluyendo nombres, correos electrónicos, historiales de progreso, estados de ánimo y conversaciones con la inteligencia artificial) serán incorporados a una base de datos bajo la responsabilidad de PlayBalance.
        </p>
        <p style={{ color: '#94a3b8', marginBottom: '20px', lineHeight: '1.6' }}>
          La recolección y tratamiento de estos datos tienen como única finalidad gestionar el progreso del usuario dentro de la Plataforma, permitir la comunicación con el Profesional vinculado y garantizar el correcto funcionamiento de la Inteligencia Artificial de soporte ("el Bot"). 
        </p>

        <h2 style={{ fontSize: '1.5rem', marginBottom: '15px', color: '#e2e8f0' }}>2. Derechos de los Usuarios y Menores de Edad</h2>
        <p style={{ color: '#94a3b8', marginBottom: '20px', lineHeight: '1.6' }}>
          El titular de los datos personales (en el caso de menores de edad, sus padres o tutores legales representados como "Capitanes" en la aplicación) tiene la facultad de ejercer el derecho de <strong>acceso, rectificación, actualización y supresión</strong> de sus datos de forma gratuita en intervalos no inferiores a seis meses, salvo que se acredite un interés legítimo al efecto conforme lo establecido en el artículo 14, inciso 3 de la Ley N° 25.326.
        </p>
        <p style={{ color: '#94a3b8', marginBottom: '20px', lineHeight: '1.6' }}>
          El registro y recolección de datos de menores de edad es realizado bajo el exclusivo <strong>consentimiento expreso e informado del adulto responsable (Capitán)</strong> que crea la familia en la Plataforma.
        </p>

        <h2 style={{ fontSize: '1.5rem', marginBottom: '15px', color: '#e2e8f0' }}>3. Confidencialidad y Seguridad</h2>
        <p style={{ color: '#94a3b8', marginBottom: '20px', lineHeight: '1.6' }}>
          PlayBalance se compromete a adoptar todas las medidas técnicas y organizativas necesarias para garantizar la seguridad y confidencialidad de los datos personales, de modo de evitar su adulteración, pérdida, consulta o tratamiento no autorizado, y que permitan detectar desviaciones, intencionales o no, de información, ya sea que los riesgos provengan de la acción humana o del medio técnico utilizado.
        </p>

        <h2 style={{ fontSize: '1.5rem', marginBottom: '15px', color: '#e2e8f0' }}>4. Interacción con el Bot (Inteligencia Artificial)</h2>
        <p style={{ color: '#94a3b8', marginBottom: '20px', lineHeight: '1.6' }}>
          Las conversaciones que los menores mantengan con la Inteligencia Artificial (Avatar Bot) serán registradas y <strong>puestas a disposición del Capitán responsable de la familia</strong> por motivos exclusivos de seguridad y transparencia. El bot avisará explícitamente al menor sobre este registro. En ningún caso la IA brindará diagnósticos ni consejos médicos o psicológicos.
        </p>

        <h2 style={{ fontSize: '1.5rem', marginBottom: '15px', color: '#e2e8f0' }}>5. Contacto Legal</h2>
        <p style={{ color: '#94a3b8', marginBottom: '40px', lineHeight: '1.6' }}>
          La AGENCIA DE ACCESO A LA INFORMACIÓN PÚBLICA, en su carácter de Órgano de Control de la Ley N° 25.326, tiene la atribución de atender las denuncias y reclamos que interpongan quienes resulten afectados en sus derechos por incumplimiento de las normas vigentes en materia de protección de datos personales. <br/><br/>
          Para ejercer sus derechos o revocar el consentimiento, el Capitán puede utilizar las herramientas de gestión de la Plataforma o contactarnos a <strong>hola@play-balance.com</strong>.
        </p>

        <Link href="/" style={{ display: 'inline-block', padding: '12px 24px', background: '#06b6d4', color: 'white', textDecoration: 'none', borderRadius: '12px', fontWeight: 'bold' }}>
          ← Volver al inicio
        </Link>
      </div>
    </div>
  );
}
