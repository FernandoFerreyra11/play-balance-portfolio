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
  LogOut,
  Flame,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { 
  getPlayerStats, 
  getAvailableQuests, 
  getAvailableRewards, 
  requestQuestCompletion, 
  requestReward,
  getPendingRewardClaimsForChild
} from '@/app/actions/player';
import { createSuggestion, getMySuggestions } from '@/app/actions/suggestions';
import { sendMessage, getMessagesForFamily } from '@/app/actions/messages';
import { AvatarSelector } from '@/components/AvatarSelector';
import { updatePlayerAvatar } from '@/app/actions/player';
import { submitBodyCheckin, submitMoodCheckin, getTodayCheckin, getTodayMoodCheckin, getStreakInfo } from '@/app/actions/checkin';
import { getAvailableRoutines, getTodayRoutineProgress, startRoutine, completeRoutineStep } from '@/app/actions/routines';
import Image from 'next/image';

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
  category?: string | null;
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

interface DashboardPendingReward {
  id: string;
  rewardId: string;
  rewardTitle: string;
  rewardCost: number;
  status: string | null;
  createdAt: Date | null;
}

interface BodyCheckin {
  id: string;
  eyes: string;
  neck: string;
  head: string;
  createdAt: Date | null;
}

interface MoodCheckin {
  id: string;
  mood: string;
  energy: string;
  note: string | null;
  createdAt: Date | null;
}

interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastCheckinDate: string | null;
  isActive: boolean;
}

interface RoutineStep {
  order: number;
  title: string;
  icon: string;
  tokens: number;
}

interface RoutineData {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  totalTokens: number;
  steps: string; // JSON string
  status: string | null;
}

interface RoutineCompletion {
  id: string;
  routineId: string;
  stepsCompleted: number | null;
  totalSteps: number;
  completed: number | null;
}

interface DashboardsProps {
  initialData: {
    player: DashboardPlayer;
    quests: DashboardQuest[];
    rewards: DashboardReward[];
    pendingRewards: DashboardPendingReward[];
    mySuggestions: DashboardSuggestion[];
    messages?: any[];
    hasProfessional?: boolean;
    todayCheckin?: BodyCheckin | null;
    todayMoodCheckin?: MoodCheckin | null;
    streakInfo?: StreakInfo | null;
    availableRoutines?: RoutineData[];
    todayRoutineProgress?: RoutineCompletion[];
  };
}

// Mood options with colors
const MOOD_OPTIONS = [
  { val: 'happy', label: '😄', name: 'Feliz', color: '#22c55e', bg: 'rgba(34,197,94,0.15)' },
  { val: 'calm', label: '😌', name: 'Tranqui', color: '#06b6d4', bg: 'rgba(6,182,212,0.15)' },
  { val: 'neutral', label: '😐', name: 'Normal', color: '#94a3b8', bg: 'rgba(148,163,184,0.15)' },
  { val: 'sad', label: '😢', name: 'Triste', color: '#6366f1', bg: 'rgba(99,102,241,0.15)' },
  { val: 'anxious', label: '😰', name: 'Ansioso', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  { val: 'angry', label: '😠', name: 'Enojado', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
];

const ENERGY_OPTIONS = [
  { val: 'low', label: '🔋', name: 'Baja', color: '#ef4444', width: '33%' },
  { val: 'medium', label: '🔋🔋', name: 'Media', color: '#f59e0b', width: '66%' },
  { val: 'high', label: '🔋🔋🔋', name: 'Alta', color: '#22c55e', width: '100%' },
];

export function Dashboards({ initialData }: DashboardsProps) {
  const [player, setPlayer] = useState<DashboardPlayer>(initialData.player);
  const [quests, setQuests] = useState<DashboardQuest[]>(initialData.quests);
  const [rewards, setRewards] = useState<DashboardReward[]>(initialData.rewards);
  const [pendingRewards, setPendingRewards] = useState<DashboardPendingReward[]>(initialData.pendingRewards);
  const [mySuggestions, setMySuggestions] = useState<DashboardSuggestion[]>(initialData.mySuggestions);
  const [messages, setMessages] = useState<any[]>(initialData.messages || []);
  const [suggestionText, setSuggestionText] = useState('');
  const [sending, setSending] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [isAvatarSelectorOpen, setIsAvatarSelectorOpen] = useState(false);

  // Check-in state — unified 2-step flow
  const [bodyCheckinDone, setBodyCheckinDone] = useState<boolean>(!!initialData.todayCheckin);
  const [moodCheckinDone, setMoodCheckinDone] = useState<boolean>(!!initialData.todayMoodCheckin);
  const [checkinStep, setCheckinStep] = useState<'idle' | 'body' | 'mood' | 'done'>(
    initialData.todayCheckin && initialData.todayMoodCheckin ? 'done'
    : initialData.todayCheckin && !initialData.todayMoodCheckin ? 'mood' // body done, mood pending
    : 'idle'
  );
  const [checkinAnswers, setCheckinAnswers] = useState<{ eyes: string; neck: string; head: string }>({
    eyes: '', neck: '', head: ''
  });
  const [moodAnswers, setMoodAnswers] = useState<{ mood: string; energy: string; note: string }>({
    mood: '', energy: '', note: ''
  });
  const [checkinSending, setCheckinSending] = useState(false);

  // Streak state
  const [streakInfo, setStreakInfo] = useState<StreakInfo | null>(initialData.streakInfo || null);

  // Routines state
  const [routines, setRoutinesState] = useState<RoutineData[]>(initialData.availableRoutines || []);
  const [routineProgress, setRoutineProgress] = useState<RoutineCompletion[]>(initialData.todayRoutineProgress || []);
  const [routineLoading, setRoutineLoading] = useState<string | null>(null);

  const handleAvatarSelect = async (avatarUrl: string) => {
    setPlayer(prev => prev ? { ...prev, image: avatarUrl } : prev);
    setIsAvatarSelectorOpen(false);
    const res = await updatePlayerAvatar(avatarUrl);
    if (!res.success) {
      setNotification({ message: 'Error al guardar tu insignia', type: 'error' });
    }
  };

  const fetchData = async () => {
    const stats = await getPlayerStats();
    const q = await getAvailableQuests();
    const r = await getAvailableRewards();
    const pr = await getPendingRewardClaimsForChild();
    const s = await getMySuggestions();
    const m = await getMessagesForFamily('children');
    const si = await getStreakInfo();
    const rt = await getAvailableRoutines();
    const rp = await getTodayRoutineProgress();
    setPlayer(stats as DashboardPlayer);
    setQuests(q as DashboardQuest[]);
    setRewards(r as DashboardReward[]);
    setPendingRewards(pr as DashboardPendingReward[]);
    setMySuggestions(s as DashboardSuggestion[]);
    if (m.success) setMessages(m.data);
    setStreakInfo(si as StreakInfo | null);
    setRoutinesState(rt as RoutineData[]);
    setRoutineProgress(rp as RoutineCompletion[]);
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

  // Body check-in submit
  const handleBodyCheckinSubmit = async () => {
    if (!checkinAnswers.eyes || !checkinAnswers.neck || !checkinAnswers.head) return;
    setCheckinSending(true);
    const res = await submitBodyCheckin(checkinAnswers.eyes, checkinAnswers.neck, checkinAnswers.head);
    setCheckinSending(false);
    if (res.success) {
      setBodyCheckinDone(true);
      if (res.streakBonus && res.streakBonus > 0) {
        setNotification({ message: `🔥🎉 ¡Racha de ${res.currentStreak} días! Ganaste ${res.streakBonus} tokens bonus`, type: 'success' });
      } else {
        setNotification({ message: `¡Check-in corporal completado! +${res.tokensEarned} tokens 🌿`, type: 'success' });
      }
      setCheckinStep('mood'); // Move to mood step
      if (res.currentStreak) {
        setStreakInfo(prev => prev ? { ...prev, currentStreak: res.currentStreak!, isActive: true } : prev);
      }
      fetchData();
    } else {
      setNotification({ message: res.error || 'Error al guardar', type: 'error' });
    }
  };

  // Mood check-in submit
  const handleMoodCheckinSubmit = async () => {
    if (!moodAnswers.mood || !moodAnswers.energy) return;
    setCheckinSending(true);
    const res = await submitMoodCheckin(moodAnswers.mood, moodAnswers.energy, moodAnswers.note || undefined);
    setCheckinSending(false);
    if (res.success) {
      setMoodCheckinDone(true);
      setCheckinStep('done');
      const totalTokens = (bodyCheckinDone ? 10 : 0) + (res.tokensEarned || 5);
      setNotification({ message: `¡Check-in completo! Ganaste ${res.tokensEarned} tokens 🧠`, type: 'success' });
      if (res.currentStreak) {
        setStreakInfo(prev => prev ? { ...prev, currentStreak: res.currentStreak!, isActive: true } : prev);
      }
      fetchData();
    } else {
      setNotification({ message: res.error || 'Error al guardar', type: 'error' });
    }
  };

  // Routine handlers
  const handleStartRoutine = async (routineId: string) => {
    setRoutineLoading(routineId);
    const res = await startRoutine(routineId);
    setRoutineLoading(null);
    if (res.success) {
      fetchData();
    } else {
      setNotification({ message: res.error || 'Error al iniciar rutina', type: 'error' });
    }
  };

  const handleCompleteStep = async (completionId: string) => {
    setRoutineLoading(completionId);
    const res = await completeRoutineStep(completionId);
    setRoutineLoading(null);
    if (res.success) {
      if (res.isComplete) {
        setNotification({ message: `🎉 ¡Rutina completada! Ganaste ${res.tokensEarned} tokens en este paso`, type: 'success' });
      } else {
        setNotification({ message: `+${res.tokensEarned} tokens ✨ Paso completado`, type: 'success' });
      }
      fetchData();
    } else {
      setNotification({ message: res.error || 'Error al completar paso', type: 'error' });
    }
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
          <div 
            className="user-avatar" 
            onClick={() => setIsAvatarSelectorOpen(true)}
            style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
            title="Cambiar Insignia"
          >
            {player?.image?.startsWith('/avatars/') ? (
              <Image src={player.image} alt="Avatar" fill style={{ objectFit: 'cover' }} />
            ) : (
              player?.image || '👤'
            )}
            <div className="avatar-edit-overlay">
              <span style={{ fontSize: '12px' }}>✏️</span>
            </div>
          </div>
          <div>
            <h1 className="user-name">¡Hola, {player?.name}!</h1>
            <button onClick={() => signOut()} className="logout-btn">
              <LogOut size={14} /> Cerrar sesión
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Streak Badge */}
          <motion.div
            className="glass streak-badge"
            animate={streakInfo && streakInfo.currentStreak >= 7 ? { scale: [1, 1.05, 1] } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
            title={`Racha más larga: ${streakInfo?.longestStreak || 0} días`}
          >
            <Flame size={20} color={streakInfo?.isActive ? '#f97316' : '#94a3b8'} />
            <span style={{ 
              fontWeight: 800, 
              fontSize: '1.2rem',
              color: streakInfo?.isActive ? '#f97316' : '#94a3b8'
            }}>
              {streakInfo?.currentStreak || 0}
            </span>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>días</span>
          </motion.div>
          {/* Token Balance */}
          <div className="glass token-card">
            <div className="token-display"><Coins size={32} color="#f59e0b" /> {player?.balance || 0}</div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isAvatarSelectorOpen && (
          <AvatarSelector 
            currentAvatar={player?.image || null}
            onSelect={handleAvatarSelect}
            onClose={() => setIsAvatarSelectorOpen(false)}
          />
        )}
      </AnimatePresence>

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
        {initialData.hasProfessional && (
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
        )}

        <section>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '25px' }}><Trophy color="#06b6d4" /> Misiones</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {quests.map((quest: DashboardQuest) => {
              const isTherapy = quest.isTherapy === 1;
              const isJomo = quest.category === 'jomo';
              const borderColor = isTherapy ? '#f43f5e' : isJomo ? '#22c55e' : '#06b6d4';
              return (
              <div key={quest.id} className="glass action-card" style={{ borderLeft: `6px solid ${borderColor}`, background: isJomo ? 'rgba(34,197,94,0.04)' : undefined }}>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isTherapy && <Stethoscope size={18} color="#f43f5e" />}
                    {isJomo && <span style={{ fontSize: '1rem' }}>🌿</span>}
                    {quest.title}
                  </h3>
                  {isJomo && (
                    <p style={{ fontSize: '0.75rem', color: '#22c55e', margin: '0 0 4px 0', fontWeight: 600 }}>OFFLINE · ¡Sin pantallas, conectás con lo que importa!</p>
                  )}
                  <div style={{ color: '#f59e0b', fontWeight: 700 }}>+{quest.reward} Tokens</div>
                </div>
                <button 
                  disabled={quest.status === 'pending_approval'} 
                  onClick={async () => { 
                    const res = await requestQuestCompletion(quest.id); 
                    if (res.error) alert(res.error); 
                    fetchData(); 
                  }} 
                  className="btn-primary action-btn" 
                  style={isTherapy ? { background: '#f43f5e' } : isJomo ? { background: '#22c55e' } : {}}
                >
                  {quest.status === 'pending_approval' ? 'Revisando...' : '¡Hecho!'}
                </button>
              </div>
            )})}
          </div>
        </section>
        <section>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '25px' }}><Gift color="#8b5cf6" /> Premios</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {rewards.map((reward: DashboardReward) => {
              const isPending = pendingRewards?.some(pr => pr.rewardId === reward.id);
              return (
              <div key={reward.id} className="glass action-card" style={{ borderLeft: '6px solid #8b5cf6' }}>
                <div><h3 style={{ margin: '0 0 5px 0' }}>{reward.title}</h3><div style={{ color: '#f59e0b', fontWeight: 700 }}>{reward.cost} Tokens</div></div>
                <button 
                  disabled={isPending} 
                  onClick={async () => { 
                    const res = await requestReward(reward.id); 
                    if (res?.error) alert(res.error); 
                    fetchData(); 
                  }} 
                  className="btn-primary action-btn" 
                  style={{ background: isPending ? 'rgba(139, 92, 246, 0.5)' : '#8b5cf6', cursor: isPending ? 'not-allowed' : 'pointer' }}
                >
                  {isPending ? '⏳ Solicitado' : 'Canjear'}
                </button>
              </div>
            )})}
          </div>
        </section>
        
        <section>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Gift color="#f59e0b" /> Mis Canjes Pendientes
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {pendingRewards?.length === 0 ? (
              <div className="glass" style={{ padding: '20px', borderRadius: '15px', textAlign: 'center', color: '#94a3b8' }}>
                No tienes premios pendientes de aprobación.
              </div>
            ) : (
              pendingRewards?.map((pr: DashboardPendingReward) => (
                <div key={pr.id} className="glass" style={{ padding: '15px', borderRadius: '15px', borderLeft: '4px solid #f59e0b' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: '0 0 5px 0' }}>{pr.rewardTitle}</h3>
                    <div style={{ padding: '5px 10px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', fontSize: '0.8rem', fontWeight: 700 }}>
                      ⏳ En revisión
                    </div>
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                    Costo: {pr.rewardCost} Tokens
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* === CHECK-IN UNIFICADO (Body + Mood) === */}
        <section style={{ gridColumn: '1 / -1' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            🧠 ¿Cómo te sentís hoy?
          </h2>
          <p style={{ color: '#94a3b8', marginBottom: '20px', fontSize: '0.95rem' }}>
            Registrá cómo está tu cuerpo y tu ánimo. Ganá hasta <span style={{ color: '#f59e0b', fontWeight: 700 }}>15 tokens</span> (10 corporal + 5 emocional).
          </p>

          {checkinStep === 'done' || (bodyCheckinDone && moodCheckinDone) ? (
            <div className="glass" style={{ padding: '30px', borderRadius: '20px', textAlign: 'center', borderLeft: '6px solid #22c55e' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🌙</div>
              <p style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '4px' }}>¡Ya registraste cómo te sentís hoy!</p>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Volvé mañana para tu próximo check-in.</p>
              {streakInfo && streakInfo.currentStreak > 0 && (
                <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center' }}>
                  <Flame size={18} color="#f97316" />
                  <span style={{ color: '#f97316', fontWeight: 700 }}>Racha: {streakInfo.currentStreak} días</span>
                </div>
              )}
            </div>
          ) : checkinStep === 'idle' ? (
            <div className="glass" style={{ padding: '30px', borderRadius: '20px', textAlign: 'center', borderLeft: '6px solid #8b5cf6' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '15px' }}>👋</div>
              <p style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '20px' }}>¡Tomate un momento para escuchar tu cuerpo y tu mente!</p>
              <button
                onClick={() => setCheckinStep('body')}
                className="btn-primary"
                style={{ background: '#8b5cf6', padding: '12px 40px', fontSize: '1rem' }}
              >
                Comenzar Check-in 🌿
              </button>
            </div>
          ) : checkinStep === 'body' ? (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass"
              style={{ padding: '25px', borderRadius: '20px', borderLeft: '6px solid #8b5cf6' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ color: '#8b5cf6', margin: 0 }}>Paso 1/2 — Tu cuerpo</h3>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', background: 'rgba(139,92,246,0.1)', padding: '4px 12px', borderRadius: '20px' }}>+10 tokens</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                <div>
                  <p style={{ fontWeight: 700, marginBottom: '12px', fontSize: '1rem' }}>👁️ ¿Cómo están tus ojos?</p>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {[{val:'tired',label:'😴 Cansados'},{val:'normal',label:'😐 Normal'},{val:'good',label:'😊 Bien'}].map(opt => (
                      <button key={opt.val} onClick={() => setCheckinAnswers(p => ({...p, eyes: opt.val}))}
                        style={{ padding: '10px 18px', borderRadius: '12px', border: `2px solid ${checkinAnswers.eyes === opt.val ? '#8b5cf6' : 'rgba(255,255,255,0.1)'}`, background: checkinAnswers.eyes === opt.val ? 'rgba(139,92,246,0.2)' : 'transparent', color: 'white', cursor: 'pointer', fontWeight: checkinAnswers.eyes === opt.val ? 700 : 400, fontSize: '0.95rem', transition: 'all 0.15s' }}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p style={{ fontWeight: 700, marginBottom: '12px', fontSize: '1rem' }}>🦒 ¿Cómo está tu cuello/espalda?</p>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {[{val:'tense',label:'😖 Con tensión'},{val:'normal',label:'😐 Normal'},{val:'good',label:'😊 Bien'}].map(opt => (
                      <button key={opt.val} onClick={() => setCheckinAnswers(p => ({...p, neck: opt.val}))}
                        style={{ padding: '10px 18px', borderRadius: '12px', border: `2px solid ${checkinAnswers.neck === opt.val ? '#8b5cf6' : 'rgba(255,255,255,0.1)'}`, background: checkinAnswers.neck === opt.val ? 'rgba(139,92,246,0.2)' : 'transparent', color: 'white', cursor: 'pointer', fontWeight: checkinAnswers.neck === opt.val ? 700 : 400, fontSize: '0.95rem', transition: 'all 0.15s' }}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p style={{ fontWeight: 700, marginBottom: '12px', fontSize: '1rem' }}>🧠 ¿Cómo está tu cabeza?</p>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {[{val:'dizzy',label:'😵 Mareada'},{val:'normal',label:'😐 Normal'},{val:'clear',label:'😊 Despejada'}].map(opt => (
                      <button key={opt.val} onClick={() => setCheckinAnswers(p => ({...p, head: opt.val}))}
                        style={{ padding: '10px 18px', borderRadius: '12px', border: `2px solid ${checkinAnswers.head === opt.val ? '#8b5cf6' : 'rgba(255,255,255,0.1)'}`, background: checkinAnswers.head === opt.val ? 'rgba(139,92,246,0.2)' : 'transparent', color: 'white', cursor: 'pointer', fontWeight: checkinAnswers.head === opt.val ? 700 : 400, fontSize: '0.95rem', transition: 'all 0.15s' }}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  disabled={!checkinAnswers.eyes || !checkinAnswers.neck || !checkinAnswers.head || checkinSending}
                  onClick={handleBodyCheckinSubmit}
                  className="btn-primary"
                  style={{ background: '#8b5cf6', padding: '14px', fontSize: '1rem', opacity: (!checkinAnswers.eyes || !checkinAnswers.neck || !checkinAnswers.head) ? 0.5 : 1 }}
                >
                  {checkinSending ? 'Guardando...' : 'Siguiente → Check-in Emocional'}
                </button>
              </div>
            </motion.div>
          ) : checkinStep === 'mood' ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass"
              style={{ padding: '25px', borderRadius: '20px', borderLeft: '6px solid #06b6d4' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ color: '#06b6d4', margin: 0 }}>Paso 2/2 — Tu ánimo</h3>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', background: 'rgba(6,182,212,0.1)', padding: '4px 12px', borderRadius: '20px' }}>+5 tokens</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                {/* Mood selector */}
                <div>
                  <p style={{ fontWeight: 700, marginBottom: '12px', fontSize: '1rem' }}>¿Cómo te sentís?</p>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {MOOD_OPTIONS.map(opt => (
                      <motion.button
                        key={opt.val}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setMoodAnswers(p => ({...p, mood: opt.val}))}
                        style={{
                          padding: '12px 16px',
                          borderRadius: '16px',
                          border: `2px solid ${moodAnswers.mood === opt.val ? opt.color : 'rgba(255,255,255,0.1)'}`,
                          background: moodAnswers.mood === opt.val ? opt.bg : 'transparent',
                          color: 'white',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '4px',
                          minWidth: '70px',
                        }}
                      >
                        <span style={{ fontSize: '1.8rem' }}>{opt.label}</span>
                        <span style={{ fontSize: '0.7rem', fontWeight: moodAnswers.mood === opt.val ? 700 : 400, color: moodAnswers.mood === opt.val ? opt.color : '#94a3b8' }}>{opt.name}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Energy selector */}
                <div>
                  <p style={{ fontWeight: 700, marginBottom: '12px', fontSize: '1rem' }}>¿Cuánta energía tenés?</p>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {ENERGY_OPTIONS.map(opt => (
                      <button
                        key={opt.val}
                        onClick={() => setMoodAnswers(p => ({...p, energy: opt.val}))}
                        style={{
                          padding: '10px 20px',
                          borderRadius: '12px',
                          border: `2px solid ${moodAnswers.energy === opt.val ? opt.color : 'rgba(255,255,255,0.1)'}`,
                          background: moodAnswers.energy === opt.val ? `${opt.color}22` : 'transparent',
                          color: moodAnswers.energy === opt.val ? opt.color : 'white',
                          cursor: 'pointer',
                          fontWeight: moodAnswers.energy === opt.val ? 700 : 400,
                          fontSize: '0.95rem',
                          transition: 'all 0.15s',
                        }}
                      >
                        {opt.label} {opt.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reflection note */}
                <div>
                  <p style={{ fontWeight: 700, marginBottom: '12px', fontSize: '1rem' }}>
                    <Sparkles size={16} style={{ display: 'inline', marginRight: '6px' }} />
                    ¿Qué aprendiste o lograste hoy? ¿Qué hiciste o planificaste hacer que te hizo sentir bien hoy?
                  </p>
                  <textarea
                    value={moodAnswers.note}
                    onChange={(e) => setMoodAnswers(p => ({...p, note: e.target.value.slice(0, 200)}))}
                    placeholder="Contanos... (opcional, máx 200 caracteres)"
                    maxLength={200}
                    style={{
                      width: '100%', padding: '15px', borderRadius: '12px',
                      background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)',
                      color: 'white', minHeight: '80px', resize: 'vertical', fontSize: '0.95rem'
                    }}
                  />
                  <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                    {moodAnswers.note.length}/200
                  </div>
                </div>

                <button
                  disabled={!moodAnswers.mood || !moodAnswers.energy || checkinSending}
                  onClick={handleMoodCheckinSubmit}
                  className="btn-primary"
                  style={{ background: '#06b6d4', padding: '14px', fontSize: '1rem', opacity: (!moodAnswers.mood || !moodAnswers.energy) ? 0.5 : 1 }}
                >
                  {checkinSending ? 'Guardando...' : '✅ Enviar Check-in Emocional'}
                </button>
              </div>
            </motion.div>
          ) : null}
        </section>

        {/* === RUTINAS DE DESCONEXIÓN === */}
        {routines.length > 0 && (
        <section style={{ gridColumn: '1 / -1' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            🌅 Rutinas
          </h2>
          <p style={{ color: '#94a3b8', marginBottom: '20px', fontSize: '0.95rem' }}>
            Completá cada paso y ganá tokens. Una vez por día.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {routines.map((routine) => {
              const steps: RoutineStep[] = JSON.parse(routine.steps);
              const todayCompletion = routineProgress.find(rp => rp.routineId === routine.id);
              const isCompleted = todayCompletion?.completed === 1;
              const stepsCompleted = todayCompletion?.stepsCompleted || 0;
              const hasStarted = !!todayCompletion;
              const progress = hasStarted ? (stepsCompleted / steps.length) * 100 : 0;

              return (
                <motion.div
                  key={routine.id}
                  className="glass"
                  style={{ padding: '25px', borderRadius: '20px', borderLeft: `6px solid ${isCompleted ? '#22c55e' : '#f59e0b'}` }}
                  layout
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: hasStarted ? '20px' : '0' }}>
                    <div>
                      <h3 style={{ margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.3rem' }}>{routine.icon}</span>
                        {routine.title}
                      </h3>
                      {routine.description && (
                        <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>{routine.description}</p>
                      )}
                      <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: '0.85rem', marginTop: '4px' }}>
                        {steps.length} pasos · {routine.totalTokens} tokens
                      </div>
                    </div>
                    {!hasStarted && (
                      <button
                        onClick={() => handleStartRoutine(routine.id)}
                        disabled={routineLoading === routine.id}
                        className="btn-primary"
                        style={{ background: '#f59e0b', color: '#000', padding: '10px 20px', fontWeight: 700, whiteSpace: 'nowrap' }}
                      >
                        {routineLoading === routine.id ? '...' : 'Comenzar →'}
                      </button>
                    )}
                    {isCompleted && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#22c55e', fontWeight: 700 }}>
                        <CheckCircle size={20} /> ¡Completada!
                      </div>
                    )}
                  </div>

                  {/* Progress bar */}
                  {hasStarted && (
                    <>
                      <div style={{ 
                        width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', 
                        borderRadius: '3px', overflow: 'hidden', marginBottom: '15px' 
                      }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                          style={{ height: '100%', background: isCompleted ? '#22c55e' : '#f59e0b', borderRadius: '3px' }}
                        />
                      </div>

                      {/* Steps */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {steps.map((step, idx) => {
                          const isDone = idx < stepsCompleted;
                          const isCurrent = idx === stepsCompleted && !isCompleted;
                          return (
                            <motion.div
                              key={idx}
                              initial={isDone ? { opacity: 1 } : { opacity: 0.6 }}
                              animate={{ opacity: isDone || isCurrent ? 1 : 0.4 }}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '12px',
                                padding: '10px 15px', borderRadius: '12px',
                                background: isDone ? 'rgba(34,197,94,0.08)' : isCurrent ? 'rgba(245,158,11,0.08)' : 'transparent',
                                border: isCurrent ? '1px solid rgba(245,158,11,0.3)' : '1px solid transparent',
                              }}
                            >
                              <span style={{ fontSize: '1.2rem', width: '30px', textAlign: 'center' }}>
                                {isDone ? '✅' : isCurrent ? '→' : '○'}
                              </span>
                              <span style={{ fontSize: '1.1rem', marginRight: '4px' }}>{step.icon}</span>
                              <span style={{ flex: 1, fontWeight: isDone ? 400 : isCurrent ? 700 : 400, textDecoration: isDone ? 'line-through' : 'none', color: isDone ? '#94a3b8' : 'white' }}>
                                {step.title}
                              </span>
                              <span style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 600 }}>
                                +{step.tokens} 🪙
                              </span>
                              {isCurrent && todayCompletion && (
                                <button
                                  onClick={() => handleCompleteStep(todayCompletion.id)}
                                  disabled={routineLoading === todayCompletion.id}
                                  className="btn-primary"
                                  style={{ padding: '6px 16px', fontSize: '0.85rem', background: '#f59e0b', color: '#000', whiteSpace: 'nowrap' }}
                                >
                                  {routineLoading === todayCompletion.id ? '...' : '¡Hecho!'}
                                </button>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </motion.div>
              );
            })}
          </div>
        </section>
        )}

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
          border-radius: 24px;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 3rem;
        }
        .user-avatar:hover .avatar-edit-overlay {
          opacity: 1;
        }
        .avatar-edit-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(0,0,0,0.6);
          height: 30%;
          display: flex;
          justify-content: center;
          align-items: center;
          opacity: 0;
          transition: opacity 0.2s ease;
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
        .streak-badge {
          padding: 10px 16px;
          border-radius: 16px;
          border: 1px solid rgba(249, 115, 22, 0.3);
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(249, 115, 22, 0.05) !important;
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
            width: fit-content;
            margin: 5px auto 0;
            justify-content: center;
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
