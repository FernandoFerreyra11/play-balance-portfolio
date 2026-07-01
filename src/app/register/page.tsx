'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2, Mail, Lock, User } from 'lucide-react';
import { registerUser } from '../actions/auth';
import Link from 'next/link';

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const [role, setRole] = useState<'parent' | 'professional' | 'org_admin'>('parent');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    formData.append('role', role);
    const result = await registerUser(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push('/login?registered=true');
    }
  };

  return (
    <div className="container" style={{ minHeight: '90vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px 0' }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass card" 
        style={{ width: '100%', maxWidth: '500px', padding: '40px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>Crear <span style={{ color: 'var(--accent-color)' }}>Cuenta</span></h1>
          <p style={{ color: 'var(--text-dim)' }}>Únete a la aventura de Play Balance</p>
        </div>

        {/* Selector de Rol */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', background: 'rgba(0,0,0,0.2)', padding: '5px', borderRadius: '15px' }}>
          <RoleButton active={role === 'parent'} onClick={() => setRole('parent')} label="Familia" />
          <RoleButton active={role === 'professional'} onClick={() => setRole('professional')} label="Profesional" />
          {/* <RoleButton active={role === 'org_admin'} onClick={() => setRole('org_admin')} label="Institución" /> */}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
          <div style={{ display: 'grid', gap: '8px' }}>
            <label style={{ fontSize: '0.9rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={16} /> {role === 'org_admin' ? 'Nombre del Director' : 'Nombre Completo'}
            </label>
            <input 
              name="name"
              type="text" 
              placeholder={role === 'org_admin' ? 'Ej: Dr. García' : 'Ej: Juan Pérez'}
              required
              style={{
                width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', 
                borderRadius: '12px', padding: '12px', color: 'white', outline: 'none'
              }}
            />
          </div>

          {role === 'parent' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🩺 Código de Profesional (Opcional)
              </label>
              <input 
                name="familyCode"
                type="text" 
                placeholder="Ej: PRO-XXXXXX (Si un terapeuta te invitó)"
                style={{
                  width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', 
                  borderRadius: '12px', padding: '12px', color: 'white', outline: 'none'
                }}
              />
            </motion.div>
          )}

          {/* PASO 3 (Frontend): Mostramos este bloque en pantalla únicamente si el usuario elige el botón Profesional */}
          {role === 'professional' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🎓 Matrícula Profesional
              </label>
              <input 
                name="licenseNumber"
                type="text" 
                placeholder="Ej: MN-12345"
                required
                style={{
                  width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', 
                  borderRadius: '12px', padding: '12px', color: 'white', outline: 'none'
                }}
              />
            </motion.div>
          )}

          {role === 'org_admin' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🏢 Nombre de la Institución
              </label>
              <input 
                name="organizationName"
                type="text" 
                placeholder="Ej: Centro Terapéutico Sol"
                required
                style={{
                  width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', 
                  borderRadius: '12px', padding: '12px', color: 'white', outline: 'none'
                }}
              />
            </motion.div>
          )}

          <div style={{ display: 'grid', gap: '8px' }}>
            <label style={{ fontSize: '0.9rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mail size={16} /> Email {role === 'org_admin' ? 'Institucional' : ''}
            </label>
            <input 
              name="email"
              type="email" 
              placeholder="email@ejemplo.com"
              required
              style={{
                width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', 
                borderRadius: '12px', padding: '12px', color: 'white', outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'grid', gap: '8px' }}>
            <label style={{ fontSize: '0.9rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={16} /> Contraseña
            </label>
            <input 
              name="password"
              type="password" 
              placeholder="••••••••"
              required
              minLength={6}
              style={{
                width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', 
                borderRadius: '12px', padding: '12px', color: 'white', outline: 'none'
              }}
            />
          </div>

          {error && (
            <p style={{ color: 'var(--danger-color)', fontSize: '0.85rem', textAlign: 'center' }}>
              {error}
            </p>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary" 
            style={{ marginTop: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <>Crear mi cuenta <ArrowRight size={20} /></>}
          </button>

          <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-dim)', marginTop: '10px' }}>
            ¿Ya tienes cuenta? <Link href="/login" style={{ color: 'var(--accent-color)', textDecoration: 'none', fontWeight: 600 }}>Inicia sesión</Link>
          </p>

          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: '5px' }}>
            ¿Tuviste un equipo antes y quieres recuperarlo? <Link href="/login" style={{ color: 'var(--primary-color)', textDecoration: 'underline' }}>Entra aquí</Link>
          </p>
        </form>
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

interface RoleButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
}

function RoleButton({ active, onClick, label }: RoleButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        padding: '10px',
        border: 'none',
        borderRadius: '12px',
        background: active ? 'var(--accent-color)' : 'transparent',
        color: active ? 'white' : 'var(--text-dim)',
        fontWeight: 700,
        cursor: 'pointer',
        transition: 'all 0.2s'
      }}
    >
      {label}
    </button>
  );
}
