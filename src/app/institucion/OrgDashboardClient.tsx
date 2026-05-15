'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  Users, 
  Plus, 
  LogOut,
  ChevronRight,
  TrendingUp,
  Award,
  CheckCircle,
  XCircle,
  Mail,
  Lock,
  UserPlus
} from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { createProfessional } from '../actions/org';

export default function OrgDashboardClient({ initialStats, initialProfessionals }: any) {
  const { data: session }: any = useSession();
  const [professionals, setProfessionals] = useState(initialProfessionals);
  const [stats, setStats] = useState(initialStats);
  const [loading, setLoading] = useState(false);
  const [showAddPro, setShowAddPro] = useState(false);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const handleAddPro = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await createProfessional(formData);
    if (res.success) {
      setNotification({ message: 'Profesional añadido al equipo', type: 'success' });
      setShowAddPro(false);
      window.location.reload();
    } else {
      setNotification({ message: res.error || 'Error', type: 'error' });
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Notificación */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 20, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            style={{
              position: 'fixed', top: 0, left: '50%', zIndex: 1000,
              background: notification.type === 'success' ? '#10b981' : '#ef4444',
              color: 'white', padding: '12px 25px', borderRadius: '12px',
              display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600
            }}
          >
            {notification.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '60px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ 
            padding: '15px', background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', 
            borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <Building2 size={32} color="#06b6d4" />
          </div>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>{stats.orgName}</h1>
            <p style={{ color: '#94a3b8' }}>Gestión Institucional • Director: {session?.user?.name}</p>
          </div>
        </div>
        
        <button onClick={() => signOut({ callbackUrl: '/' })} className="glass" style={{ padding: '10px 20px', borderRadius: '12px', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LogOut size={18} /> Salir
        </button>
      </header>

      {/* Stats Ejecutivas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
        <StatCard icon={<Users color="#06b6d4" />} title="Equipo Profesional" value={stats.professionalsCount || 0} />
        <StatCard icon={<Award color="#10b981" />} title="Pacientes en el Centro" value={stats.totalPatients || 0} />
        <StatCard icon={<TrendingUp color="#8b5cf6" />} title="Eficiencia de Equipo" value="92%" />
      </div>

      {/* Gestión de Equipo */}
      <div className="glass" style={{ padding: '30px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <UserPlus size={24} color="#06b6d4" /> Equipo Médico / Docente
          </h2>
          <button 
            onClick={() => setShowAddPro(!showAddPro)}
            className="btn-executive" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
          >
            <Plus size={18} /> Añadir Profesional
          </button>
        </div>

        {showAddPro && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} style={{ marginBottom: '30px', overflow: 'hidden' }}>
            <form onSubmit={handleAddPro} className="glass" style={{ padding: '30px', borderRadius: '20px', border: '1px solid rgba(6, 182, 212, 0.3)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div style={{ display: 'grid', gap: '8px' }}>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Nombre Completo</label>
                <input name="name" required placeholder="Dr. Ejemplo" style={{ padding: '12px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
              </div>
              <div style={{ display: 'grid', gap: '8px' }}>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Email de Acceso</label>
                <input name="email" type="email" required placeholder="pro@clinica.com" style={{ padding: '12px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
              </div>
              <div style={{ display: 'grid', gap: '8px', gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Contraseña Temporal</label>
                <input name="password" type="password" required placeholder="********" style={{ padding: '12px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
              </div>
              <button disabled={loading} type="submit" className="btn-executive" style={{ gridColumn: '1 / -1', padding: '15px' }}>
                {loading ? 'Creando...' : 'Dar de Alta Profesional'}
              </button>
            </form>
          </motion.div>
        )}

        <div style={{ display: 'grid', gap: '15px' }}>
          {professionals.map((pro: any) => (
            <motion.div 
              key={pro.id}
              whileHover={{ background: 'rgba(255,255,255,0.05)' }}
              style={{ 
                padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '15px', background: 'rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.2rem' }}>
                  👨‍⚕️
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '2px' }}>{pro.name}</h3>
                  <div style={{ display: 'flex', gap: '15px', fontSize: '0.8rem', color: '#94a3b8' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Mail size={14} /> {pro.email}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <TrendingUp size={14} color="#10b981" /> 100% actividad
                    </span>
                  </div>
                </div>
              </div>
              <button className="glass" style={{ padding: '8px 15px', borderRadius: '8px', fontSize: '0.8rem', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
                Ver Rendimiento
              </button>
            </motion.div>
          ))}
          {professionals.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px', color: '#475569' }}>
              No hay profesionales registrados en tu institución.
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .glass {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(10px);
        }
        .btn-executive {
          background: #ffffff;
          color: #000000;
          border: none;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-executive:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(255, 255, 255, 0.2);
          background: #f8fafc;
        }
        .btn-executive:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

function StatCard({ icon, title, value }: any) {
  return (
    <div className="glass" style={{ padding: '25px', borderRadius: '25px', display: 'flex', gap: '20px', alignItems: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '15px' }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '2px' }}>{title}</p>
        <p style={{ fontSize: '1.5rem', fontWeight: 800 }}>{value}</p>
      </div>
    </div>
  );
}
