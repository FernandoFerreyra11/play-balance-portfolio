'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { 
  Coins, 
  Trophy, 
  Gamepad2, 
  Smartphone, 
  MessageSquarePlus, 
  LogOut, 
  CheckCircle2, 
  ArrowRight,
  Settings,
  Gift,
  Clock,
  Sparkles,
  ShieldCheck,
  Stethoscope,
  Building2,
  Users,
  Star,
  Rocket
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { 
  getPlayerStats, 
  getAvailableQuests, 
  getAvailableRewards, 
  requestQuestCompletion, 
  requestReward 
} from './actions/player';
import { createSuggestion, getMySuggestions } from './actions/suggestions';

// --- COMPONENTE LANDING PAGE ---
function LandingPage() {
  return (
    <div style={{ background: '#020617', color: 'white', minHeight: '100vh', overflowX: 'hidden' }}>
      {/* Navbar Minimalista */}
      <nav style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'fixed', width: '100%', zIndex: 100, backdropFilter: 'blur(10px)', background: 'rgba(2, 6, 23, 0.7)' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Play<span style={{ color: '#06b6d4' }}>Balance</span></h1>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <Link href="/login" style={{ color: '#94a3b8', textDecoration: 'none', fontWeight: 600 }}>Entrar</Link>
          <Link href="/register" className="btn-primary" style={{ padding: '10px 25px', borderRadius: '50px', textDecoration: 'none' }}>Registrarse</Link>
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
              <Link href="/register" className="btn-primary" style={{ padding: '18px 40px', fontSize: '1.1rem', borderRadius: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                Empezar mi familia <ArrowRight size={20} />
              </Link>
              <Link href="/login" className="glass" style={{ padding: '18px 40px', fontSize: '1.1rem', borderRadius: '15px', color: 'white', textDecoration: 'none' }}>
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
            <img src="/api/placeholder/1200/600" alt="Play Balance App" style={{ width: '100%', height: 'auto', display: 'block' }} id="hero-img" />
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
            title="Para Terapeutas"
            description="Sigue el progreso de tus pacientes fuera de consulta. Asigna tareas terapéuticas y recibe datos precisos."
          />
          <ValueCard 
            icon={<Building2 size={40} color="#ec4899" />}
            title="Para Instituciones"
            description="Gestiona tu equipo de profesionales y escala tu impacto clínico con una plataforma marca blanca."
          />
        </div>
      </section>

      {/* Testimonio / Social Proof */}
      <section style={{ padding: '100px 0', textAlign: 'center' }}>
        <div className="container">
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '5px', marginBottom: '20px' }}>
              {[1,2,3,4,5].map(i => <Star key={i} size={20} fill="#f59e0b" color="#f59e0b" />)}
            </div>
            <h2 style={{ fontSize: '2rem', fontStyle: 'italic', lineHeight: 1.4 }}>
              "Play Balance ha cambiado las mañanas en mi casa. Lo que antes era una batalla para vestirse, ahora es una misión de 50 tokens que mi hijo hace con una sonrisa."
            </h2>
            <p style={{ marginTop: '20px', fontWeight: 700, color: '#06b6d4' }}>— Elena, Mamá de Lucas (7 años)</p>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section style={{ padding: '100px 0' }}>
        <div className="container">
          <div className="glass" style={{ padding: '80px 40px', borderRadius: '40px', textAlign: 'center', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
            <Rocket size={60} color="#06b6d4" style={{ marginBottom: '30px' }} />
            <h2 style={{ fontSize: '3rem', fontWeight: 800 }}>¿Listo para el siguiente nivel?</h2>
            <p style={{ color: '#94a3b8', fontSize: '1.2rem', margin: '20px 0 40px' }}>Únete a las cientos de familias y profesionales que ya están jugando.</p>
            <Link href="/register" className="btn-primary" style={{ padding: '20px 50px', fontSize: '1.2rem', borderRadius: '15px' }}>
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
        .btn-primary { background: #06b6d4; color: white; border: none; font-weight: 700; transition: all 0.3s; cursor: pointer; }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(6, 182, 212, 0.4); }
        .glass { background: rgba(255,255,255,0.03); backdrop-filter: blur(10px); }
      `}</style>

      <script dangerouslySetInnerHTML={{ __html: `
        // Intentar cargar la imagen real si existe
        setTimeout(() => {
          const img = document.getElementById('hero-img');
          if (img) img.src = '/play_balance_hero.png';
        }, 100);
      `}} />
    </div>
  );
}

function ValueCard({ icon, title, description }: any) {
  return (
    <motion.div whileHover={{ y: -10 }} className="glass" style={{ padding: '40px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ marginBottom: '20px' }}>{icon}</div>
      <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>{title}</h3>
      <p style={{ color: '#94a3b8', lineHeight: 1.6 }}>{description}</p>
    </motion.div>
  );
}

// --- COMPONENTE HOME (DECISOR) ---
export default function Home() {
  const { data: session, status } = useSession();
  const [player, setPlayer] = useState<any>(null);
  const [quests, setQuests] = useState<any[]>([]);
  const [rewards, setRewards] = useState<any[]>([]);
  const [mySuggestions, setMySuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [suggestionText, setSuggestionText] = useState('');
  const [sending, setSending] = useState(false);

  const fetchData = async () => {
    if (session?.user) {
      const stats = await getPlayerStats();
      const q = await getAvailableQuests();
      const r = await getAvailableRewards();
      const s = await getMySuggestions();
      setPlayer(stats);
      setQuests(q);
      setRewards(r);
      setMySuggestions(s);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData();
    } else if (status === 'unauthenticated') {
      setLoading(false);
    }
  }, [status, session]);

  if (status === 'loading') {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#020617' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
          <Sparkles size={40} color="#06b6d4" />
        </motion.div>
      </div>
    );
  }

  // SI NO ESTÁ AUTENTICADO -> LANDING PAGE
  if (status === 'unauthenticated') {
    return <LandingPage />;
  }

  // VISTA PARA EL PADRE / ADMIN / PRO / ORG
  if (player?.role === 'parent' || player?.role === 'professional' || player?.role === 'org_admin' || player?.role === 'super_admin') {
    const roleConfig: any = {
      parent: { icon: '🛡️', title: 'Hola, Papá/Mamá', desc: 'Gestiona tu familia', link: '/admin' },
      professional: { icon: '🩺', title: 'Panel Profesional', desc: 'Gestiona tus pacientes', link: '/pro' },
      org_admin: { icon: '🏢', title: 'Panel Institucional', desc: 'Gestiona tu centro', link: '/institucion' },
      super_admin: { icon: '🌐', title: 'Super Admin', desc: 'Control Global', link: '/super-admin' }
    };
    
    const config = roleConfig[player.role as string] || roleConfig.parent;

    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: '100px', minHeight: '100vh', background: '#020617', color: 'white' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>{config.icon}</div>
          <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '10px' }}>
            {config.title} <span style={{ color: '#06b6d4' }}>{player.name}</span>
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1.2rem', marginBottom: '40px' }}>
            {config.desc}. ¿Qué quieres hacer hoy?
          </p>
          
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href={config.link}>
              <button className="btn-primary" style={{ padding: '20px 40px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '10px', borderRadius: '15px' }}>
                <Settings size={20} /> Ir al Panel de Control
              </button>
            </Link>
            <button onClick={() => signOut()} className="glass" style={{ padding: '20px 40px', color: 'white', display: 'flex', alignItems: 'center', gap: '10px', borderRadius: '15px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }}>
              <LogOut size={20} /> Cerrar sesión
            </button>
          </div>
        </motion.div>
        <style jsx>{`
          .btn-primary { background: #06b6d4; color: white; border: none; font-weight: 700; transition: all 0.3s; cursor: pointer; }
          .glass { background: rgba(255,255,255,0.03); backdrop-filter: blur(10px); }
        `}</style>
      </div>
    );
  }

  // VISTA PARA EL HIJO / JUGADOR (EL RESTO DEL CÓDIGO ORIGINAL)
  return (
    <div className="container" style={{ minHeight: '100vh', background: '#020617', color: 'white', paddingBottom: '100px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '40px 0', flexWrap: 'wrap', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ 
            width: '80px', height: '80px', background: 'rgba(255,255,255,0.05)', 
            border: '2px solid #06b6d4', borderRadius: '50%', display: 'flex', 
            justifyContent: 'center', alignItems: 'center', fontSize: '3rem',
            boxShadow: '0 0 20px rgba(6, 182, 212, 0.3)'
          }}>
            {player?.image || '👤'}
          </div>
          <div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 700 }}>¡Hola, <span style={{ color: '#06b6d4' }}>{player?.name}</span>!</h1>
            <p style={{ color: '#94a3b8' }}>¿Qué aventura elegiremos hoy?</p>
            <button onClick={() => signOut()} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '5px', fontWeight: 600 }}>
              <LogOut size={16} /> Salir
            </button>
          </div>
        </div>
        
        <div className="glass" style={{ textAlign: 'center', padding: '15px 30px', borderRadius: '25px', border: '2px solid #f59e0b' }}>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase' }}>Tu Tesoro</p>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Coins size={32} color="#f59e0b" /> {player?.balance || 0}
          </div>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '40px' }}>
        <section>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Trophy color="#06b6d4" /> Misiones de Hoy
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {quests.map((quest) => (
              <div key={quest.id} className="glass" style={{ padding: '20px', borderRadius: '20px', borderLeft: '6px solid #06b6d4' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem' }}>{quest.title}</h3>
                    <div style={{ color: '#f59e0b', fontWeight: 700, marginTop: '5px' }}>+{quest.reward} Tokens</div>
                  </div>
                  <button 
                    disabled={quest.status === 'pending_approval'}
                    onClick={async () => {
                      const res = await requestQuestCompletion(quest.id);
                      if (res.success) fetchData();
                    }}
                    className="btn-primary" 
                    style={{ padding: '10px 20px', borderRadius: '50px', opacity: quest.status === 'pending_approval' ? 0.5 : 1 }}
                  >
                    {quest.status === 'pending_approval' ? 'En revisión' : '¡Hecho!'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Gift color="#8b5cf6" /> Premios
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {rewards.map((reward) => (
              <div key={reward.id} className="glass" style={{ padding: '20px', borderRadius: '20px', borderLeft: '6px solid #8b5cf6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem' }}>{reward.title}</h3>
                    <div style={{ color: '#f59e0b' }}>{reward.cost} tokens</div>
                  </div>
                  <button 
                    disabled={player?.balance < reward.cost}
                    onClick={async () => {
                      if (confirm(`¿Canjear ${reward.title}?`)) {
                        const res = await requestReward(reward.id);
                        if (res.success) fetchData();
                      }
                    }}
                    className="btn-primary" 
                    style={{ padding: '10px 20px', borderRadius: '50px', background: '#8b5cf6' }}
                  >
                    Canjear
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <style jsx>{`
        .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        .btn-primary { background: #06b6d4; color: white; border: none; font-weight: 700; transition: all 0.3s; cursor: pointer; }
        .glass { background: rgba(255,255,255,0.03); backdrop-filter: blur(10px); }
      `}</style>
    </div>
  );
}

