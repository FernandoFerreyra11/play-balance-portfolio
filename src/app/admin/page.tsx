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
  Coins
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { getFamilyMembers, createFamilyMember } from '../actions/family';

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('family'); // Empezamos por familia ahora

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

function FamilyManager() {
  const [members, setMembers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

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
    const res = await createFamilyMember(formData);
    if (res.success) {
      setShowForm(false);
      fetchMembers();
    } else {
      alert(res.error);
    }
    setLoading(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Miembros de la Familia</h2>
        <button 
          onClick={() => setShowForm(!showForm)}
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
            <div style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Rol</label>
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
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
        {members.map((member) => (
          <div key={member.id} className="glass card" style={{ position: 'relative' }}>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <div style={{ 
                width: '50px', height: '50px', 
                background: member.role === 'parent' ? 'var(--accent-color)' : 'var(--primary-color)', 
                borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center',
                fontSize: '1.2rem'
              }}>
                {member.name[0].toUpperCase()}
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem' }}>{member.name}</h3>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>{member.role === 'parent' ? 'Pareja/Admin' : 'Hijo/Jugador'}</p>
              </div>
            </div>
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--gold-color)', fontWeight: 700 }}>
                <Coins size={16} /> {member.balance} Tokens
              </div>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                <Trash2 size={18} />
              </button>
            </div>
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
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 20px',
        borderRadius: '12px',
        border: 'none',
        background: active ? 'var(--accent-color)' : 'var(--surface-color)',
        color: active ? 'white' : 'var(--text-dim)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        fontWeight: 600
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function QuestsManager() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Misiones de Valor</h2>
        <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> Nueva Misión
        </button>
      </div>
      
      <div style={{ display: 'grid', gap: '15px' }}>
        {[1, 2].map((i) => (
          <div key={i} className="glass card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem' }}>Lectura Diaria {i}</h3>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Leer un libro durante 15 minutos.</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <span style={{ color: 'var(--gold-color)', fontWeight: 700 }}>+20 Tokens</span>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}><Trash2 size={18} /></button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function RewardsManager() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Catálogo de Premios</h2>
        <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> Nuevo Premio
        </button>
      </div>
      <div className="glass card" style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '40px' }}>
        No hay premios configurados todavía.
      </div>
    </motion.div>
  );
}

function ApprovalsManager() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h2 style={{ marginBottom: '20px' }}>Pendientes de Aprobación</h2>
      <div className="glass card" style={{ borderLeft: '4px solid var(--gold-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <div style={{ width: '40px', height: '40px', background: 'var(--primary-color)', borderRadius: '50%' }}></div>
            <div>
              <h3 style={{ fontSize: '1.1rem' }}>Mateo completó "Lectura"</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Hace 10 minutos</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--danger-color)', background: 'none', color: 'var(--danger-color)', cursor: 'pointer' }}><XCircle size={20} /></button>
            <button style={{ padding: '8px', borderRadius: '8px', background: 'var(--success-color)', border: 'none', color: 'white', cursor: 'pointer' }}><CheckCircle size={20} /></button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function SuggestionsManager() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h2 style={{ marginBottom: '20px' }}>Buzón de Ideas 💡</h2>
      <div className="glass card">
        <p style={{ fontStyle: 'italic', marginBottom: '15px' }}>"Papá, ¿podemos poner una misión de lavar el auto por 100 tokens?"</p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="text" 
            placeholder="Responder..." 
            style={{ flex: 1, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', color: 'white' }}
          />
          <button className="btn-primary">Aceptar y Crear Tarea</button>
        </div>
      </div>
    </motion.div>
  );
}
