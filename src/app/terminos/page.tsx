import Link from 'next/link';

export default function Terminos() {
  return (
    <div style={{ background: '#020617', color: 'white', minHeight: '100vh', padding: '60px 20px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', background: 'rgba(255,255,255,0.03)', padding: '40px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '20px', color: '#06b6d4' }}>Términos y Condiciones</h1>
        <p style={{ color: '#94a3b8', marginBottom: '30px' }}>Última actualización: Junio de 2026</p>
        
        <h2 style={{ fontSize: '1.5rem', marginBottom: '15px', color: '#e2e8f0' }}>1. Aceptación de los Términos</h2>
        <p style={{ color: '#94a3b8', marginBottom: '20px', lineHeight: '1.6' }}>
          Al acceder y utilizar PlayBalance ("la Plataforma"), usted acepta estar sujeto a estos Términos y Condiciones. La Plataforma está diseñada para ser utilizada por familias y profesionales bajo el estricto consentimiento y supervisión de un adulto responsable ("el Capitán" o "el Profesional").
        </p>

        <h2 style={{ fontSize: '1.5rem', marginBottom: '15px', color: '#e2e8f0' }}>2. Responsabilidad de las Familias y Profesionales</h2>
        <p style={{ color: '#94a3b8', marginBottom: '20px', lineHeight: '1.6' }}>
          Los Capitanes (padres, madres o tutores legales) son responsables de configurar las misiones, aprobar recompensas y gestionar el uso adecuado de la Plataforma por parte de los menores a su cargo. Asimismo, la Plataforma no reemplaza el consejo, diagnóstico o tratamiento médico o psicológico profesional; es una herramienta complementaria de seguimiento.
        </p>

        <h2 style={{ fontSize: '1.5rem', marginBottom: '15px', color: '#e2e8f0' }}>3. Uso de la Inteligencia Artificial</h2>
        <p style={{ color: '#94a3b8', marginBottom: '20px', lineHeight: '1.6' }}>
          El Avatar Bot es un sistema automatizado diseñado con el fin de acompañar y promover el bienestar digital. No es un psicólogo ni un terapeuta. Cualquier inquietud sobre la salud mental o física del menor debe ser tratada directamente con profesionales matriculados.
        </p>
        
        <h2 style={{ fontSize: '1.5rem', marginBottom: '15px', color: '#e2e8f0' }}>4. Propiedad Intelectual</h2>
        <p style={{ color: '#94a3b8', marginBottom: '40px', lineHeight: '1.6' }}>
          Todos los derechos de propiedad intelectual de la Plataforma, incluyendo su diseño, software, y contenidos, pertenecen a PlayBalance o a sus respectivos licenciantes. Queda expresamente prohibida la reproducción, distribución o modificación no autorizada de cualquier elemento de la plataforma.
        </p>

        <Link href="/" style={{ display: 'inline-block', padding: '12px 24px', background: '#06b6d4', color: 'white', textDecoration: 'none', borderRadius: '12px', fontWeight: 'bold' }}>
          ← Volver al inicio
        </Link>
      </div>
    </div>
  );
}
