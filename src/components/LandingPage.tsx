'use client';

import { motion } from 'framer-motion';
import { 
  Trophy, 
  ArrowRight,
  Sparkles,
  Stethoscope,
  Building2,
  Star,
  Rocket
} from 'lucide-react';
import Link from 'next/link';

export function LandingPage() {
  return (
    <div style={{ background: '#020617', color: 'white', minHeight: '100vh', overflowX: 'hidden' }}>
      {/* Navbar Minimalista */}
      <nav style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'fixed', width: '100%', zIndex: 100, backdropFilter: 'blur(10px)', background: 'rgba(2, 6, 23, 0.7)' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Play<span style={{ color: '#06b6d4' }}>Balance</span></h1>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <Link href="/login" style={{ color: '#94a3b8', textDecoration: 'none', fontWeight: 600 }}>Entrar</Link>
          <Link href="/register" className="btn-primary" style={{ padding: '10px 25px', borderRadius: '50px', textDecoration: 'none', background: '#06b6d4', color: 'white', fontWeight: 700 }}>Registrarse</Link>
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
            <span style={{ background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4', padding: '8px 20px', borderRadius: '50px', fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              La aventura de crecer, gamificada
            </span>
            <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', fontWeight: 900, marginTop: '20px', lineHeight: 1.1 }}>
              Convierte la rutina <br /> en una <span style={{ color: '#06b6d4' }}>Aventura Épica</span>
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '1.25rem', maxWidth: '700px', margin: '30px auto', lineHeight: 1.6 }}>
              La plataforma que une a familias y profesionales para potenciar la autonomía y felicidad de los niños a través del juego.
            </p>
            
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '40px', flexWrap: 'wrap' }}>
              <Link href="/register" className="btn-primary" style={{ padding: '18px 40px', fontSize: '1.1rem', borderRadius: '15px', display: 'flex', alignItems: 'center', gap: '10px', background: '#06b6d4', color: 'white', textDecoration: 'none', fontWeight: 700 }}>
                Empezar mi familia <ArrowRight size={20} />
              </Link>
              <Link href="/login" className="glass" style={{ padding: '18px 40px', fontSize: '1.1rem', borderRadius: '15px', color: 'white', textDecoration: 'none', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
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
            title="Para Familias"
            description="Misiones personalizadas, recompensas reales y una convivencia más armoniosa. Motiva a tus hijos sin conflictos."
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

      {/* CTA Final */}
      <section style={{ padding: '100px 0' }}>
        <div className="container">
          <div className="glass" style={{ padding: '80px 40px', borderRadius: '40px', textAlign: 'center', border: '1px solid rgba(6, 182, 212, 0.3)', background: 'rgba(255,255,255,0.03)' }}>
            <Rocket size={60} color="#06b6d4" style={{ marginBottom: '30px', margin: '0 auto' }} />
            <h2 style={{ fontSize: '3rem', fontWeight: 800 }}>¿Listo para el siguiente nivel?</h2>
            <p style={{ color: '#94a3b8', fontSize: '1.2rem', margin: '20px 0 40px' }}>Únete a las cientos de familias y profesionales que ya están jugando.</p>
            <Link href="/register" className="btn-primary" style={{ padding: '20px 50px', fontSize: '1.2rem', borderRadius: '15px', background: '#06b6d4', color: 'white', textDecoration: 'none', fontWeight: 700 }}>
              Crear mi cuenta gratis
            </Link>
          </div>
        </div>
      </section>

      <footer style={{ padding: '60px 0', borderTop: '1px solid rgba(255,255,255,0.05)', color: '#475569', textAlign: 'center' }}>
        <p>© 2026 Play Balance. Diseñado para familias del futuro.</p>
      </footer>

      <style jsx>{`
        .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        .glass { backdrop-filter: blur(10px); }
      `}</style>
    </div>
  );
}

function ValueCard({ icon, title, description }: any) {
  return (
    <motion.div whileHover={{ y: -10 }} className="glass" style={{ padding: '40px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.03)' }}>
      <div style={{ marginBottom: '20px' }}>{icon}</div>
      <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>{title}</h3>
      <p style={{ color: '#94a3b8', lineHeight: 1.6 }}>{description}</p>
    </motion.div>
  );
}
