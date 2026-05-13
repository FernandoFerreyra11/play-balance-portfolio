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
import { createSuggestion, getMySuggestions } from './actions/suggestions';

export default function Home() {
  const { data: session, status } = useSession();
  const [player, setPlayer] = useState<any>(null);
  const [quests, setQuests] = useState<any[]>([]);
  const [rewards, setRewards] = useState<any[]>([]);
  const [mySuggestions, setMySuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSuggestion, setShowSuggestion] = useState(false);
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

  const handleSuggestionSubmit = async () => {
    if (!suggestionText.trim()) return;
    setSending(true);
    const res = await createSuggestion(suggestionText);
    if (res.success) {
      setSuggestionText('');
      setShowSuggestion(false);
      fetchData(); // Recargar para ver la nueva sugerencia en la lista
    } else {
      alert(res.error);
    }
    setSending(false);
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
            <h1 style={{ 
              fontSize: 'clamp(1.5rem, 5vw, 2.2rem)', 
              fontWeight: 700, 
              lineHeight: 1.2,
              wordBreak: 'break-word'
            }}>
              ¡Hola, <span style={{ color: 'var(--primary-color)' }}>{player?.name}</span>! 👋
            </h1>
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
                    disabled={quest.status === 'pending_approval'}
                    onClick={async () => {
                      const res = await requestQuestCompletion(quest.id);
                      if (res.success) {
                        fetchData(); // Recargamos para ver el cambio de estado
                      } else {
                        alert(res.error);
                      }
                    }}
                    className={quest.status === 'pending_approval' ? "glass" : "btn-primary"} 
                    style={{ 
                      borderRadius: '50px', 
                      padding: '10px 20px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      opacity: quest.status === 'pending_approval' ? 0.6 : 1,
                      cursor: quest.status === 'pending_approval' ? 'default' : 'pointer',
                      border: quest.status === 'pending_approval' ? '1px solid var(--border-color)' : 'none',
                      color: quest.status === 'pending_approval' ? 'var(--text-dim)' : 'white'
                    }}
                  >
                    {quest.status === 'pending_approval' ? (
                      <>En revisión <Clock size={16} /></>
                    ) : (
                      <>¡Hecho! <CheckCircle2 size={18} /></>
                    )}
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {rewards.length > 0 ? rewards.map((reward) => (
              <motion.div 
                key={reward.id} 
                whileHover={{ scale: 1.02 }}
                className="glass card" 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  gap: '20px',
                  borderBottom: 'none',
                  borderLeft: '6px solid var(--accent-color)',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1 }}>
                  <div style={{ fontSize: '2rem', minWidth: '50px', height: '50px', background: 'rgba(6, 182, 212, 0.1)', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Gift size={24} color="var(--accent-color)" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.2rem' }}>{reward.title}</h3>
                    <div style={{ display: 'flex', gap: '15px', marginTop: '5px' }}>
                      <div style={{ color: 'var(--gold-color)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem' }}>
                        <Coins size={14} /> {reward.cost} tokens
                      </div>
                      {reward.minutes && (
                        <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={14} /> {reward.minutes}m
                        </div>
                      )}
                    </div>
                  </div>
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
                    minWidth: '120px',
                    padding: '12px 24px',
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

      {/* Nueva Sección: Buzón de Sugerencias Directo */}
      <section style={{ marginTop: '50px', maxWidth: '800px', margin: '50px auto' }}>
        <div className="glass card" style={{ padding: '30px', borderTop: '4px solid var(--primary-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ padding: '10px', background: 'rgba(139, 92, 246, 0.2)', borderRadius: '12px' }}>
              <MessageSquarePlus color="var(--primary-color)" size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.5rem' }}>¿Tenés una idea? 💡</h2>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Proponé una nueva misión o premio a Papá/Mamá.</p>
            </div>
          </div>
          
          <textarea 
            value={suggestionText}
            onChange={(e) => setSuggestionText(e.target.value)}
            placeholder="Ej: 'Si lavo los platos por una semana, ¿me das 200 tokens?'..."
            style={{
              width: '100%',
              background: 'rgba(0,0,0,0.2)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '15px',
              color: 'white',
              height: '100px',
              fontFamily: 'inherit',
              marginBottom: '20px',
              resize: 'none'
            }}
          />
          <button 
            disabled={sending || !suggestionText.trim()}
            className="btn-primary" 
            style={{ width: '100%', padding: '15px' }} 
            onClick={handleSuggestionSubmit}
          >
            {sending ? 'Enviando idea...' : 'Enviar Sugerencia'}
          </button>

          {mySuggestions.length > 0 && (
            <div style={{ marginTop: '30px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '15px', color: 'var(--text-dim)' }}>Mis ideas anteriores:</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {mySuggestions.map((s) => (
                  <div key={s.id} className="glass" style={{ padding: '12px', borderRadius: '12px', fontSize: '0.9rem' }}>
                    <p style={{ marginBottom: '8px' }}>"{s.content}"</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ 
                        fontSize: '0.7rem', 
                        fontWeight: 700, 
                        padding: '4px 10px', 
                        borderRadius: '20px',
                        background: s.status === 'approved' ? 'rgba(34, 197, 94, 0.2)' : s.status === 'rejected' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                        color: s.status === 'approved' ? 'var(--success-color)' : s.status === 'rejected' ? 'var(--danger-color)' : 'var(--text-dim)'
                      }}>
                        {s.status === 'approved' ? '¡APROBADA! ✅' : s.status === 'rejected' ? 'NO POR AHORA ❌' : 'EN REVISIÓN ⏳'}
                      </span>
                      {s.status === 'approved' && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--accent-color)', fontWeight: 600 }}>
                          ¡Pronto habrá novedades! 🚀
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Modal de Sugerencias (Opcional, lo mantenemos por si se activa desde otro lado) */}
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
                value={suggestionText}
                onChange={(e) => setSuggestionText(e.target.value)}
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
              <button 
                disabled={sending || !suggestionText.trim()}
                className="btn-primary" 
                style={{ width: '100%' }} 
                onClick={handleSuggestionSubmit}
              >
                {sending ? 'Enviando...' : 'Enviar Idea a Papá'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
