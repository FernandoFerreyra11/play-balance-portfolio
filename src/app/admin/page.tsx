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
  Clock,
  MessageSquarePlus,
  BarChart3,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getFamilyMembers, createFamilyMember, updateFamilyMember, deleteFamilyMember, getFamilyDetail, deleteOwnFamily } from '../actions/family';
import { getQuests, createQuest, deleteQuest } from '../actions/quests';
import { getRewards, createReward, updateReward, deleteReward } from '../actions/rewards';
import { getPendingApprovals, approveQuest, rejectQuest } from '../actions/approvals';
import { getSuggestions, updateSuggestionStatus } from '../actions/suggestions';
import { getFamilyStats } from '../actions/player';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('family');

  useEffect(() => {
    if (status === 'unauthenticated' || (status === 'authenticated' && (session?.user as any).role !== 'parent')) {
      router.push('/');
    }
  }, [status, session, router]);

  if (status === 'loading' || (status === 'authenticated' && (session?.user as any).role !== 'parent')) {
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
        {activeTab === 'approvals' && <ApprovalsManager />}
        {activeTab === 'suggestions' && <SuggestionsManager />}
        {activeTab === 'stats' && <StatsManager />}
      </main>
    </div>
  );
}

const AVATARS = ['🎮', '🚀', '🦖', '🎨', '🦄', '⚡', '🛡️', '👑', '🌟', '🛠️', '🐱', '🦊', '🐼', '🐯', '🦁'];

function FamilyManager() {
  const [members, setMembers] = useState<any[]>([]);
  const [family, setFamily] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState('👤');
  const [formRole, setFormRole] = useState<'child' | 'parent'>('child');

  const fetchData = async () => {
    const [membersData, familyData] = await Promise.all([
      getFamilyMembers(),
      getFamilyDetail()
    ]);
    setMembers(membersData);
    setFamily(familyData);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.append('image', selectedAvatar);
    const res = await createFamilyMember(formData);
    if (res.success) {
      setShowForm(false);
      fetchData();
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
      fetchData();
    } else {
      alert(res.error);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar a este miembro?')) {
      const res = await deleteFamilyMember(id);
      if (res.success) fetchData();
      else alert(res.error);
    }
  };

  const handleDeleteFamily = async () => {
    const confirmName = prompt('⚠️ ATENCIÓN: Esta acción eliminará permanentemente a TODA LA FAMILIA, incluyendo misiones, premios y a todos los miembros. Escribe el nombre de tu familia para confirmar:');
    
    if (confirmName === family?.name) {
      const res = await deleteOwnFamily();
      if (res.success) {
        alert('Familia eliminada correctamente. Serás redirigido.');
        signOut({ callbackUrl: '/goodbye' });
      } else {
        alert(res.error);
      }
    } else if (confirmName !== null) {
      alert('El nombre no coincide. No se eliminó la familia.');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
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
              Código Secreto de la Familia
            </p>
            <h2 style={{ fontSize: '1.8rem', color: 'var(--accent-color)', margin: '5px 0' }}>{family.code}</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Dáselo a tus hijos para que puedan entrar a su aventura.</p>
          </div>
          <div style={{ fontSize: '3rem', opacity: 0.5 }}>🛡️</div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Equipo Familiar</h2>
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
              <select 
                name="role" 
                value={formRole}
                onChange={(e) => setFormRole(e.target.value as any)}
                style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', color: 'white' }}
              >
                <option value="child" style={{ color: 'black' }}>Hijo / Jugador</option>
                <option value="parent" style={{ color: 'black' }}>Pareja / Admin</option>
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
                {member.role === 'parent' && (
                  <input name="email" type="email" defaultValue={member.email} placeholder="Email de acceso" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px', color: 'white' }} />
                )}
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
                    <button onClick={() => { setEditingId(member.id); setSelectedAvatar(member.image || '👤'); }} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '8px' }}>
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
                  Eliminar la cuenta familiar es una acción irreversible. Se borrarán todos los miembros, misiones, premios e historial para siempre.
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
              Eliminar Familia
            </button>
          </div>
        </div>
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
function ApprovalsManager() {
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = async () => {
    const data = await getPendingApprovals();
    setPending(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (id: string) => {
    const res = await approveQuest(id);
    if (res.success) fetchPending();
    else alert(res.error);
  };

  const handleReject = async (id: string) => {
    if (confirm('¿Quieres rechazar esta solicitud?')) {
      const res = await rejectQuest(id);
      if (res.success) fetchPending();
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
                <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Completó: <span style={{ color: 'white', fontWeight: 600 }}>{item.questTitle}</span></p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--gold-color)', fontSize: '0.9rem', marginTop: '5px', fontWeight: 700 }}>
                  <Coins size={14} /> Recompensa: {item.questReward} Tokens
                </div>
              </div>
            </div>
            
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
          </div>
        ))}

        {pending.length === 0 && (
          <div className="glass card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-dim)' }}>
            <CheckCircle size={48} color="var(--success-color)" style={{ marginBottom: '20px', opacity: 0.5 }} />
            <p style={{ fontSize: '1.1rem' }}>¡Todo al día! No hay misiones pendientes de revisión.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
function SuggestionsManager() {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSuggestions = async () => {
    const data = await getSuggestions();
    setSuggestions(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const handleAction = async (id: string, status: 'approved' | 'rejected') => {
    const res = await updateSuggestionStatus(id, status);
    if (res.success) fetchSuggestions();
    else alert(res.error);
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '40px' }}>Cargando sugerencias...</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ marginBottom: '30px' }}>
        <h2>Buzón de Sugerencias</h2>
        <p style={{ color: 'var(--text-dim)' }}>Ideas enviadas por tu equipo para mejorar la familia.</p>
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
                  <p style={{ fontSize: '1.05rem', lineHeight: 1.5, color: '#fff' }}>"{item.content}"</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '10px' }}>
                    Enviado el {new Date(item.createdAt).toLocaleDateString()}
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

function StatsManager() {
  const [period, setPeriod] = useState<'7d' | '30d' | 'all'>('7d');
  const [selectedChild, setSelectedChild] = useState<string>('all');
  const [members, setMembers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    const data = await getFamilyStats(period, selectedChild === 'all' ? undefined : selectedChild);
    setStats(data);
    setLoading(false);
  };

  const fetchMembers = async () => {
    const data = await getFamilyMembers();
    setMembers(data.filter(m => m.role === 'child'));
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    fetchStats();
  }, [period, selectedChild]);

  if (loading && !stats) return <div style={{ textAlign: 'center', padding: '60px' }}>Analizando datos familiares...</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h2>Estadísticas {selectedChild !== 'all' ? `de ${members.find(m => m.id === selectedChild)?.name}` : 'de la Familia'}</h2>
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
            <option value="all">Toda la Familia</option>
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
                <Coins size={28} /> {stats.summary.totalEarned}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '5px' }}>{stats.summary.questsCount} misiones</p>
            </div>
            <div className="glass card" style={{ textAlign: 'center', borderTop: '4px solid var(--accent-color)' }}>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '10px' }}>Tokens Canjeados</p>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <Trophy size={28} /> {stats.summary.totalSpent}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '5px' }}>{stats.summary.rewardsCount} premios</p>
            </div>
          </div>

          <div className="glass card">
            <h3 style={{ marginBottom: '20px' }}>Actividad Reciente</h3>
            <div style={{ display: 'grid', gap: '15px' }}>
              {stats.transactions.map((t: any) => (
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
                      {new Date(t.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              {stats.transactions.length === 0 && (
                <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-dim)' }}>No hay actividad registrada en este período.</p>
              )}
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
