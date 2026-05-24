'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { 
  Plus, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Trophy, 
  Gift, 
  MessageSquare,
  ArrowLeft,
  LogOut,
  Users,
  Coins,
  Pencil,
  X,
  Clock,
  MessageSquarePlus,
  BarChart3,
  AlertTriangle,
  Send,
  Stethoscope,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import UpgradeModal from '@/components/UpgradeModal';
import { getFamilyMembers, createFamilyMember, updateFamilyMember, deleteFamilyMember, getFamilyDetail, deleteOwnFamily } from '../actions/family';
import { getQuests, createQuest, deleteQuest, updateQuest } from '../actions/quests';
import { getRewards, createReward, updateReward, deleteReward } from '../actions/rewards';
import { getPendingApprovals, approveQuest, rejectQuest, getPendingRewardApprovals, approveRewardClaim, rejectRewardClaim } from '../actions/approvals';
import { getSuggestions, updateSuggestionStatus } from '../actions/suggestions';
import { getFamilyStats, awardSpontaneousTokens } from '../actions/player';
import { getMessagesForFamily, sendMessage, markMyMessagesAsRead } from '../actions/messages';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('family');
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingSuggestionsCount, setPendingSuggestionsCount] = useState(0);
  const [unreadProMessagesCount, setUnreadProMessagesCount] = useState(0);

  const fetchPendingCounts = useCallback(async () => {
    const [approvalsData, rewardsData, suggestionsData, messagesData] = await Promise.all([
      getPendingApprovals(),
      getPendingRewardApprovals(),
      getSuggestions(),
      getMessagesForFamily('all')
    ]);
    setPendingCount((approvalsData as any[]).length + (rewardsData as any[]).length);
    setPendingSuggestionsCount((suggestionsData as any[]).filter(s => s.status === 'pending').length);
    if ((messagesData as any).success) {
      setUnreadProMessagesCount((messagesData as any).data.filter((m: any) => m.read === 0 && m.receiverType === 'parents').length);
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated' || (status === 'authenticated' && (session?.user as { role?: string }).role !== 'parent')) {
      router.push('/');
    } else if (status === 'authenticated') {
      fetchPendingCounts();
      const interval = setInterval(fetchPendingCounts, 30000);
      return () => clearInterval(interval);
    }
  }, [status, session, router, fetchPendingCounts]);

  if (status === 'loading' || (status === 'authenticated' && (session?.user as { role?: string }).role !== 'parent')) {
    return <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Cargando...</div>;
  }

  return (
    <div className="container">
      {/* Header Admin */}
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        margin: '40px 0',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link href="/">
            <button className="glass" style={{ padding: '10px', borderRadius: '50%', cursor: 'pointer', border: '1px solid var(--border-color)', color: 'white' }}>
              <ArrowLeft size={20} />
            </button>
          </Link>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 700, lineHeight: 1.2 }}>
              Configuración y <span style={{ color: 'var(--accent-color)' }}>Monitoreo</span> 🛠️
            </h1>
            <p style={{ color: 'var(--text-dim)' }}>Hola, {session?.user?.name || 'Admin'}</p>
          </div>
        </div>

        <button 
          onClick={() => signOut()}
          className="glass"
          style={{ 
            border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', 
            padding: '8px 16px', borderRadius: '12px',
            cursor: 'pointer', fontSize: '0.8rem',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <LogOut size={14} /> Cerrar sesión
        </button>
      </header>

      {/* Tabs */}
      <nav style={{ display: 'flex', gap: '10px', marginBottom: '30px', overflowX: 'auto', paddingBottom: '10px' }}>
        <TabButton 
          active={activeTab === 'family'} 
          onClick={() => setActiveTab('family')}
          icon={<Users size={18} />}
          label="Equipo"
        />
        <TabButton 
          active={activeTab === 'quests'} 
          onClick={() => setActiveTab('quests')}
          icon={<Trophy size={18} />}
          label="Misiones"
        />
        <TabButton 
          active={activeTab === 'rewards'} 
          onClick={() => setActiveTab('rewards')}
          icon={<Gift size={18} />}
          label="Premios"
        />
        <TabButton 
          active={activeTab === 'approvals'} 
          onClick={() => setActiveTab('approvals')}
          icon={<CheckCircle size={18} />}
          label="Aprobaciones"
          badgeCount={pendingCount}
        />
        <TabButton 
          active={activeTab === 'suggestions'} 
          onClick={() => setActiveTab('suggestions')}
          icon={<MessageSquare size={18} />}
          label="Sugerencias"
          badgeCount={pendingSuggestionsCount}
        />
        <TabButton 
          active={activeTab === 'pro-messages'} 
          onClick={() => { setActiveTab('pro-messages'); fetchPendingCounts(); }}
          icon={<Stethoscope size={18} />}
          label="Buzón Profesional"
          badgeCount={unreadProMessagesCount}
        />
        <TabButton 
          active={activeTab === 'stats'} 
          onClick={() => setActiveTab('stats')}
          icon={<BarChart3 size={18} />}
          label="Estadísticas"
        />
      </nav>

      {/* Contenido Dinámico */}
      <main>
        {activeTab === 'family' && <FamilyManager />}
        {activeTab === 'quests' && <QuestsManager />}
        {activeTab === 'rewards' && <RewardsManager />}
        {activeTab === 'approvals' && <ApprovalsManager onUpdate={fetchPendingCounts} />}
        {activeTab === 'suggestions' && <SuggestionsManager onUpdate={fetchPendingCounts} />}
        {activeTab === 'pro-messages' && <ProMessagesManager />}
        {activeTab === 'stats' && <StatsManager />}
      </main>
    </div>
  );
}

const AVATARS = ['🎮', '🚀', '🦖', '🎨', '🦄', '⚡', '🛡️', '👑', '🌟', '🛠️', '🐱', '🦊', '🐼', '🐯', '🦁'];

interface FamilyMember {
  id: string;
  name: string;
  role: 'child' | 'parent';
  image: string | null;
  email: string | null;
  balance: number;
}

interface FamilyDetail {
  id: string;
  name: string;
  code: string;
}

function FamilyManager() {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [family, setFamily] = useState<FamilyDetail | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [bonusId, setBonusId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState('👤');
  const [formRole, setFormRole] = useState<'child' | 'parent'>('child');
  const [editingRole, setEditingRole] = useState<'child' | 'parent' | null>(null);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState('');

  const fetchData = async () => {
    const [membersData, familyData] = await Promise.all([
      getFamilyMembers(),
      getFamilyDetail()
    ]);
    setMembers(membersData as FamilyMember[]);
    setFamily(familyData as FamilyDetail);
  };

    useEffect(() => {
      Promise.resolve().then(() => {
        fetchData();
      });
    }, []);

    useEffect(() => {
      if (notification) {
        const timer = setTimeout(() => setNotification(null), 3000);
        return () => clearTimeout(timer);
      }
    }, [notification]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setLoading(true);
      const formData = new FormData(e.currentTarget);
      formData.append('image', selectedAvatar);
      const res = await createFamilyMember(formData);
      if (res.success) {
        setShowForm(false);
        fetchData();
        setNotification({ message: '¡Miembro creado con éxito! 🎉', type: 'success' });
      } else {
        if (res.error?.includes('plan gratuito')) {
          setUpgradeMessage(res.error);
          setShowUpgradeModal(true);
        } else {
          setNotification({ message: res.error || 'Error al crear', type: 'error' });
        }
      }
      setLoading(false);
    };

    const handleUpdate = async (e: React.FormEvent<HTMLFormElement>, id: string) => {
      e.preventDefault();
      setLoading(true);
      const formData = new FormData(e.currentTarget);
      formData.append('image', selectedAvatar);
      const res = await updateFamilyMember(id, formData);
      if (res.success) {
        setEditingId(null);
        setEditingRole(null);
        fetchData();
        setNotification({ message: '¡Perfil actualizado correctamente! ✨', type: 'success' });
      } else {
        setNotification({ message: res.error || 'Error al actualizar', type: 'error' });
      }
      setLoading(false);
    };

    const handleBonus = async (e: React.FormEvent<HTMLFormElement>, childId: string) => {
      e.preventDefault();
      setLoading(true);
      const formData = new FormData(e.currentTarget);
      const amount = parseInt(formData.get("amount") as string);
      const description = formData.get("description") as string;
      
      const res = await awardSpontaneousTokens(childId, amount, description);
      if (res.success) {
        setBonusId(null);
        fetchData();
        setNotification({ message: '¡Bonus otorgado con éxito! 🎁', type: 'success' });
      } else {
        setNotification({ message: res.error || 'Error al otorgar bonus', type: 'error' });
      }
      setLoading(false);
    };

    const handleDelete = async (id: string) => {
      if (confirm('¿Estás seguro de eliminar a este miembro?')) {
        const res = await deleteFamilyMember(id);
        if (res.success) {
          fetchData();
          setNotification({ message: 'Miembro eliminado. 👋', type: 'success' });
        } else {
          setNotification({ message: res.error || 'Error al eliminar', type: 'error' });
        }
      }
    };

  const handleDeleteFamily = async () => {
    const confirmText = prompt('⚠️ ATENCIÓN: Esta acción eliminará permanentemente a TODO EL EQUIPO, incluyendo misiones, premios y a todos los miembros.\n\nPara confirmar, escribe exactamente la palabra: ELIMINAR');
    
    if (confirmText === 'ELIMINAR') {
      const res = await deleteOwnFamily();
      if (res.success) {
        alert('Equipo eliminado correctamente. Serás redirigido.');
        signOut({ callbackUrl: '/goodbye' });
      } else {
        alert(res.error);
      }
    } else if (confirmText !== null) {
      alert('Texto incorrecto. No se eliminó el equipo.');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
        message={upgradeMessage} 
      />
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 20, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            style={{
              position: 'fixed',
              top: 0,
              left: '50%',
              zIndex: 1000,
              background: notification.type === 'success' ? 'rgba(16, 185, 129, 0.9)' : 'rgba(239, 68, 68, 0.9)',
              color: 'white',
              padding: '12px 25px',
              borderRadius: '15px',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontWeight: 600,
              pointerEvents: 'none'
            }}
          >
            {notification.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Banner de Código de Familia */}
      {family && (
        <div className="glass" style={{ 
          marginBottom: '30px', 
          padding: '20px', 
          borderRadius: '20px', 
          border: '1px solid var(--accent-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(90deg, rgba(6, 182, 212, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)'
        }}>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>
              Código Secreto del Equipo
            </p>
            <h2 style={{ fontSize: '1.8rem', color: 'var(--accent-color)', margin: '5px 0' }}>{family.code}</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Dáselo a los aventureros del equipo para que puedan entrar a su aventura.</p>
          </div>
          <div style={{ fontSize: '3rem', opacity: 0.5 }}>🛡️</div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Miembros del Equipo</h2>
        <button 
          onClick={() => { setShowForm(!showForm); setSelectedAvatar('👤'); }}
          className="btn-primary" 
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {showForm ? 'Cancelar' : <><Plus size={18} /> Añadir Miembro</>}
        </button>
      </div>

      {showForm && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }} 
          animate={{ height: 'auto', opacity: 1 }}
          className="glass card" 
          style={{ marginBottom: '30px', overflow: 'hidden' }}
        >
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Nombre</label>
              <input name="name" type="text" placeholder="Ej: Mateo" required style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', color: 'white' }} />
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Contraseña</label>
              <input name="password" type="password" placeholder="••••" required style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', color: 'white' }} />
            </div>
            <div style={{ display: 'grid', gap: '8px', gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Elige un Avatar</label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {AVATARS.map(av => (
                  <button 
                    key={av} 
                    type="button"
                    onClick={() => setSelectedAvatar(av)}
                    style={{ 
                      fontSize: '1.5rem', padding: '8px', borderRadius: '10px', cursor: 'pointer',
                      background: selectedAvatar === av ? 'var(--primary-color)' : 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--border-color)', transition: 'all 0.2s'
                    }}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Función</label>
              <select 
                name="role" 
                value={formRole}
                onChange={(e) => setFormRole(e.target.value as 'child' | 'parent')}
                style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', color: 'white' }}
              >
                <option value="child" style={{ color: 'black' }}>Aventurero</option>
                <option value="parent" style={{ color: 'black' }}>Capitán</option>
              </select>
            </div>
            
            {formRole === 'parent' && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'grid', gap: '8px', gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Email de acceso</label>
                <input name="email" type="email" placeholder="ejemplo@email.com" required style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', color: 'white' }} />
              </motion.div>
            )}

            <div style={{ display: 'flex', alignItems: 'flex-end', gridColumn: formRole === 'parent' ? '1 / -1' : 'auto' }}>
              <button disabled={loading} type="submit" className="btn-primary" style={{ width: '100%' }}>
                {loading ? 'Guardando...' : 'Crear Perfil'}
              </button>
            </div>
          </form>
        </motion.div>
      )}
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {members.map((member) => (
          <div key={member.id} className="glass card" style={{ position: 'relative' }}>
            {editingId === member.id ? (
              <form onSubmit={(e) => handleUpdate(e, member.id)} style={{ display: 'grid', gap: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '0.9rem' }}>Editando Perfil</h3>
                  <button type="button" onClick={() => { setEditingId(null); setEditingRole(null); }} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}><X size={18}/></button>
                </div>
                <input name="name" defaultValue={member.name} placeholder="Nombre" required style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px', color: 'white' }} />
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                  {AVATARS.map(av => (
                    <button key={av} type="button" onClick={() => setSelectedAvatar(av)} style={{ fontSize: '1.2rem', padding: '5px', borderRadius: '8px', background: selectedAvatar === av ? 'var(--primary-color)' : 'transparent', border: '1px solid var(--border-color)', cursor: 'pointer' }}>{av}</button>
                  ))}
                </div>
                <select 
                  name="role" 
                  value={editingRole || member.role} 
                  onChange={(e) => setEditingRole(e.target.value as 'child' | 'parent')}
                  style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px', color: 'white' }}
                >
                  <option value="child" style={{ color: 'black' }}>Jugador</option>
                  <option value="parent" style={{ color: 'black' }}>Admin</option>
                </select>
                {(editingRole || member.role) === 'parent' && (
                  <input name="email" type="email" defaultValue={member.email ?? undefined} placeholder="Email de acceso" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px', color: 'white' }} />
                )}
                <input name="password" type="password" placeholder="Cambiar contraseña (opcional)" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px', color: 'white' }} />
                <button disabled={loading} type="submit" className="btn-primary" style={{ padding: '8px' }}>
                  {loading ? '...' : 'Guardar Cambios'}
                </button>
              </form>
            ) : bonusId === member.id && member.role === 'child' ? (
              <form onSubmit={(e) => handleBonus(e, member.id)} style={{ display: 'grid', gap: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--gold-color)' }}>
                    <Gift size={16} /> Regalar Bonus
                  </h3>
                  <button type="button" onClick={() => setBonusId(null)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}><X size={18}/></button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ fontSize: '2rem' }}>{member.image || '👤'}</div>
                  <div style={{ fontWeight: 700 }}>{member.name}</div>
                </div>
                <input name="amount" type="number" placeholder="Cantidad de Tokens (ej: 50)" required min="1" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px', color: 'white' }} />
                <input name="description" type="text" placeholder="Motivo (ej: Por ayudar sin pedirlo)" required style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px', color: 'white' }} />
                <button disabled={loading} type="submit" className="btn-primary" style={{ padding: '8px', background: 'var(--gold-color)', color: '#000' }}>
                  {loading ? '...' : 'Enviar Tokens'}
                </button>
              </form>
            ) : (
              <>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <div style={{ 
                    width: '60px', height: '60px', 
                    background: 'rgba(255,255,255,0.05)', 
                    border: '1px solid var(--border-color)',
                    borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center',
                    fontSize: '2rem'
                  }}>
                    {member.image || '👤'}
                  </div>
                  <div style={{ 
                    flex: 1, 
                    minWidth: 0, // Crucial para que el truncado de texto funcione en flexbox
                    display: 'flex', 
                    flexDirection: 'column' 
                  }}>
                    <h3 style={{ 
                      fontSize: '1.2rem', 
                      marginBottom: '2px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      width: '100%'
                    }}>
                      {member.name}
                    </h3>
                    <div style={{ 
                      fontSize: '0.7rem', 
                      color: member.role === 'parent' ? 'var(--accent-color)' : 'var(--primary-color)',
                      textTransform: 'uppercase', 
                      fontWeight: 700, 
                      letterSpacing: '1px'
                    }}>
                      {member.role === 'parent' ? '🛡️ Admin' : '🎮 Jugador'}
                    </div>
                    {member.email && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {member.email}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>

                    <button onClick={() => { setEditingId(member.id); setEditingRole(member.role); setSelectedAvatar(member.image || '👤'); }} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '8px' }}>
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDelete(member.id)} style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', padding: '8px' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--gold-color)', fontWeight: 700 }}>
                    <Coins size={16} /> {member.balance} Tokens
                  </div>
                  {member.role === 'child' && (
                    <button 
                      onClick={() => setBonusId(member.id)} 
                      style={{ 
                        background: 'rgba(245, 158, 11, 0.1)', 
                        border: '1px solid var(--gold-color)', 
                        color: 'var(--gold-color)', 
                        cursor: 'pointer', 
                        padding: '6px 12px', 
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        transition: 'all 0.2s'
                      }} 
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--gold-color)'; e.currentTarget.style.color = '#000'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(245, 158, 11, 0.1)'; e.currentTarget.style.color = 'var(--gold-color)'; }}
                    >
                      <Gift size={14} /> Regalar Bonus
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
        {members.length === 0 && !showForm && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
            No hay miembros en tu equipo todavía. ¡Añade el primero!
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div style={{ marginTop: '60px', borderTop: '1px solid rgba(239, 68, 68, 0.2)', paddingTop: '40px' }}>
        <div className="glass" style={{ padding: '30px', borderRadius: '24px', border: '1px solid rgba(239, 68, 68, 0.3)', background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, transparent 100%)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <div style={{ padding: '15px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '15px', color: 'var(--danger-color)' }}>
                <AlertTriangle size={32} />
              </div>
              <div>
                <h3 style={{ color: 'var(--danger-color)', marginBottom: '5px' }}>Zona de Peligro</h3>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', maxWidth: '400px' }}>
                  Eliminar la cuenta del equipo es una acción irreversible. Se borrarán todos los miembros, misiones, premios e historial para siempre.
                </p>
              </div>
            </div>
            <button 
              onClick={handleDeleteFamily}
              style={{ 
                background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', border: '1px solid var(--danger-color)', 
                padding: '12px 24px', borderRadius: '12px', cursor: 'pointer', fontWeight: 700,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--danger-color)'; e.currentTarget.style.color = 'white'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.color = 'var(--danger-color)'; }}
            >
              Eliminar Equipo
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badgeCount?: number;
}

function TabButton({ active, onClick, icon, label, badgeCount }: TabButtonProps) {
  return (
    <button 
      onClick={onClick}
      className={active ? 'btn-primary' : 'glass'}
      style={{ 
        display: 'flex', alignItems: 'center', gap: '8px', 
        padding: '10px 20px', borderRadius: '12px', border: active ? 'none' : '1px solid var(--border-color)',
        color: active ? 'white' : 'var(--text-dim)', cursor: 'pointer', whiteSpace: 'nowrap', position: 'relative'
      }}
    >
      {icon} {label}
      {badgeCount !== undefined && badgeCount > 0 && (
        <span style={{
          background: 'var(--danger-color)',
          color: 'white',
          borderRadius: '50%',
          padding: '2px 6px',
          fontSize: '0.7rem',
          fontWeight: 800,
          marginLeft: '4px'
        }}>
          {badgeCount}
        </span>
      )}
    </button>
  );
}

interface QuestItem {
  id: string;
  title: string;
  reward: number;
  category: string;
}

// Estos se implementarán después pero mantenemos la estructura
function QuestsManager() {
  const [questsList, setQuestsList] = useState<QuestItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchQuests = async () => {
    const data = await getQuests();
    setQuestsList(data as QuestItem[]);
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchQuests();
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await createQuest(formData);
    if (res.success) {
      setShowForm(false);
      fetchQuests();
    } else {
      alert(res.error);
    }
    setLoading(false);
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>, id: string) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await updateQuest(id, formData);
    if (res.success) {
      setEditingId(null);
      fetchQuests();
    } else {
      alert(res.error);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Eliminar esta misión?')) {
      const res = await deleteQuest(id);
      if (res.success) fetchQuests();
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Catálogo de Misiones</h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="btn-primary" 
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {showForm ? 'Cancelar' : <><Plus size={18} /> Nueva Misión</>}
        </button>
      </div>

      {showForm && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }} 
          animate={{ height: 'auto', opacity: 1 }}
          className="glass card" 
          style={{ marginBottom: '30px', overflow: 'hidden' }}
        >
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>¿Qué hay que hacer?</label>
              <input name="title" type="text" placeholder="Ej: Ordenar el cuarto" required style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', color: 'white' }} />
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Tokens</label>
              <input name="tokens" type="number" placeholder="50" required style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', color: 'white' }} />
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Categoría</label>
              <select name="category" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', color: 'white' }}>
                <option value="Hogar" style={{ color: 'black' }}>🏠 Hogar</option>
                <option value="Estudio" style={{ color: 'black' }}>📚 Estudio</option>
                <option value="Higiene" style={{ color: 'black' }}>🚿 Higiene</option>
                <option value="Deporte" style={{ color: 'black' }}>⚽ Deporte</option>
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
              <button disabled={loading} type="submit" className="btn-primary" style={{ padding: '10px 40px' }}>
                {loading ? 'Guardando...' : 'Crear Misión'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {questsList.map((quest) => (
          <div key={quest.id} className="glass card" style={{ borderLeft: '4px solid var(--primary-color)' }}>
            {editingId === quest.id ? (
              <form onSubmit={(e) => handleUpdate(e, quest.id)} style={{ display: 'grid', gap: '15px' }}>
                <input name="title" defaultValue={quest.title} required style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px', color: 'white' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <input name="tokens" type="number" defaultValue={quest.reward} required style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px', color: 'white' }} />
                  <select name="category" defaultValue={quest.category} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px', color: 'white' }}>
                    <option value="Hogar" style={{ color: 'black' }}>🏠 Hogar</option>
                    <option value="Estudio" style={{ color: 'black' }}>📚 Estudio</option>
                    <option value="Higiene" style={{ color: 'black' }}>🚿 Higiene</option>
                    <option value="Deporte" style={{ color: 'black' }}>⚽ Deporte</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" className="btn-primary" style={{ flex: 1, padding: '8px' }}>Guardar</button>
                  <button type="button" onClick={() => setEditingId(null)} className="glass" style={{ flex: 1, padding: '8px', color: 'white' }}>X</button>
                </div>
              </form>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '10px', color: 'var(--text-dim)' }}>
                      {quest.category}
                    </span>
                    <h3 style={{ marginTop: '5px' }}>{quest.title}</h3>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--gold-color)', fontWeight: 700 }}>
                    <Coins size={16} /> {quest.reward}
                  </div>
                </div>
                <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button onClick={() => setEditingId(quest.id)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                    <Pencil size={18} />
                  </button>
                  <button onClick={() => handleDelete(quest.id)} style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer' }}>
                    <Trash2 size={18} />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
        {questsList.length === 0 && !showForm && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
            Aún no has creado ninguna misión. ¡Empezá con una!
          </div>
        )}
      </div>
    </motion.div>
  );
}

interface RewardItem {
  id: string;
  title: string;
  cost: number;
  minutes: number | null;
}

function RewardsManager() {
  const [rewardsList, setRewardsList] = useState<RewardItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchRewards = async () => {
    const data = await getRewards();
    setRewardsList(data as RewardItem[]);
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchRewards();
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await createReward(formData);
    if (res.success) {
      setShowForm(false);
      fetchRewards();
    } else {
      alert(res.error);
    }
    setLoading(false);
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>, id: string) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await updateReward(id, formData);
    if (res.success) {
      setEditingId(null);
      fetchRewards();
    } else {
      alert(res.error);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Eliminar este premio?')) {
      const res = await deleteReward(id);
      if (res.success) fetchRewards();
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Catálogo de Premios</h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="btn-primary" 
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--primary-color)' }}
        >
          {showForm ? 'Cancelar' : <><Plus size={18} /> Nuevo Premio</>}
        </button>
      </div>

      {showForm && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }} 
          animate={{ height: 'auto', opacity: 1 }}
          className="glass card" 
          style={{ marginBottom: '30px', overflow: 'hidden' }}
        >
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Título del Premio</label>
              <input name="title" type="text" placeholder="Ej: 30 min de Tablet" required style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', color: 'white' }} />
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Costo (Tokens)</label>
              <input name="cost" type="number" placeholder="100" required style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', color: 'white' }} />
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Tiempo (Minutos)</label>
              <input name="minutes" type="number" placeholder="30 (opcional)" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', color: 'white' }} />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
              <button disabled={loading} type="submit" className="btn-primary" style={{ padding: '10px 40px', background: 'var(--primary-color)' }}>
                {loading ? 'Guardando...' : 'Crear Premio'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {rewardsList.map((reward) => (
          <div key={reward.id} className="glass card" style={{ borderTop: '4px solid var(--accent-color)' }}>
            {editingId === reward.id ? (
              <form onSubmit={(e) => handleUpdate(e, reward.id)} style={{ display: 'grid', gap: '15px' }}>
                <input name="title" defaultValue={reward.title} required style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px', color: 'white' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <input name="cost" type="number" defaultValue={reward.cost} required style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px', color: 'white' }} />
                  <input name="minutes" type="number" defaultValue={reward.minutes || ''} placeholder="Minutos" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px', color: 'white' }} />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" className="btn-primary" style={{ flex: 1, padding: '8px' }}>Guardar</button>
                  <button type="button" onClick={() => setEditingId(null)} className="glass" style={{ flex: 1, padding: '8px', color: 'white' }}>X</button>
                </div>
              </form>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ padding: '10px', background: 'rgba(139, 92, 246, 0.2)', borderRadius: '12px' }}>
                    <Gift color="var(--primary-color)" size={24} />
                  </div>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button onClick={() => setEditingId(reward.id)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}><Pencil size={16}/></button>
                    <button onClick={() => handleDelete(reward.id)} style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer' }}><Trash2 size={16}/></button>
                  </div>
                </div>
                <h3 style={{ margin: '15px 0 5px 0' }}>{reward.title}</h3>
                <div style={{ display: 'flex', gap: '15px', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--gold-color)', fontWeight: 700 }}>
                    <Coins size={14} /> {reward.cost}
                  </div>
                  {reward.minutes && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Clock size={14} /> {reward.minutes} min
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
        {rewardsList.length === 0 && !showForm && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
            No hay premios creados. ¡Sorprendelos con algo genial!
          </div>
        )}
      </div>
    </motion.div>
  );
}
interface PendingApprovalItem {
  id: string;
  childImage: string | null;
  childName: string;
  questTitle: string;
  questReward: number;
  isTherapy?: number | null;
}

interface PendingRewardApprovalItem {
  id: string;
  childImage: string | null;
  childName: string;
  rewardTitle: string;
  rewardCost: number;
}

interface ApprovalsManagerProps {
  onUpdate?: () => void;
}

function ApprovalsManager({ onUpdate }: ApprovalsManagerProps = {}) {
  const [pending, setPending] = useState<PendingApprovalItem[]>([]);
  const [pendingRewards, setPendingRewards] = useState<PendingRewardApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = async () => {
    const [questsData, rewardsData] = await Promise.all([
      getPendingApprovals(),
      getPendingRewardApprovals()
    ]);
    setPending(questsData as PendingApprovalItem[]);
    setPendingRewards(rewardsData as PendingRewardApprovalItem[]);
    setLoading(false);
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchPending();
    });
  }, []);

  const handleApprove = async (id: string) => {
    const res = await approveQuest(id);
    if (res.success) {
      fetchPending();
      if (onUpdate) onUpdate();
    }
    else alert(res.error);
  };

  const handleReject = async (id: string) => {
    if (confirm('¿Quieres rechazar esta solicitud?')) {
      const res = await rejectQuest(id);
      if (res.success) {
        fetchPending();
        if (onUpdate) onUpdate();
      }
    }
  };

  const handleApproveReward = async (id: string) => {
    const res = await approveRewardClaim(id);
    if (res.success) {
      fetchPending();
      if (onUpdate) onUpdate();
    }
    else alert(res.error);
  };

  const handleRejectReward = async (id: string) => {
    if (confirm('¿Quieres rechazar el canje? Los tokens serán devueltos al aventurero.')) {
      const res = await rejectRewardClaim(id);
      if (res.success) {
        fetchPending();
        if (onUpdate) onUpdate();
      }
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '40px' }}>Cargando solicitudes...</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ marginBottom: '30px' }}>
        <h2>Solicitudes de Aprobación</h2>
        <p style={{ color: 'var(--text-dim)' }}>Revisa las misiones completadas por tu equipo.</p>
      </div>

      <div style={{ display: 'grid', gap: '20px' }}>
        {pending.map((item) => (
          <div key={item.id} className="glass card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ fontSize: '2.5rem', width: '60px', height: '60px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid var(--border-color)' }}>
                {item.childImage || '👤'}
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{item.childName}</h3>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Completó: 
                  <span style={{ color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {item.isTherapy === 1 && <Stethoscope size={14} color="#f43f5e" />}
                    {item.questTitle}
                  </span>
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--gold-color)', fontSize: '0.9rem', marginTop: '5px', fontWeight: 700 }}>
                  <Coins size={14} /> Recompensa: {item.questReward} Tokens
                </div>
              </div>
            </div>
            
            {item.isTherapy === 1 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f43f5e', fontSize: '0.9rem', fontWeight: 600, padding: '10px 20px', background: 'rgba(244, 63, 94, 0.1)', borderRadius: '12px', border: '1px solid rgba(244, 63, 94, 0.3)' }}>
                <Stethoscope size={18} /> En revisión por el profesional
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => handleApprove(item.id)}
                  className="btn-primary" 
                  style={{ background: 'var(--success-color)', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
                >
                  <CheckCircle size={18} /> Aprobar
                </button>
                <button 
                  onClick={() => handleReject(item.id)}
                  className="glass" 
                  style={{ color: 'var(--danger-color)', border: '1px solid var(--danger-color)', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', cursor: 'pointer' }}
                >
                  <XCircle size={18} /> Rechazar
                </button>
              </div>
            )}
          </div>
        ))}

        {pending.length === 0 && (
          <div className="glass card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>
            <CheckCircle size={32} color="var(--success-color)" style={{ marginBottom: '10px', opacity: 0.5 }} />
            <p>No hay misiones pendientes de revisión.</p>
          </div>
        )}
      </div>

      <div style={{ marginBottom: '30px', marginTop: '40px' }}>
        <h2>Solicitudes de Premios</h2>
        <p style={{ color: 'var(--text-dim)' }}>Revisa los premios que tu equipo quiere canjear.</p>
      </div>

      <div style={{ display: 'grid', gap: '20px' }}>
        {pendingRewards.map((item) => (
          <div key={item.id} className="glass card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', borderLeft: '4px solid #f59e0b' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ fontSize: '2.5rem', width: '60px', height: '60px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid var(--border-color)' }}>
                {item.childImage || '👤'}
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{item.childName}</h3>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Canjeó: 
                  <span style={{ color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Gift size={14} color="#f59e0b" />
                    {item.rewardTitle}
                  </span>
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--gold-color)', fontSize: '0.9rem', marginTop: '5px', fontWeight: 700 }}>
                  <Coins size={14} /> Costo: {item.rewardCost} Tokens
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => handleApproveReward(item.id)}
                className="btn-primary" 
                style={{ background: 'var(--success-color)', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
              >
                <CheckCircle size={18} /> Aprobar
              </button>
              <button 
                onClick={() => handleRejectReward(item.id)}
                className="glass" 
                style={{ color: 'var(--danger-color)', border: '1px solid var(--danger-color)', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', cursor: 'pointer' }}
              >
                <XCircle size={18} /> Rechazar
              </button>
            </div>
          </div>
        ))}

        {pendingRewards.length === 0 && (
          <div className="glass card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>
            <CheckCircle size={32} color="var(--success-color)" style={{ marginBottom: '10px', opacity: 0.5 }} />
            <p>No hay canjes de premios pendientes.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
interface SuggestionItem {
  id: string;
  childImage: string | null;
  childName: string;
  content: string;
  status: string | null;
  createdAt: Date | null;
}

interface SuggestionsManagerProps {
  onUpdate?: () => void;
}

function SuggestionsManager({ onUpdate }: SuggestionsManagerProps = {}) {
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSuggestions = async () => {
    const data = await getSuggestions();
    setSuggestions(data as SuggestionItem[]);
    setLoading(false);
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchSuggestions();
    });
  }, []);

  const handleAction = async (id: string, status: 'approved' | 'rejected') => {
    const res = await updateSuggestionStatus(id, status);
    if (res.success) {
      fetchSuggestions();
      if (onUpdate) onUpdate();
    }
    else alert(res.error);
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '40px' }}>Cargando sugerencias...</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ marginBottom: '30px' }}>
        <h2>Buzón de Sugerencias</h2>
        <p style={{ color: 'var(--text-dim)' }}>Ideas enviadas por tu equipo para mejorar el juego.</p>
      </div>

      <div style={{ display: 'grid', gap: '20px' }}>
        {suggestions.map((item) => (
          <div key={item.id} className="glass card" style={{ position: 'relative', borderLeft: item.status === 'approved' ? '4px solid var(--success-color)' : item.status === 'rejected' ? '4px solid var(--danger-color)' : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ fontSize: '2rem', width: '50px', height: '50px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  {item.childImage || '👤'}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '5px' }}>{item.childName} sugiere:</h3>
                  <p style={{ fontSize: '1.05rem', lineHeight: 1.5, color: '#fff' }}>&ldquo;{item.content}&rdquo;</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '10px' }}>
                    Enviado el {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>

              {item.status === 'pending' ? (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={() => handleAction(item.id, 'approved')}
                    className="btn-primary" 
                    style={{ background: 'var(--success-color)', padding: '8px 16px', fontSize: '0.85rem' }}
                  >
                    Aceptar
                  </button>
                  <button 
                    onClick={() => handleAction(item.id, 'rejected')}
                    className="glass" 
                    style={{ color: 'var(--danger-color)', border: '1px solid var(--danger-color)', padding: '8px 16px', fontSize: '0.85rem' }}
                  >
                    Rechazar
                  </button>
                </div>
              ) : (
                <div style={{ 
                  padding: '5px 12px', 
                  borderRadius: '20px', 
                  fontSize: '0.7rem', 
                  fontWeight: 700, 
                  textTransform: 'uppercase',
                  background: item.status === 'approved' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  color: item.status === 'approved' ? 'var(--success-color)' : 'var(--danger-color)'
                }}>
                  {item.status === 'approved' ? '✅ Aceptada' : '❌ Rechazada'}
                </div>
              )}
            </div>
          </div>
        ))}

        {suggestions.length === 0 && (
          <div className="glass card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-dim)' }}>
            <MessageSquarePlus size={48} style={{ marginBottom: '20px', opacity: 0.5 }} />
            <p>Aún no hay sugerencias. ¡Anima a tu equipo a proponer ideas!</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

interface TransactionItem {
  id: string;
  userImage: string | null;
  userName: string;
  description: string | null;
  type: string;
  amount: number;
  createdAt: Date | null;
}

interface FamilyStats {
  summary: {
    totalEarned: number;
    questsCount: number;
    totalSpent: number;
    rewardsCount: number;
  };
  transactions: TransactionItem[];
}

function StatsManager() {
  const [period, setPeriod] = useState<'7d' | '30d' | 'all'>('7d');
  const [selectedChild, setSelectedChild] = useState<string>('all');
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [stats, setStats] = useState<FamilyStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    const data = await getFamilyStats(period, selectedChild === 'all' ? undefined : selectedChild);
    setStats(data as FamilyStats);
    setLoading(false);
  }, [period, selectedChild]);

  const fetchMembers = useCallback(async () => {
    const data = await getFamilyMembers();
    setMembers((data as FamilyMember[]).filter(m => m.role === 'child'));
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchMembers();
    });
  }, [fetchMembers]);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchStats();
    });
  }, [fetchStats]);

  if (loading && !stats) return <div style={{ textAlign: 'center', padding: '60px' }}>Analizando datos familiares...</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h2>Estadísticas {selectedChild !== 'all' ? `de ${members.find(m => m.id === selectedChild)?.name}` : 'del Equipo'}</h2>
          <p style={{ color: 'var(--text-dim)' }}>Monitorea el esfuerzo y las recompensas de tu equipo.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Selector de Miembro */}
          <select 
            value={selectedChild}
            onChange={(e) => setSelectedChild(e.target.value)}
            className="glass"
            style={{ 
              padding: '8px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', 
              color: 'white', background: 'rgba(0,0,0,0.3)', outline: 'none', cursor: 'pointer'
            }}
          >
            <option value="all">Todo el Equipo</option>
            {members.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>

          {/* Selector de Período */}
          <div className="glass" style={{ display: 'flex', padding: '5px', borderRadius: '12px', gap: '5px' }}>
            {(['7d', '30d', 'all'] as const).map((p) => (
              <button 
                key={p}
                onClick={() => setPeriod(p)}
                style={{ 
                  background: period === p ? 'var(--primary-color)' : 'transparent',
                  border: 'none', color: 'white', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem',
                  transition: 'all 0.2s'
                }}
              >
                {p === '7d' ? '7 días' : p === '30d' ? '30 días' : 'Todo'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>Actualizando cifras...</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            <div className="glass card" style={{ textAlign: 'center', borderTop: '4px solid var(--primary-color)' }}>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '10px' }}>Tokens Ganados</p>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <Coins size={28} /> {stats?.summary.totalEarned}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '5px' }}>{stats?.summary.questsCount} misiones</p>
            </div>
            <div className="glass card" style={{ textAlign: 'center', borderTop: '4px solid var(--accent-color)' }}>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '10px' }}>Tokens Canjeados</p>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <Trophy size={28} /> {stats?.summary.totalSpent}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '5px' }}>{stats?.summary.rewardsCount} premios</p>
            </div>
          </div>

          <div className="glass card">
            <h3 style={{ marginBottom: '20px' }}>Actividad Reciente</h3>
            <div style={{ display: 'grid', gap: '15px' }}>
              {stats?.transactions.map((t: TransactionItem) => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ fontSize: '1.5rem', width: '40px', height: '40px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      {t.userImage || '👤'}
                    </div>
                    <div>
                      <p style={{ fontWeight: 600 }}>{t.userName}</p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>{t.description}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontWeight: 700, color: t.type === 'quest' ? 'var(--success-color)' : 'var(--danger-color)' }}>
                      {t.type === 'quest' ? '+' : ''}{t.amount}
                    </p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                      {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              ))}
              {stats?.transactions.length === 0 && (
                <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-dim)' }}>No hay actividad registrada en este período.</p>
              )}
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}

function ProMessagesManager() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [familyId, setFamilyId] = useState<string>('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [messageTarget, setMessageTarget] = useState<'parents' | 'children'>('parents');

  const fetchMessages = async () => {
    setLoading(true);
    // Para los padres, cargamos todos los mensajes
    const res = await getMessagesForFamily('all');
    if (res.success) {
      setMessages(res.data);
      setCurrentUserId(res.currentUserId);
      // Para obtener el familyId, podemos sacar la familia del admin
      const family = await getFamilyDetail();
      if (family) setFamilyId((family as any).id);
      
      // Marcar como leídos
      await markMyMessagesAsRead('parents');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!familyId) return;
    setMsgLoading(true);
    const formData = new FormData(e.currentTarget);
    const content = formData.get('content') as string;

    const res = await sendMessage(familyId, content, 'professional');
    if (res.success) {
      setNotification({ message: 'Mensaje enviado correctamente', type: 'success' });
      (e.target as HTMLFormElement).reset();
      fetchMessages();
    } else {
      setNotification({ message: res.error || 'Error al enviar mensaje', type: 'error' });
    }
    setMsgLoading(false);
  };

  const filteredMessages = messages.filter((msg: any) => {
    if (messageTarget === 'parents') {
      return msg.receiverType === 'parents' || (msg.senderRole === 'parent' && msg.receiverType === 'professional') || (msg.senderRole === 'org_admin' && msg.receiverType === 'professional');
    } else {
      return msg.receiverType === 'children' || (msg.senderRole === 'child' && msg.receiverType === 'professional');
    }
  });

  if (loading) return <div style={{ textAlign: 'center', padding: '40px' }}>Cargando mensajes del profesional...</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
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

      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Stethoscope color="#f59e0b" /> Buzón del Profesional
        </h2>
        <p style={{ color: 'var(--text-dim)' }}>
          Aquí puedes comunicarte de forma privada con el profesional o supervisar los mensajes que le envía a los aventureros.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px' }}>
        
        {/* Selector de conversación */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <button 
            onClick={() => setMessageTarget('parents')}
            style={{ flex: 1, padding: '12px', borderRadius: '15px', border: messageTarget === 'parents' ? '2px solid #f59e0b' : '1px solid rgba(255,255,255,0.1)', background: messageTarget === 'parents' ? 'rgba(245, 158, 11, 0.1)' : 'transparent', color: messageTarget === 'parents' ? 'white' : 'var(--text-dim)', cursor: 'pointer', fontWeight: 600 }}
          >
            Nuestra Conversación
          </button>
          <button 
            onClick={() => setMessageTarget('children')}
            style={{ flex: 1, padding: '12px', borderRadius: '15px', border: messageTarget === 'children' ? '2px solid #06b6d4' : '1px solid rgba(255,255,255,0.1)', background: messageTarget === 'children' ? 'rgba(6, 182, 212, 0.1)' : 'transparent', color: messageTarget === 'children' ? 'white' : 'var(--text-dim)', cursor: 'pointer', fontWeight: 600 }}
          >
            Conversación de Aventureros
          </button>
        </div>
        
        <div className="glass card">
          <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MessageSquare size={20} /> Historial de Conversación
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '400px', overflowY: 'auto', paddingRight: '10px' }}>
            {filteredMessages.map((msg: any) => {
              let isRightSide = false;
              let borderColor = '';
              let bgColor = '';
              let titleColor = '';

              if (msg.senderId === currentUserId) {
                isRightSide = true;
                borderColor = '#06b6d4'; // Cyan
                bgColor = 'rgba(6, 182, 212, 0.1)';
                titleColor = '#06b6d4';
              } else if (messageTarget === 'children') {
                if (msg.senderRole === 'professional') {
                  isRightSide = false;
                  borderColor = '#8b5cf6'; // Purple
                  bgColor = 'rgba(139, 92, 246, 0.05)';
                  titleColor = '#8b5cf6';
                } else {
                  isRightSide = true; // El niño se alinea a la derecha para contrastar
                  borderColor = '#10b981'; // Green
                  bgColor = 'rgba(16, 185, 129, 0.1)';
                  titleColor = '#10b981';
                }
              } else {
                isRightSide = false;
                borderColor = '#f59e0b'; // Orange
                bgColor = 'rgba(255,255,255,0.05)';
                titleColor = '#f59e0b';
              }

              return (
              <div key={msg.id} className={`admin-chat-bubble ${isRightSide ? 'admin-chat-bubble-mine' : 'admin-chat-bubble-other'}`} style={{ 
                background: bgColor, 
                borderLeft: `4px solid ${borderColor}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem', color: titleColor }}>
                    {msg.senderId === currentUserId ? 'Tú' : (msg.senderRole === 'professional' ? 'Dr/Coach ' + msg.senderName : msg.senderName)}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    {new Date(msg.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5, color: '#e2e8f0', fontSize: '0.95rem' }}>{msg.content}</p>
              </div>
              );
            })}
            {filteredMessages.length === 0 && (
              <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px' }}>
                {messageTarget === 'parents' 
                  ? 'No hay mensajes registrados. Puedes escribirle a tu profesional aquí.'
                  : 'Aún no hay mensajes entre el profesional y los aventureros.'}
              </p>
            )}
          </div>
        </div>

        {messageTarget === 'parents' && (
          <div className="glass card" style={{ borderTop: '4px solid #f59e0b' }}>
            <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#f59e0b' }}>
              <Send size={20} /> Responder al Profesional
            </h3>
            <form onSubmit={handleSendMessage} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <textarea 
                name="content" 
                required 
                placeholder="Escribe tu mensaje privado para el profesional..."
                style={{ padding: '15px', borderRadius: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', minHeight: '100px', resize: 'vertical' }} 
              />
              <button disabled={msgLoading} type="submit" className="btn-primary" style={{ padding: '12px', background: '#f59e0b', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Send size={16} /> {msgLoading ? 'Enviando...' : 'Enviar Mensaje'}
              </button>
            </form>
          </div>
        )}

      </div>
      <style jsx>{`
        .admin-chat-bubble {
          padding: 15px;
          border-radius: 15px;
        }
        .admin-chat-bubble-mine {
          margin-left: 40px;
          margin-right: 0;
        }
        .admin-chat-bubble-other {
          margin-left: 0;
          margin-right: 40px;
        }
        @media (max-width: 768px) {
          .admin-chat-bubble-mine {
            margin-left: 10px;
          }
          .admin-chat-bubble-other {
            margin-right: 10px;
          }
        }
      `}</style>
    </motion.div>
  );
}

