'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Stethoscope, 
  Users, 
  TrendingUp, 
  Plus, 
  LogOut,
  ChevronRight,
  ClipboardList,
  Building2,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { createOrganization, createPatientFamily, linkExistingFamily, upgradeProPlan } from '../actions/pro';
import UpgradeModal from '@/components/UpgradeModal';

interface PatientFamilyItem {
  id: string;
  name: string;
  code: string;
}

interface ProStats {
  activePatients?: number;
}

interface ProDashboardClientProps {
  initialStats: ProStats | null;
  initialFamilies: PatientFamilyItem[];
  hasOrganization?: boolean;
}

export default function ProDashboardClient({ initialStats, initialFamilies, hasOrganization }: ProDashboardClientProps) {
  const { data: session } = useSession();
  const families = initialFamilies || [];
  const stats = initialStats || {};
  const [loading, setLoading] = useState(false);
  const [showAddFamily, setShowAddFamily] = useState(false);
  const [showOrgForm, setShowOrgForm] = useState(
    (session?.user as { role?: string })?.role === 'professional' && !hasOrganization
  );
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const router = useRouter();

  const handleCreateOrg = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await createOrganization(
      formData.get('name') as string,
      formData.get('slug') as string
    );
    if (res.success) {
      setNotification({ message: 'Clínica/Organización configurada con éxito', type: 'success' });
      setShowOrgForm(false);
      // Actualizar datos sin recargar la página completa
      router.refresh();
    } else {
      setNotification({ message: res.error || 'Error', type: 'error' });
    }
    setLoading(false);
  };

  const handleAddFamily = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await createPatientFamily(formData.get('name') as string);
    if (res.success) {
      setNotification({ message: 'Nuevo caso familiar creado', type: 'success' });
      setShowAddFamily(false);
      router.refresh();
    } else if (res.error === 'UPGRADE_REQUIRED') {
      setShowUpgradeModal(true);
      setShowAddFamily(false);
    } else {
      setNotification({ message: res.error || 'Error', type: 'error' });
    }
    setLoading(false);
  };

  const handleLinkFamily = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const code = (formData.get('code') as string).trim();
    const res = await linkExistingFamily(code);
    if (res.success) {
      setNotification({ message: 'Familia vinculada con éxito', type: 'success' });
      setShowAddFamily(false);
      router.refresh();
    } else if (res.error === 'UPGRADE_REQUIRED') {
      setShowUpgradeModal(true);
      setShowAddFamily(false);
    } else {
      setNotification({ message: res.error || 'Error', type: 'error' });
    }
    setLoading(false);
  };

  const handleUpgrade = async () => {
    setUpgradeLoading(true);
    const res = await upgradeProPlan('unlimited');
    if (res.success) {
      setShowUpgradeModal(false);
      setNotification({ message: '¡Plan Profesional Premium activado con éxito!', type: 'success' });
      router.refresh();
    } else {
      setNotification({ message: 'Error al procesar suscripción', type: 'error' });
    }
    setUpgradeLoading(false);
  };

  return (
    <div style={{ padding: 'clamp(15px, 5vw, 40px)', maxWidth: '1200px', margin: '0 auto' }}>
      
      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
        mode="pro"
        onSubscribe={handleUpgrade}
        isLoading={upgradeLoading}
      />

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
              <AlertCircle size={16} /> {/* O un icono de X, usamos AlertCircle por simplicidad o podríamos importar X */}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
          <div style={{ 
            padding: '15px', background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)', 
            borderRadius: '20px', boxShadow: '0 10px 20px rgba(6, 182, 212, 0.3)' 
          }}>
            <Stethoscope size={32} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 800 }}>Panel Profesional</h1>
            <p style={{ color: '#94a3b8' }}>Bienvenido de nuevo, Dr. {session?.user?.name}</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '15px' }}>
          <button onClick={() => signOut({ callbackUrl: '/' })} className="glass" style={{ padding: '10px 20px', borderRadius: '12px', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
            <LogOut size={18} /> Salir
          </button>
        </div>
      </header>

      {/* Si no tiene organización, mostrar form obligatorio */}
      {showOrgForm && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass" style={{ padding: '40px', borderRadius: '30px', marginBottom: '40px', border: '1px solid #06b6d4' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px', color: '#06b6d4' }}>
            <Building2 size={24} />
            <h2 style={{ fontSize: '1.5rem' }}>Configura tu Clínica o Práctica</h2>
          </div>
          <p style={{ color: '#94a3b8', marginBottom: '30px' }}>Para empezar a gestionar pacientes, necesitamos los datos de tu centro o consulta profesional.</p>
          <form onSubmit={handleCreateOrg} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Nombre de la Clínica/Consulta</label>
              <input name="name" required placeholder="Ej: Centro de Psicología Victoria" style={{ padding: '12px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Slug para tu URL (solo letras y guiones)</label>
              <input name="slug" required placeholder="ej: clinica-victoria" style={{ padding: '12px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
            </div>
            <button disabled={loading} type="submit" className="btn-primary" style={{ gridColumn: '1 / -1', padding: '15px' }}>
              {loading ? 'Configurando...' : 'Confirmar y Empezar'}
            </button>
          </form>
        </motion.div>
      )}

      {/* Stats rápidas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <StatCard icon={<Users color="#06b6d4" />} title="Total Pacientes" value={stats?.activePatients || 0} />
        <StatCard icon={<TrendingUp color="#10b981" />} title="Cumplimiento Global" value="84%" />
        <StatCard icon={<ClipboardList color="#8b5cf6" />} title="Misiones Activas" value="12" />
      </div>

      {/* Listado de Familias/Casos */}
      <div className="glass" style={{ padding: '20px', borderRadius: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '30px' }}>
          <h2 style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={24} /> Casos Bajo Supervisión
          </h2>
          <button 
            onClick={() => setShowAddFamily(!showAddFamily)}
            className="btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', width: 'fit-content' }}
          >
            <Plus size={18} /> Nuevo Paciente
          </button>
        </div>

        {showAddFamily && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} style={{ marginBottom: '30px', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
              {/* Opción A: Crear Nuevo */}
              <div className="glass" style={{ padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <h3 style={{ marginBottom: '10px', fontSize: '1.1rem' }}>Opción A: Crear Nuevo Caso</h3>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '15px' }}>Si la familia aún no usa PlayBalance, crea un perfil y dales su nuevo Código.</p>
                <form onSubmit={handleAddFamily} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input name="name" required placeholder="Nombre de familia (ej: Familia Pérez)" style={{ padding: '12px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                  <button disabled={loading} type="submit" className="btn-primary" style={{ padding: '12px' }}>
                    {loading ? 'Procesando...' : 'Crear y Generar Código'}
                  </button>
                </form>
              </div>

              {/* Opción B: Vincular Existente */}
              <div className="glass" style={{ padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <h3 style={{ marginBottom: '10px', fontSize: '1.1rem' }}>Opción B: Vincular Existente</h3>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '15px' }}>Si la familia ya usa la app, pídeles su "Código de Equipo" para supervisarlos.</p>
                <form onSubmit={handleLinkFamily} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input name="code" required placeholder="Ej: F-ABCDEF" style={{ padding: '12px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                  <button disabled={loading} type="submit" className="glass" style={{ padding: '12px', border: '1px solid #06b6d4', color: '#06b6d4', cursor: 'pointer', borderRadius: '12px', fontWeight: 600 }}>
                    {loading ? 'Buscando...' : 'Vincular Caso'}
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        )}

        <div style={{ display: 'grid', gap: '15px' }}>
          {families.map((family: PatientFamilyItem) => (
            <Link key={family.id} href={`/pro/family/${family.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <motion.div 
                whileHover={{ x: 10, background: 'rgba(255,255,255,0.05)' }}
                style={{ 
                  padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                  <div style={{ width: '50px', height: '50px', borderRadius: '15px', background: 'rgba(6, 182, 212, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                    👪
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '2px' }}>{family.name}</h3>
                    <div style={{ display: 'flex', gap: '15px', fontSize: '0.8rem', color: '#94a3b8', flexWrap: 'wrap' }}>
                      <span>Código: {family.code}</span>
                    </div>
                  </div>
                </div>
                <ChevronRight color="#475569" />
              </motion.div>
            </Link>
          ))}
          {families.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px', color: '#475569' }}>
              No tienes pacientes asignados todavía. Comienza creando tu primer caso.
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .glass {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(10px);
        }
        .btn-primary {
          background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(6, 182, 212, 0.4);
        }
        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
}

function StatCard({ icon, title, value }: StatCardProps) {
  return (
    <div className="glass" style={{ padding: '25px', borderRadius: '25px', display: 'flex', gap: '20px', alignItems: 'center' }}>
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
