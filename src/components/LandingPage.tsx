'use client';

import { motion } from 'framer-motion';
import { 
  Trophy, 
  ArrowRight,
  Sparkles,
  Stethoscope,
  Building2,
  Star,
  Rocket,
  Brain,
  HeartHandshake,
  Target,
  Dna
} from 'lucide-react';
import Link from 'next/link';

export function LandingPage() {
  return (
    <div style={{ background: '#020617', color: 'white', minHeight: '100vh', overflowX: 'hidden' }}>
      {/* Navbar Minimalista */}
      <nav className="navbar">
        <div className="brand-container">
          <img src="/icon.png" alt="PlayBalance Logo" className="brand-logo" width={40} height={40} style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
          <h1 className="nav-logo">Play<span style={{ color: '#06b6d4' }}>Balance</span></h1>
        </div>
        <div className="nav-actions">
          <Link href="/login" className="nav-btn-secondary">Entrar</Link>
          <Link href="/register" className="btn-primary nav-btn">Registrarse</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ paddingTop: '160px', paddingBottom: '100px', textAlign: 'center', position: 'relative' }}>
        <div style={{ 
          position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)',
          width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 70%)',
          zIndex: 0, pointerEvents: 'none'
        }} />
        
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <span className="hero-subtitle">
              La aventura de crecer, gamificada
            </span>
            <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', fontWeight: 900, marginTop: '20px', lineHeight: 1.1 }}>
              Rediseñá la estrategia y transformá la rutina <br /> en una <span style={{ color: '#06b6d4' }}>Aventura Épica</span>
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '1.1rem', maxWidth: '800px', margin: '30px auto', lineHeight: 1.6 }}>
              <strong>PlayBalance</strong> es una plataforma gamificada para transformar las rutinas, la disciplina y las tareas del hogar en un juego motivador. Ayuda a los padres a fomentar buenos hábitos en sus hijos mediante un sistema de misiones y recompensas (economía de fichas), reduciendo las peleas diarias y, al mismo tiempo, permitiendo que profesionales (psicólogos, terapeutas, nutricionistas, coaches, etc.) puedan hacer un seguimiento real del comportamiento de los niños, pacientes o clientes en casa.
            </p>
            
            <div className="hero-buttons">
              <Link href="/register" className="btn-primary hero-btn">
                Crear mi cuenta gratis
              </Link>
              <Link href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="hero-btn-secondary">
                Ver demostración
              </Link>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ delay: 0.4, duration: 1 }}
            style={{ marginTop: '80px', borderRadius: '30px', overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <img src="/play_balance_hero.png" alt="Play Balance App" style={{ width: '100%', height: 'auto', display: 'block' }} />
          </motion.div>
        </div>
      </section>

      {/* Secciones de Valor */}
      <section style={{ padding: '100px 0', background: 'rgba(255,255,255,0.02)' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
          <ValueCard 
            icon={<Trophy size={40} color="#06b6d4" />}
            title="Para Equipos"
            description="Misiones personalizadas, recompensas reales y una convivencia más armoniosa. Motiva a los aventureros sin conflictos."
          />
          <ValueCard 
            icon={<Stethoscope size={40} color="#8b5cf6" />}
            title="Para Profesionales"
            description="Sigue el progreso de tus pacientes fuera de consulta. Asigna tareas o rutinas, recibe datos precisos y entrega feedback."
          />
          <ValueCard 
            icon={<Building2 size={40} color="#ec4899" />}
            title="Para Instituciones"
            description="Gestiona tu equipo de profesionales y escala tu impacto clínico con una plataforma marca blanca."
          />
        </div>
      </section>

      {/* Sección IA */}
      <section style={{ padding: '100px 0', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'radial-gradient(circle at 50% 50%, rgba(34, 197, 94, 0.05) 0%, transparent 50%)' }}>
        <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', padding: '10px 20px', borderRadius: '50px', fontWeight: 'bold', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={20} />
            Desarrollado con IA de Última Generación
          </div>
          <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, marginBottom: '20px', lineHeight: 1.2 }}>
            Conoce al <span style={{ color: '#22c55e' }}>Mentor Virtual</span> de tu hijo
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '1.2rem', maxWidth: '800px', margin: '0 auto 50px', lineHeight: 1.6 }}>
            PlayBalance integra un asistente inteligente diseñado para el bienestar digital. No es un chatbot genérico; es un compañero botánico que <strong>crece, evoluciona y adapta su personalidad</strong> a la edad y madurez de cada aventurero.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px', width: '100%', textAlign: 'left' }}>
            <ValueCard 
              icon={<span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '10px' }}>🌱 ➡️ 🌳</span>}
              title="Evolución Dinámica"
              description="El asistente comienza como un pequeño brote tierno (Ceibito) y evoluciona visual y verbalmente hasta convertirse en un árbol sabio gracias a las interacciones del niño."
            />
            <ValueCard 
              icon={<Brain size={40} color="#22c55e" style={{ marginBottom: '10px' }} />}
              title="Adaptación en Tiempo Real"
              description="Nuestra IA calibra su vocabulario, picardía y madurez analizando cómo escribe el niño, ofreciendo charlas que no son ni aburridas ni abrumadoras."
            />
            <ValueCard 
              icon={<HeartHandshake size={40} color="#22c55e" style={{ marginBottom: '10px' }} />}
              title="Guía Emocional Segura"
              description="Acompaña al niño en sus chequeos de estado de ánimo y hábitos offline (JOMO), derivando proactivamente cualquier situación delicada al Capitán de la familia."
            />
          </div>
        </div>
      </section>

      {/* Sección Científica */}
      <section style={{ padding: '100px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, marginBottom: '20px' }}>
              Diseñado para lograr <span style={{ color: '#8b5cf6' }}>hábitos</span> positivos, nos basamos en principios simples
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '1.2rem', maxWidth: '700px', margin: '0 auto' }}>
              PlayBalance es una herramienta de gestión de equipos. Se basa en principios como autoconciencia, responsabilidad, intencionalidad, disciplina, resiliencia y curiosidad.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px' }}>
            <ValueCard 
              icon={<Target size={32} color="#06b6d4" />}
              title="Economía de Fichas"
              description="Cambiamos la corrección por el cultivo de fortalezas. Un sistema de incentivos estructurados que facilita la adopción de hábitos positivos a través del progreso visible."
              reference="Terapia Conductual Aplicada (Ayllon & Azrin)"
            />
            <ValueCard 
              icon={<Brain size={32} color="#8b5cf6" />}
              title="Refuerzo Positivo"
              description="Validamos el progreso. Premiar el esfuerzo activa el sistema de recompensa cerebral, vinculando las responsabilidades diarias con emociones de logro y alta motivación."
              reference="Condicionamiento Operante (Skinner) y Mecanismos de Dopamina (Schultz et al.)"
            />
            <ValueCard 
              icon={<HeartHandshake size={32} color="#ec4899" />}
              title="Autodeterminación"
              description="Impulsamos la autonomía. Permitir que los niños propongan ideas y negocien sus propias metas los convierte en los verdaderos protagonistas de su desarrollo."
              reference="Teoría de la Autodeterminación (Deci & Ryan)"
            />
            <ValueCard 
              icon={<Dna size={32} color="#10b981" />}
              title="Neuroplasticidad"
              description="Estimulamos la flexibilidad cerebral. Los entornos lúdicos reducen el estrés y la resistencia al cambio, optimizando las áreas cognitivas encargadas de asimilar nuevas habilidades."
              reference="Neuroplasticidad y Entornos Dinámicos (Kühn et al.)"
            />
          </div>
        </div>
      </section>


      {/* CTA Final */}
      <section style={{ padding: '100px 0' }}>
        <div className="container">
          <div className="glass cta-box">
            <Rocket size={60} color="#06b6d4" style={{ marginBottom: '30px', margin: '0 auto' }} />
            <h2 className="cta-title">Comencemos a compartir misiones y gratificaciones con nuestros aventureros</h2>
            <p className="cta-desc">Cientos de equipos y profesionales ya están viendo resultados en este momento</p>
            <Link href="/register" className="btn-primary cta-btn">
              Crear mi cuenta gratis
            </Link>
          </div>
        </div>
      </section>

      <footer style={{ padding: '60px 0', borderTop: '1px solid rgba(255,255,255,0.05)', color: '#475569' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px', marginBottom: '40px' }}>
          <div>
            <h3 style={{ color: 'white', marginBottom: '20px', fontSize: '1.2rem' }}>PlayBalance</h3>
            <p>Transformando la rutina en aventuras extraordinarias.</p>
          </div>
          <div>
            <h3 style={{ color: 'white', marginBottom: '20px', fontSize: '1.2rem' }}>Contacto</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li><a href="mailto:hola@play-balance.com" style={{ color: '#06b6d4', textDecoration: 'none' }}>hola@play-balance.com</a> (General)</li>
              <li><a href="mailto:soporte@play-balance.com" style={{ color: '#06b6d4', textDecoration: 'none' }}>soporte@play-balance.com</a> (Soporte Técnico)</li>
              <li><a href="mailto:contacto@play-balance.com" style={{ color: '#06b6d4', textDecoration: 'none' }}>contacto@play-balance.com</a> (Comercial/Institucional)</li>
            </ul>
          </div>
        </div>
        <div style={{ textAlign: 'center', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <p>© 2026 Play Balance. Diseñado para equipos del futuro.</p>
        </div>
      </footer>

      <style jsx>{`
        .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        .glass { backdrop-filter: blur(10px); }
        
        .navbar {
          padding: 20px 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: fixed;
          width: 100%;
          z-index: 100;
          backdrop-filter: blur(10px);
          background: rgba(2, 6, 23, 0.7);
        }
        .brand-container {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .brand-logo {
          width: 65px;
          height: 65px;
          margin-bottom: 5px;
          z-index: 1;
          border-radius: 50%;
          mix-blend-mode: screen;
          filter: contrast(1.3) brightness(1.1);
          -webkit-mask-image: radial-gradient(circle, black 50%, transparent 75%);
          mask-image: radial-gradient(circle, black 50%, transparent 75%);
        }
        .nav-logo {
          font-size: 1.5rem;
          font-weight: 800;
          position: relative;
          z-index: 2;
        }
        .nav-actions {
          display: flex;
          gap: 20px;
          align-items: center;
        }
        .nav-btn {
          padding: 10px 25px;
          border-radius: 50px;
          text-decoration: none;
          background: #06b6d4;
          color: white;
          font-weight: 700;
        }

        .hero-subtitle {
          background: rgba(6, 182, 212, 0.1);
          color: #06b6d4;
          padding: 8px 20px;
          border-radius: 50px;
          font-size: 0.9rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          display: inline-block;
          line-height: 1.4;
        }

        .hero-buttons {
          display: flex;
          gap: 20px;
          justify-content: center;
          margin-top: 40px;
          flex-wrap: wrap;
        }
        .hero-btn {
          padding: 12px 24px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: #06b6d4;
          color: white;
          text-decoration: none;
          font-weight: 600;
          width: auto;
        }


        .cta-box {
          padding: 80px 40px;
          border-radius: 40px;
          text-align: center;
          border: 1px solid rgba(6, 182, 212, 0.3);
          background: rgba(255,255,255,0.03);
        }
        .cta-title {
          font-size: 3rem;
          font-weight: 800;
        }
        .cta-desc {
          color: #94a3b8;
          font-size: 1.2rem;
          margin: 20px 0 40px;
        }
        .cta-btn {
          padding: 20px 50px;
          font-size: 1.2rem;
          border-radius: 15px;
          background: #06b6d4;
          color: white;
          text-decoration: none;
          font-weight: 700;
          display: inline-block;
        }

        @media (max-width: 768px) {
          .navbar {
            padding: 15px 20px;
            flex-direction: column;
            gap: 15px;
          }
          .brand-container {
            align-items: center;
          }
          .brand-logo {
            width: 65px;
            height: 65px;
            margin-bottom: 5px;
          }
          .nav-logo {
            font-size: 1.2rem;
          }
          .nav-actions {
            gap: 12px;
          }
          .nav-btn {
            padding: 8px 16px;
            font-size: 0.9rem;
          }
          
          .hero-subtitle {
            padding: 6px 12px;
            font-size: 0.75rem;
            letter-spacing: 0.05em;
            display: inline-block;
            white-space: normal;
          }

          .hero-buttons {
            flex-direction: column;
            gap: 15px;
          }
          .hero-btn {
            width: 100%;
            padding: 12px 20px;
            box-sizing: border-box;
          }

          .cta-box {
            padding: 40px 20px;
          }
          .cta-title {
            font-size: 2rem;
          }
          .cta-desc {
            font-size: 1rem;
          }
          .cta-btn {
            padding: 15px 20px;
            font-size: 1.1rem;
            width: 100%;
            box-sizing: border-box;
          }
        }
      `}</style>
    </div>
  );
}

function ValueCard({ icon, title, description, reference }: any) {
  return (
    <motion.div whileHover={{ y: -10 }} className="glass" style={{ padding: '40px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.03)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '20px' }}>{icon}</div>
      <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>{title}</h3>
      <p style={{ color: '#94a3b8', lineHeight: 1.6, flexGrow: 1 }}>{description}</p>
      {reference && (
        <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic' }}>
          Ref: {reference}
        </div>
      )}
    </motion.div>
  );
}
