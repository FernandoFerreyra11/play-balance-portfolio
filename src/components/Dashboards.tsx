'use client';

import { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { 
  Coins, 
  Trophy, 
  LogOut, 
  CheckCircle2, 
  Settings,
  Gift,
  Clock,
  Sparkles,
  MessageSquarePlus
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  getPlayerStats, 
  getAvailableQuests, 
  getAvailableRewards, 
  requestQuestCompletion, 
  requestReward 
} from '@/app/actions/player';
import { createSuggestion, getMySuggestions } from '@/app/actions/suggestions';

export function Dashboards({ initialData }: any) {
  const [player, setPlayer] = useState(initialData.player);
  const [quests, setQuests] = useState(initialData.quests);
  const [rewards, setRewards] = useState(initialData.rewards);
  const [mySuggestions, setMySuggestions] = useState(initialData.mySuggestions);
  const [suggestionText, setSuggestionText] = useState('');
  const [sending, setSending] = useState(false);

  const fetchData = async () => {
    const stats = await getPlayerStats();
    const q = await getAvailableQuests();
    const r = await getAvailableRewards();
    const s = await getMySuggestions();
    setPlayer(stats);
    setQuests(q);
    setRewards(r);
    setMySuggestions(s);
  };

  const handleSuggestionSubmit = async () => {
    if (!suggestionText.trim()) return;
    setSending(true);
    const res = await createSuggestion(suggestionText);
    if (res.success) {
      setSuggestionText('');
      fetchData();
    }
    setSending(false);
  };

  if (player?.role === 'parent' || player?.role === 'professional' || player?.role === 'org_admin' || player?.role === 'super_admin') {
    const roleConfig: any = {
      parent: { icon: '🛡️', title: 'Hola, Capitán', desc: 'Gestiona tu equipo', link: '/admin' },
      professional: { icon: '🩺', title: 'Panel Profesional', desc: 'Gestiona tus pacientes', link: '/pro' },
      org_admin: { icon: '🏢', title: 'Panel Institucional', desc: 'Gestiona tu centro', link: '/institucion' },
      super_admin: { icon: '🌐', title: 'Super Admin', desc: 'Control Global', link: '/super-admin' }
    };
    const config = roleConfig[player.role as string] || roleConfig.parent;

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
            <button onClick={() => signOut()} className="logout-btn">Salir</button>
          </div>
        </div>
        <div className="glass token-card">
          <div className="token-display"><Coins size={32} color="#f59e0b" /> {player?.balance || 0}</div>
        </div>
      </header>

      <div className="dashboard-grid">
        <section>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '25px' }}><Trophy color="#06b6d4" /> Misiones</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {quests.map((quest: any) => (
              <div key={quest.id} className="glass" style={{ padding: '20px', borderRadius: '20px', borderLeft: '6px solid #06b6d4', display: 'flex', justifyContent: 'space-between' }}>
                <div><h3>{quest.title}</h3><div style={{ color: '#f59e0b' }}>+{quest.reward} Tokens</div></div>
                <button disabled={quest.status === 'pending_approval'} onClick={async () => { await requestQuestCompletion(quest.id); fetchData(); }} className="btn-primary">{quest.status === 'pending_approval' ? 'Revisando' : '¡Hecho!'}</button>
              </div>
            ))}
          </div>
        </section>
        <section>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '25px' }}><Gift color="#8b5cf6" /> Premios</h2>
          {/* ... similar a misiones ... */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {rewards.map((reward: any) => (
              <div key={reward.id} className="glass" style={{ padding: '20px', borderRadius: '20px', borderLeft: '6px solid #8b5cf6', display: 'flex', justifyContent: 'space-between' }}>
                <div><h3>{reward.title}</h3><div style={{ color: '#f59e0b' }}>{reward.cost} tokens</div></div>
                <button disabled={player?.balance < reward.cost} onClick={async () => { await requestReward(reward.id); fetchData(); }} className="btn-primary" style={{ background: '#8b5cf6' }}>Canjear</button>
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
            {mySuggestions?.map((sugg: any) => (
              <div key={sugg.id} className="glass" style={{ padding: '15px', borderRadius: '15px', borderLeft: '4px solid rgba(255,255,255,0.1)' }}>
                <p style={{ margin: '0 0 10px 0', fontWeight: 600 }}>{sugg.content}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#94a3b8' }}>
                  <span>Estado: {sugg.status === 'pending' ? '⏳ En revisión' : sugg.status === 'approved' ? '✅ Aprobada' : '❌ Rechazada'}</span>
                  <span>{new Date(sugg.createdAt).toLocaleDateString()}</span>
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
          background: none;
          border: none;
          color: #ef4444;
          cursor: pointer;
          font-size: 1rem;
          text-align: left;
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
        }
      `}</style>
    </div>
  );
}
