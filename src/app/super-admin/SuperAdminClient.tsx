'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { signOut } from 'next-auth/react';
import { 
  ShieldCheck, 
  Users, 
  Globe, 
  Activity, 
  Search, 
  TrendingUp, 
  Award,
  Zap,
  Trash2,
  RefreshCw,
  Edit2,
  LogOut
} from 'lucide-react';
import { getGlobalStats, getAllFamilies, deleteFamily, resetFamilyCode, updateFamilyName } from '../actions/super-admin';

interface FamilyItem {
  id: string;
  name: string;
  code: string;
  memberCount: number;
  createdAt: Date | null;
}

interface GlobalStats {
  families: number;
  users: number;
  quests: number;
  tokens: number;
}

export default function SuperAdminClient() {
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [families, setFamilies] = useState<FamilyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    const [statsData, familiesData] = await Promise.all([
      getGlobalStats(),
      getAllFamilies()
    ]);
    setStats(statsData as GlobalStats);
    setFamilies(familiesData as FamilyItem[]);
    setLoading(false);
  };

  useEffect(() => {
    // Wrap in a promise resolve callback to avoid calling setState synchronously within the effect body
    Promise.resolve().then(() => {
      fetchData();
    });
  }, []);

  const handleResetCode = async (id: string, name: string) => {
    if (confirm(`¿Estás seguro de resetear el código de la familia ${name}?`)) {
      const res = await resetFamilyCode(id, name);
      if (res.success) {
        alert(`Nuevo código generado: ${res.newCode}`);
        fetchData();
      }
    }
  };

  const handleDeleteFamily = async (id: string, name: string) => {
    if (confirm(`⚠️ ¡ATENCIÓN! Estás a punto de borrar a toda la familia ${name} y TODOS sus usuarios. Esta acción no se puede deshacer. ¿Continuar?`)) {
      const res = await deleteFamily(id);
      if (res.success) fetchData();
    }
  };

  const handleUpdateName = async (id: string, currentName: string) => {
    const newName = prompt("Nuevo nombre para la familia:", currentName);
    if (newName && newName !== currentName) {
      const res = await updateFamilyName(id, newName);
      if (res.success) fetchData();
    }
  };

  const filteredFamilies = families.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && !stats) return (
    <div style={{ 
      height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center',
      background: '#0a0a0a', color: 'white', fontFamily: 'system-ui'
    }}>
      <motion.div
        animate={{ scale: [1, 1.2, 1], rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <ShieldCheck size={48} color="#06b6d4" />
      </motion.div>
    </div>
  );

  return (
    <div style={{ 
      minHeight: '100vh', background: '#0a0a0a', color: 'white', 
      padding: '40px', fontFamily: 'system-ui' 
    }}>
      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#06b6d4', marginBottom: '5px' }}>
            <ShieldCheck size={20} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px' }}>Control Center</span>
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Global Overview</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div className="glass" style={{ padding: '10px 20px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <Activity size={24} className="pulse" />
          </div>
          <button 
            onClick={() => signOut({ callbackUrl: '/' })}
            className="glass" 
            style={{ 
              padding: '10px 15px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--text-dim)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-dim)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
          >
            <LogOut size={20} />
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Salir</span>
          </button>
        </div>
      </header>

      {/* Global Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <StatCard title="Total Families" value={stats?.families || 0} icon={<Globe />} color="#3b82f6" />
        <StatCard title="Total Users" value={stats?.users || 0} icon={<Users />} color="#8b5cf6" />
        <StatCard title="Quests Created" value={stats?.quests || 0} icon={<Zap />} color="#f59e0b" />
        <StatCard title="Tokens Circulation" value={stats?.tokens || 0} icon={<TrendingUp />} color="#10b981" />
      </div>

      {/* Families Section */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Award size={24} /> Registered Families
          </h2>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
            <input 
              type="text" 
              placeholder="Search family..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="glass"
              style={{ 
                padding: '10px 15px 10px 40px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)',
                color: 'white', width: '250px', outline: 'none'
              }}
            />
          </div>
        </div>

        <div className="glass" style={{ borderRadius: '20px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                <th style={{ padding: '20px' }}>Family Name</th>
                <th style={{ padding: '20px' }}>Access Code</th>
                <th style={{ padding: '20px' }}>Members</th>
                <th style={{ padding: '20px' }}>Created At</th>
                <th style={{ padding: '20px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFamilies.map((f) => (
                <tr key={f.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }} className="table-row">
                  <td style={{ padding: '20px', fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {f.name}
                      <button onClick={() => handleUpdateName(f.id, f.name)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                        <Edit2 size={14} />
                      </button>
                    </div>
                  </td>
                  <td style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <code style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '6px', color: '#06b6d4' }}>
                        {f.code}
                      </code>
                      <button onClick={() => handleResetCode(f.id, f.name)} title="Resetear Código" style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                        <RefreshCw size={14} />
                      </button>
                    </div>
                  </td>
                  <td style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Users size={16} /> {f.memberCount}
                    </div>
                  </td>
                  <td style={{ padding: '20px', color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>
                    {f.createdAt ? new Date(f.createdAt).toLocaleDateString() : 'N/A'}
                  </td>
                  <td style={{ padding: '20px' }}>
                    <button 
                      onClick={() => handleDeleteFamily(f.id, f.name)}
                      style={{ 
                        background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', 
                        padding: '8px', borderRadius: '8px', cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredFamilies.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
              No families found matching your search.
            </div>
          )}
        </div>
      </section>

      <style jsx>{`
        .StatCard {
          transition: transform 0.2s;
        }
        .StatCard:hover {
          transform: translateY(-5px);
        }
        .table-row:hover {
          background: rgba(255,255,255,0.02);
        }
        .pulse {
          animation: pulse-animation 2s infinite;
          color: #ef4444;
        }
        @keyframes pulse-animation {
          0% { transform: scale(0.95); opacity: 0.7; }
          50% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <div className="glass StatCard" style={{ 
      padding: '25px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)',
      background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
        <div style={{ padding: '12px', borderRadius: '16px', background: `${color}15`, color }}>
          {icon}
        </div>
      </div>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', marginBottom: '5px' }}>{title}</p>
      <h3 style={{ fontSize: '2rem', fontWeight: 800 }}>{value.toLocaleString()}</h3>
    </div>
  );
}
