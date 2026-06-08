'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { RefreshCw, Trash2, Loader2, ArrowLeft } from 'lucide-react';
import { restoreFamily, hardDeleteOwnFamily } from '@/app/actions/family';

export default function WelcomeBackPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState<'restore' | 'delete' | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && !(session?.user as any)?.isArchived) {
      router.push('/');
    }
  }, [status, session, router]);

  if (status === 'loading' || (status === 'authenticated' && !(session?.user as any)?.isArchived)) {
    return <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Loader2 className="animate-spin" size={32} color="var(--primary-color)" /></div>;
  }

  const handleRestore = async () => {
    setLoading('restore');
    const res = await restoreFamily();
    if (res.success) {
      await update({ isArchived: false }); // Refrescar la sesión para limpiar isArchived
      window.location.href = '/'; // Recargar la página principal
    } else {
      alert(res.error || 'Hubo un problema al restaurar tu cuenta.');
      setLoading(null);
    }
  };

  const handleStartFresh = async () => {
    if (confirm('⚠️ ¿Estás completamente seguro? Esta acción borrará TODO tu historial anterior de forma definitiva para empezar de cero.')) {
      setLoading('delete');
      const res = await hardDeleteOwnFamily();
      if (res.success) {
        alert('Cuenta anterior eliminada. Ahora puedes registrarte como una familia nueva.');
        await signOut({ callbackUrl: '/register' });
      } else {
        alert(res.error || 'Hubo un problema al borrar tu cuenta.');
        setLoading(null);
      }
    }
  };

  return (
    <div className="container" style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass card"
        style={{ maxWidth: '600px', width: '100%', padding: '40px', textAlign: 'center', borderTop: '6px solid var(--accent-color)' }}
      >
        <div style={{ fontSize: '4rem', marginBottom: '10px' }}>👋</div>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '15px' }}>¡Qué bueno verte de nuevo!</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem', marginBottom: '40px', lineHeight: 1.6 }}>
          Vemos que tú y tu equipo ({session?.user?.name}) estuvieron jugando con PlayBalance en el pasado y decidieron tomarse un descanso. 
          <br /><br />
          Tus datos aún están guardados a salvo. ¿Qué te gustaría hacer ahora?
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Opción 1: Restaurar */}
          <div className="glass" style={{ padding: '25px', borderRadius: '20px', border: '1px solid var(--accent-color)', background: 'rgba(6, 182, 212, 0.05)', textAlign: 'left' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-color)', marginBottom: '10px' }}>
              <RefreshCw size={24} /> Continuar mi aventura
            </h3>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '15px' }}>
              Restauraremos tu equipo, misiones, premios y saldo de tokens exactamente como los dejaste.
            </p>
            <button 
              onClick={handleRestore}
              disabled={loading !== null}
              className="btn-primary"
              style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}
            >
              {loading === 'restore' ? <Loader2 className="animate-spin" size={20} /> : '¡Restaurar y entrar!'}
            </button>
          </div>

          {/* Opción 2: Empezar de cero */}
          <div className="glass" style={{ padding: '25px', borderRadius: '20px', border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.05)', textAlign: 'left' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444', marginBottom: '10px' }}>
              <Trash2 size={24} /> Empezar desde cero
            </h3>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '15px' }}>
              Borraremos permanentemente el historial anterior de toda la familia para que puedas crear un equipo nuevo con un lienzo en blanco.
            </p>
            <button 
              onClick={handleStartFresh}
              disabled={loading !== null}
              style={{ 
                width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px',
                background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '12px', borderRadius: '12px', cursor: 'pointer', fontWeight: 600
              }}
            >
              {loading === 'delete' ? <Loader2 className="animate-spin" size={20} /> : 'Borrar todo e iniciar de cero'}
            </button>
          </div>
        </div>

        <div style={{ marginTop: '30px' }}>
          <button 
            onClick={() => signOut({ callbackUrl: '/login' })}
            style={{ background: 'none', border: 'none', color: 'var(--text-dim)', display: 'inline-flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}
          >
            <ArrowLeft size={16} /> Cambiar de cuenta
          </button>
        </div>
      </motion.div>
      
      <style jsx>{`
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
