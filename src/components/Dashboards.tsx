'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { 
  Coins, 
  Trophy, 
  Gift,
  MessageSquarePlus,
  MessageCircle,
  Stethoscope,
  CheckCircle,
  XCircle,
  AlertCircle,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { 
  getPlayerStats, 
  getAvailableQuests, 
  getAvailableRewards, 
  requestQuestCompletion, 
  requestReward 
} from '@/app/actions/player';
import { createSuggestion, getMySuggestions } from '@/app/actions/suggestions';
import { sendMessage, getMessagesForFamily } from '@/app/actions/messages';

interface DashboardPlayer {
  id: string;
  name: string;
  role: string;
  balance: number;
  image?: string | null;
  familyId?: string | null;
}

interface DashboardQuest {
  id: string;
  title: string;
  reward: number;
  status?: string | null;
  isTherapy?: number | null;
}

interface DashboardReward {
  id: string;
  title: string;
  cost: number;
}

interface DashboardSuggestion {
  id: string;
  content: string;
  status: string | null;
  createdAt: Date | null;
}

interface DashboardsProps {
  initialData: {
    player: DashboardPlayer;
    quests: DashboardQuest[];
    rewards: DashboardReward[];
    mySuggestions: DashboardSuggestion[];
    messages?: any[];
  };
}

export function Dashboards({ initialData }: DashboardsProps) {
  const [player, setPlayer] = useState<DashboardPlayer>(initialData.player);
  const [quests, setQuests] = useState<DashboardQuest[]>(initialData.quests);
  const [rewards, setRewards] = useState<DashboardReward[]>(initialData.rewards);
  const [mySuggestions, setMySuggestions] = useState<DashboardSuggestion[]>(initialData.mySuggestions);
  const [messages, setMessages] = useState<any[]>(initialData.messages || []);
  const [suggestionText, setSuggestionText] = useState('');
  const [sending, setSending] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const fetchData = async () => {
    const stats = await getPlayerStats();
    const q = await getAvailableQuests();
    const r = await getAvailableRewards();
    const s = await getMySuggestions();
    const m = await getMessagesForFamily('children');
    setPlayer(stats as DashboardPlayer);
    setQuests(q as DashboardQuest[]);
    setRewards(r as DashboardReward[]);
    setMySuggestions(s as DashboardSuggestion[]);
    if (m.success) setMessages(m.data);
  };

  const handleSuggestionSubmit = async () => {
    if (!suggestionText.trim()) return;
    setSending(true);
    const res = await createSuggestion(suggestionText);
    if (res.success) {
      setSuggestionText('');
      setNotification({ message: '¡Tu idea ha sido enviada con éxito!', type: 'success' });
      fetchData();
    } else {
      setNotification({ message: 'Hubo un error al enviar tu idea', type: 'error' });
    }
    setSending(false);
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !player?.familyId) return;
    setReplying(true);
    const res = await sendMessage(player.familyId, replyText, 'professional');
    if (res.success) {
      setReplyText('');
      setNotification({ message: '¡Mensaje enviado!', type: 'success' });
      fetchData();
    } else {
      setNotification({ message: 'Hubo un error al enviar tu mensaje', type: 'error' });
    }
    setReplying(false);
  };

  if (player?.role === 'parent' || player?.role === 'professional' || player?.role === 'org_admin' || player?.role === 'super_admin') {
    const roleConfig: Record<string, { icon: string; title: string; desc: string; link: string }> = {
      parent: { icon: '🛡️', title: 'Hola, Capitán', desc: 'Gestiona tu equipo', link: '/admin' },
      professional: { icon: '🩺', title: 'Panel Profesional', desc: 'Gestiona tus pacientes', link: '/pro' },
      org_admin: { icon: '🏢', title: 'Panel Institucional', desc: 'Gestiona tu centro', link: '/institucion' },
      super_admin: { icon: '🌐', title: 'Super Admin', desc: 'Control Global', link: '/super-admin' }
    };
    const config = roleConfig[player.role] || roleConfig.parent;

    return (
      <div style={{ textAlign: 'center', paddingTop: '100px', minHeight: '100vh', background: '#020617', color: 'white' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>{config.icon}</div>
          <h1 style={{ fontSize: '3rem', fontWeight: 800 }}>{config.title} <span style={{ color: '#06b6d4' }}>{player.name}</span></h1>
          <p style={{ color: '#94a3b8', fontSize: '1.2rem', marginBottom: '40px' }}>{config.desc}</p>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
            <Link href={config.link} className="btn-primary">Ir al Panel de Control</Link>
            <button onClick={() => signOut()} className="glass">Cerrar sesión</button>
          </div>
        </motion.div>
        <style jsx>{`
          .btn-primary { background: #06b6d4; color: white; border: none; font-weight: 700; padding: 15px 30px; border-radius: 12px; text-decoration: none; }
          .glass { background: rgba(255,255,255,0.03); backdrop-filter: blur(10px); color: white; border: 1px solid rgba(255,255,255,0.1); padding: 15px 30px; border-radius: 12px; cursor: pointer; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="container" style={{ minHeight: '100vh', background: '#020617', color: 'white', paddingBottom: '100px' }}>
      <header className="dashboard-header">
        <div className="user-profile">
          <div className="user-avatar">{player?.image || '👤'}</div>
          <div>
            <h1 className="user-name">¡Hola, {player?.name}!</h1>
            <button onClick={() => signOut()} className="logout-btn">
              <LogOut size={14} /> Cerrar sesión
            </button>
          </div>
        </div>
        <div className="glass token-card">
          <div className="token-display"><Coins size={32} color="#f59e0b" /> {player?.balance || 0}</div>
        </div>
      </header>

      {/* Notificación */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 20, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            style={{
              position: 'fixed', top: '20px', left: '50%', zIndex: 1000,
              background: notification.type === 'success' ? '#10b981' : '#ef4444',
              color: 'white', padding: '12px 25px', borderRadius: '12px',
              display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600,
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
            }}
          >
            {notification.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
            {notification.message}
            <button 
              onClick={() => setNotification(null)}
              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', marginLeft: '10px', display: 'flex' }}
            >
              <AlertCircle size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="dashboard-grid">
        
        {/* Sección de Mensajes del Profesional */}
        <section style={{ gridColumn: '1 / -1' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#06b6d4' }}>
            <Stethoscope /> Chat con tu Dr/Coach
          </h2>
          <div className="glass" style={{ padding: '20px', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '400px', overflowY: 'auto', paddingRight: '10px' }}>
              {messages.length === 0 ? (
                <p style={{ color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>No hay mensajes aún. ¡Escríbele a tu coach!</p>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`chat-bubble ${msg.senderId === player?.id ? 'chat-bubble-mine' : 'chat-bubble-other'}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 600, color: msg.senderId === player?.id ? '#06b6d4' : 'white' }}>
                        {msg.senderId === player?.id ? 'Tú' : `Dr/Coach ${msg.senderName}`}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                        {new Date(msg.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5, color: '#e2e8f0', margin: 0, fontSize: '0.95rem' }}>{msg.content}</p>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handleReplySubmit} className="reply-form">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Escribe un mensaje para tu coach..."
                style={{ flex: 1, padding: '15px', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
              />
              <button type="submit" disabled={replying || !replyText.trim()} className="btn-primary reply-btn">
                <MessageCircle size={18} /> {replying ? 'Enviando...' : 'Enviar'}
              </button>
            </form>
          </div>
        </section>

        <section>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '25px' }}><Trophy color="#06b6d4" /> Misiones</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {quests.map((quest: DashboardQuest) => {
              const isTherapy = quest.isTherapy === 1;
              return (
              <div key={quest.id} className="glass action-card" style={{ borderLeft: isTherapy ? '6px solid #f43f5e' : '6px solid #06b6d4' }}>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isTherapy && <Stethoscope size={18} color="#f43f5e" />}
                    {quest.title}
                  </h3>
                  <div style={{ color: '#f59e0b', fontWeight: 700 }}>+{quest.reward} Tokens</div>
                </div>
                <button disabled={quest.status === 'pending_approval'} onClick={async () => { await requestQuestCompletion(quest.id); fetchData(); }} className="btn-primary action-btn" style={isTherapy ? { background: '#f43f5e' } : {}}>
                  {quest.status === 'pending_approval' ? 'Revisando...' : '¡Hecho!'}
                </button>
              </div>
            )})}
          </div>
        </section>
        <section>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '25px' }}><Gift color="#8b5cf6" /> Premios</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {rewards.map((reward: DashboardReward) => (
              <div key={reward.id} className="glass action-card" style={{ borderLeft: '6px solid #8b5cf6' }}>
                <div><h3 style={{ margin: '0 0 5px 0' }}>{reward.title}</h3><div style={{ color: '#f59e0b', fontWeight: 700 }}>{reward.cost} Tokens</div></div>
                <button disabled={player?.balance < reward.cost} onClick={async () => { await requestReward(reward.id); fetchData(); }} className="btn-primary action-btn" style={{ background: '#8b5cf6' }}>
                  Canjear
                </button>
              </div>
            ))}
          </div>
        </section>
        
        <section>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MessageSquarePlus color="#ec4899" /> Mis Ideas
          </h2>
          <div className="glass" style={{ padding: '20px', borderRadius: '20px', borderLeft: '6px solid #ec4899', marginBottom: '20px' }}>
            <textarea 
              value={suggestionText}
              onChange={(e) => setSuggestionText(e.target.value)}
              placeholder="¿Qué te gustaría ganar o hacer? Escribe tu idea aquí..."
              style={{ width: '100%', padding: '15px', borderRadius: '10px', background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', minHeight: '100px', marginBottom: '15px', resize: 'vertical' }}
            />
            <button disabled={sending || !suggestionText.trim()} onClick={handleSuggestionSubmit} className="btn-primary" style={{ background: '#ec4899', width: '100%' }}>
              {sending ? 'Enviando...' : 'Enviar Idea'}
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {mySuggestions?.map((sugg: DashboardSuggestion) => (
              <div key={sugg.id} className="glass" style={{ padding: '15px', borderRadius: '15px', borderLeft: '4px solid rgba(255,255,255,0.1)' }}>
                <p style={{ margin: '0 0 10px 0', fontWeight: 600 }}>{sugg.content}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#94a3b8' }}>
                  <span>Estado: {sugg.status === 'pending' ? '⏳ En revisión' : sugg.status === 'approved' ? '✅ Aprobada' : '❌ Rechazada'}</span>
                  <span>{sugg.createdAt ? new Date(sugg.createdAt).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
      <style jsx>{`
        .btn-primary { background: #06b6d4; color: white; border: none; font-weight: 700; padding: 10px 20px; border-radius: 50px; cursor: pointer; }
        .glass { background: rgba(255,255,255,0.03); backdrop-filter: blur(10px); }
        
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 40px 20px;
          gap: 20px;
        }
        .user-profile {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .user-avatar {
          width: 80px;
          height: 80px;
          background: rgba(255,255,255,0.05);
          border: 2px solid #06b6d4;
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 3rem;
        }
        .user-name {
          font-size: 2.2rem;
          font-weight: 700;
        }
        .logout-btn {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.2);
          padding: 8px 16px;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.8rem;
          margin-top: 5px;
          display: flex;
          align-items: center;
          gap: 8px;
          width: fit-content;
        }
        .token-card {
          padding: 15px 30px;
          border-radius: 25px;
          border: 2px solid #f59e0b;
        }
        .token-display {
          font-size: 2.5rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 40px;
          padding: 0 20px;
        }
        .action-card {
          padding: 20px;
          border-radius: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
        }
        .action-btn {
          padding: 8px 24px;
          border-radius: 12px;
          white-space: nowrap;
        }
        .chat-bubble {
          padding: 15px;
          border-radius: 15px;
        }
        .chat-bubble-mine {
          background: rgba(6, 182, 212, 0.1);
          border-left: 4px solid #06b6d4;
          margin-left: 40px;
          margin-right: 0;
        }
        .chat-bubble-other {
          background: rgba(255,255,255,0.05);
          border-left: 4px solid #94a3b8;
          margin-left: 0;
          margin-right: 40px;
        }
        .reply-form {
          display: flex;
          gap: 10px;
          border-top: 1px solid rgba(255,255,255,0.1);
          padding-top: 20px;
        }
        .reply-btn {
          padding: 0 25px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        @media (max-width: 768px) {
          .dashboard-header {
            flex-direction: column;
            padding: 30px 15px;
            text-align: center;
          }
          .user-profile {
            flex-direction: column;
            gap: 10px;
          }
          .user-name {
            font-size: 1.8rem;
          }
          .logout-btn {
            text-align: center;
            width: 100%;
          }
          .token-card {
            width: 100%;
            display: flex;
            justify-content: center;
            box-sizing: border-box;
          }
          .dashboard-grid {
            grid-template-columns: 1fr;
            gap: 25px;
            padding: 0 15px;
          }
          .action-card {
            flex-direction: column;
            align-items: stretch;
            text-align: center;
          }
          .action-btn {
            width: 100%;
          }
          .chat-bubble-mine {
            margin-left: 10px;
          }
          .chat-bubble-other {
            margin-right: 10px;
          }
          .reply-form {
            flex-direction: column;
          }
          .reply-btn {
            width: 100%;
            justify-content: center;
            padding: 15px;
          }
        }
      `}</style>
    </div>
  );
}
