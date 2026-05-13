'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { 
  Plus, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  LayoutDashboard, 
  Trophy, 
  Gift, 
  MessageSquare,
  ArrowLeft,
  LogOut,
  Users,
  Coins,
  Pencil,
  X,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { getFamilyMembers, createFamilyMember, updateFamilyMember, deleteFamilyMember } from '../actions/family';
import { getQuests, createQuest, deleteQuest } from '../actions/quests';
import { getRewards, createReward, updateReward, deleteReward } from '../actions/rewards';

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('family');

  return (
    <div className="container">
      {/* Header Admin */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '40px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link href="/">
            <button className="glass" style={{ padding: '10px', borderRadius: '50%', cursor: 'pointer', border: '1px solid var(--border-color)', color: 'white' }}>
              <ArrowLeft size={20} />
            </button>
          </Link>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Panel de <span style={{ color: 'var(--accent-color)' }}>Control</span> 🛠️</h1>
            <p style={{ color: 'var(--text-dim)' }}>Hola, {session?.user?.name || 'Admin'}</p>
            <button 
              onClick={() => signOut()}
              style={{ 
                background: 'none', border: 'none', color: 'var(--text-dim)', 
                cursor: 'pointer', fontSize: '0.8rem', marginTop: '5px',
                display: 'flex', alignItems: 'center', gap: '5px'
              }}
            >
              <LogOut size={14} /> Cerrar sesión
            </button>
          </div>
        </div>
        <div className="glass card" style={{ padding: '10px 20px', display: 'flex', gap: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>MIEMBROS</p>
            <p style={{ fontWeight: 600 }}>Familia</p>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav style={{ display: 'flex', gap: '10px', marginBottom: '30px', overflowX: 'auto', paddingBottom: '10px' }}>
        <TabButton 
          active={activeTab === 'family'} 
          onClick={() => setActiveTab('family')}
          icon={<Users size={18} />}
          label="Familia"
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
        />
        <TabButton 
          active={activeTab === 'suggestions'} 
          onClick={() => setActiveTab('suggestions')}
          icon={<MessageSquare size={18} />}
          label="Sugerencias"
        />
      </nav>

      {/* Contenido Dinámico */}
      <main>
        {activeTab === 'family' && <FamilyManager />}
        {activeTab === 'quests' && <QuestsManager />}
        {activeTab === 'rewards' && <RewardsManager />}
        {activeTab === 'approvals' && <ApprovalsManager />}
        {activeTab === 'suggestions' && <SuggestionsManager />}
      </main>
    </div>
  );
}

const AVATARS = ['🎮', '🚀', '🦖', '🎨', '🦄', '⚡', '🛡️', '👑', '🌟', '🛠️', '🐱', '🦊', '🐼', '🐯', '🦁'];

function FamilyManager() {
  const [members, setMembers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState('👤');

  const fetchMembers = async () => {
    const data = await getFamilyMembers();
    setMembers(data);
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.append('image', selectedAvatar);
    const res = await createFamilyMember(formData);
    if (res.success) {
      setShowForm(false);
      fetchMembers();
    } else {
      alert(res.error);
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
      fetchMembers();
    } else {
      alert(res.error);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar a este miembro?')) {
      const res = await deleteFamilyMember(id);
      if (res.success) fetchMembers();
      else alert(res.error);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Miembros de la Familia</h2>
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
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
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
              <select name="role" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', color: 'white' }}>
                <option value="child" style={{ color: 'black' }}>Hijo / Jugador</option>
                <option value="parent" style={{ color: 'black' }}>Pareja / Admin</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
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
                  <button type="button" onClick={() => setEditingId(null)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}><X size={18}/></button>
                </div>
                <input name="name" defaultValue={member.name} placeholder="Nombre" required style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px', color: 'white' }} />
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                  {AVATARS.map(av => (
                    <button key={av} type="button" onClick={() => setSelectedAvatar(av)} style={{ fontSize: '1.2rem', padding: '5px', borderRadius: '8px', background: selectedAvatar === av ? 'var(--primary-color)' : 'transparent', border: '1px solid var(--border-color)', cursor: 'pointer' }}>{av}</button>
                  ))}
                </div>
                <select name="role" defaultValue={member.role} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px', color: 'white' }}>
                  <option value="child" style={{ color: 'black' }}>Jugador</option>
                  <option value="parent" style={{ color: 'black' }}>Admin</option>
                </select>
                <input name="password" type="password" placeholder="Cambiar contraseña (opcional)" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px', color: 'white' }} />
                <button disabled={loading} type="submit" className="btn-primary" style={{ padding: '8px' }}>
                  {loading ? '...' : 'Guardar Cambios'}
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
                  <div>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '2px' }}>{member.name}</h3>
                    <div style={{ 
                      fontSize: '0.7rem', color: member.role === 'parent' ? 'var(--accent-color)' : 'var(--primary-color)',
                      textTransform: 'uppercase', fontWeight: 700, letterSpacing: '1px'
                    }}>
                      {member.role === 'parent' ? '🛡️ Admin' : '🎮 Jugador'}
                    </div>
                  </div>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '5px' }}>
                    <button onClick={() => { setEditingId(member.id); setSelectedAvatar(member.image || '👤'); }} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '5px' }}>
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDelete(member.id)} style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', padding: '5px' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--gold-color)', fontWeight: 700 }}>
                    <Coins size={16} /> {member.balance} Tokens
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
        {members.length === 0 && !showForm && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
            No hay miembros en tu familia todavía. ¡Añade el primero!
          </div>
        )}
      </div>
    </motion.div>
  );
}

function TabButton({ active, onClick, icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={active ? 'btn-primary' : 'glass'}
      style={{ 
        display: 'flex', alignItems: 'center', gap: '8px', 
        padding: '10px 20px', borderRadius: '12px', border: active ? 'none' : '1px solid var(--border-color)',
        color: active ? 'white' : 'var(--text-dim)', cursor: 'pointer', whiteSpace: 'nowrap'
      }}
    >
      {icon} {label}
    </button>
  );
}

// Estos se implementarán después pero mantenemos la estructura
function QuestsManager() {
  const [questsList, setQuestsList] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchQuests = async () => {
    const data = await getQuests();
    setQuestsList(data);
  };

  useEffect(() => {
    fetchQuests();
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
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '20px' }}>
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
            <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => handleDelete(quest.id)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                <Trash2 size={18} />
              </button>
            </div>
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

function RewardsManager() {
  const [rewardsList, setRewardsList] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchRewards = async () => {
    const data = await getRewards();
    setRewardsList(data);
  };

  useEffect(() => {
    fetchRewards();
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
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '20px' }}>
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
                  <input name="minutes" type="number" defaultValue={reward.minutes} placeholder="Minutos" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px', color: 'white' }} />
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
function ApprovalsManager() { return <div className="glass card" style={{ padding: '40px', textAlign: 'center' }}>Próximamente: Aprobar Tareas ✅</div> }
function SuggestionsManager() { return <div className="glass card" style={{ padding: '40px', textAlign: 'center' }}>Próximamente: Buzón de Sugerencias 💡</div> }
