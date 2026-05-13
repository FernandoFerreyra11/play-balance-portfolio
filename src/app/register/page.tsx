'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { UserPlus, ArrowRight, Loader2, Mail, Lock, User } from 'lucide-react';
import { registerUser } from '../actions/auth';
import Link from 'next/link';

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const result = await registerUser(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push('/login?registered=true');
    }
  };

  return (
    <div className="container" style={{ minHeight: '90vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass card" 
        style={{ width: '100%', maxWidth: '450px', padding: '40px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>Crear <span style={{ color: 'var(--accent-color)' }}>Cuenta</span></h1>
          <p style={{ color: 'var(--text-dim)' }}>Comienza tu aventura familiar</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
          <div style={{ display: 'grid', gap: '8px' }}>
            <label style={{ fontSize: '0.9rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={16} /> Nombre Completo
            </label>
            <input 
              name="name"
              type="text" 
              placeholder="Juan Pérez"
              required
              style={{
                width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', 
                borderRadius: '12px', padding: '12px', color: 'white', outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'grid', gap: '8px' }}>
            <label style={{ fontSize: '0.9rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mail size={16} /> Email
            </label>
            <input 
              name="email"
              type="email" 
              placeholder="papa@familia.com"
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
            {loading ? <Loader2 className="animate-spin" size={20} /> : <>Registrarme <ArrowRight size={20} /></>}
          </button>

          <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-dim)', marginTop: '10px' }}>
            ¿Ya tienes cuenta? <Link href="/login" style={{ color: 'var(--accent-color)', textDecoration: 'none', fontWeight: 600 }}>Inicia sesión</Link>
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
