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
  Sparkles
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

export default function Home() {
  const { data: session, status } = useSession();
  const [player, setPlayer] = useState<any>(null);
  const [quests, setQuests] = useState<any[]>([]);
  const [rewards, setRewards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSuggestion, setShowSuggestion] = useState(false);

  const fetchData = async () => {
    if (session?.user) {
      const stats = await getPlayerStats();
      const q = await getAvailableQuests();
      const r = await getAvailableRewards();
      setPlayer(stats);
      setQuests(q);
      setRewards(r);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData();
    }
  }, [status, session]);

  if (status === 'loading' || loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
          <Sparkles size={40} color="var(--primary-color)" />
        </motion.div>
      </div>
    );
  }

  // VISTA PARA EL PADRE / ADMIN
  if (player?.role === 'parent') {
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: '100px' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🛡️</div>
          <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '10px' }}>
            Hola, <span style={{ color: 'var(--accent-color)' }}>{player.name}</span>
          </h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '1.2rem', marginBottom: '40px' }}>
            Tu equipo está listo. ¿Qué quieres supervisar hoy?
          </p>
          
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/admin">
              <button className="btn-primary" style={{ padding: '20px 40px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Settings size={20} /> Ir a Configuración y Monitoreo
              </button>
            </Link>
            <button onClick={() => signOut()} className="glass" style={{ padding: '20px 40px', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <LogOut size={20} /> Cerrar sesión
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // VISTA PARA EL HIJO / JUGADOR
  return (
    <div className="container">
      {/* Header del Jugador */}
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        margin: '40px 0',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ 
            width: '80px', height: '80px', 
            background: 'rgba(255,255,255,0.05)', 
            border: '2px solid var(--primary-color)',
            borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center',
            fontSize: '3rem', boxShadow: '0 0 20px var(--primary-glow)'
          }}>
            {player?.image || '👤'}
          </div>
          <div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 700 }}>¡Hola, <span style={{ color: 'var(--primary-color)' }}>{player?.name}</span>! 👋</h1>
            <p style={{ color: 'var(--text-dim)' }}>¿Qué aventura elegiremos hoy?</p>
            <button onClick={() => signOut()} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '0.8rem', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <LogOut size={14} /> Salir del juego
            </button>
          </div>
        </div>
        
        <div className="glass card floating" style={{ textAlign: 'center', minWidth: '220px', border: '2px solid var(--gold-color)' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Tu Tesoro</p>
          <div className="token-balance" style={{ fontSize: '3rem' }}>
            <Coins size={36} />
            {player?.balance || 0}
          </div>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '40px' }}>
        
        {/* Sección de Misiones */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '25px' }}>
            <div style={{ padding: '10px', background: 'var(--primary-glow)', borderRadius: '12px' }}>
              <Trophy color="var(--primary-color)" size={24} />
            </div>
            <h2 style={{ fontSize: '1.8rem' }}>Misiones de Hoy</h2>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {quests.length > 0 ? quests.map((quest) => (
              <motion.div 
                key={quest.id} 
                whileHover={{ scale: 1.02 }}
                className="glass card" 
                style={{ borderLeft: '6px solid var(--primary-color)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--primary-color)', fontWeight: 700, textTransform: 'uppercase' }}>{quest.category}</span>
                    <h3 style={{ fontSize: '1.3rem', margin: '5px 0' }}>{quest.title}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--gold-color)', fontWeight: 700 }}>
                      <Coins size={16} /> +{quest.reward} Tokens
                    </div>
                  </div>
                  <button 
                    onClick={async () => {
                      const res = await requestQuestCompletion(quest.id);
                      if (res.success) alert("¡Genial! Papá/Mamá revisará tu misión pronto.");
                    }}
                    className="btn-primary" 
                    style={{ borderRadius: '50px', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    ¡Hecho! <CheckCircle2 size={18} />
                  </button>
                </div>
              </motion.div>
            )) : (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
                No hay misiones hoy. ¡Descansa o sugiere una!
              </div>
            )}
          </div>
        </section>

        {/* Sección de Canje */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '25px' }}>
            <div style={{ padding: '10px', background: 'rgba(6, 182, 212, 0.2)', borderRadius: '12px' }}>
              <Gift color="var(--accent-color)" size={24} />
            </div>
            <h2 style={{ fontSize: '1.8rem' }}>Tienda de Premios</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {rewards.length > 0 ? rewards.map((reward) => (
              <motion.div 
                key={reward.id} 
                whileHover={{ scale: 1.05 }}
                className="glass card" 
                style={{ textAlign: 'center', borderBottom: '4px solid var(--accent-color)' }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}><Gift size={40} color="var(--accent-color)" style={{ margin: '0 auto' }} /></div>
                <h3 style={{ fontSize: '1.1rem', height: '2.4em', overflow: 'hidden' }}>{reward.title}</h3>
                
                <div style={{ margin: '15px 0', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                  <div style={{ color: 'var(--gold-color)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Coins size={14} /> {reward.cost}
                  </div>
                  {reward.minutes && (
                    <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={14} /> {reward.minutes}m
                    </div>
                  )}
                </div>

                <button 
                  disabled={player?.balance < reward.cost}
                  onClick={async () => {
                    if (confirm(`¿Quieres canjear ${reward.title}?`)) {
                      const res = await requestReward(reward.id);
                      if (res.success) {
                        alert("¡Premio canjeado! ¡Disfrútalo!");
                        fetchData();
                      } else {
                        alert(res.error);
                      }
                    }
                  }}
                  className="btn-primary" 
                  style={{ 
                    width: '100%', 
                    background: player?.balance < reward.cost ? 'rgba(255,255,255,0.1)' : 'var(--accent-color)',
                    opacity: player?.balance < reward.cost ? 0.5 : 1
                  }}
                >
                  {player?.balance < reward.cost ? `Faltan ${reward.cost - player.balance}` : 'Canjear'}
                </button>
              </motion.div>
            )) : (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
                Próximamente habrá premios geniales.
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Botón Flotante de Sugerencias */}
      <motion.button 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowSuggestion(true)}
        style={{
          position: 'fixed',
          bottom: '40px',
          right: '40px',
          width: '60px',
          height: '60px',
          borderRadius: '30px',
          background: 'var(--primary-color)',
          border: 'none',
          color: 'white',
          boxShadow: '0 10px 20px rgba(0,0,0,0.3)',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 90
        }}
      >
        <MessageSquarePlus />
      </motion.button>

      {/* Modal de Sugerencias */}
      <AnimatePresence>
        {showSuggestion && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(15, 23, 42, 0.8)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 100
            }}
            onClick={() => setShowSuggestion(false)}
          >
            <motion.div 
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              className="glass card"
              style={{ width: '90%', maxWidth: '400px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ marginBottom: '20px' }}>Sugerir Idea 💡</h2>
              <textarea 
                placeholder="Ej: 'Limpiar el patio por 40 tokens'..."
                style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '15px',
                  color: 'white',
                  height: '120px',
                  fontFamily: 'inherit',
                  marginBottom: '20px'
                }}
              />
              <button className="btn-primary" style={{ width: '100%' }} onClick={() => setShowSuggestion(false)}>Enviar Idea a Papá</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
