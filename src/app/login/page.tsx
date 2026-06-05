'use client';

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { User, ShieldCheck, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

function LoginForm() {
  const [role, setRole] = useState<'parent' | 'child' | null>(null);
  const [email, setEmail] = useState('');
  const [familyCode, setFamilyCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get('registered');

  const handleMagicLink = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!email) { setError('Por favor ingresa tu email primero para enviarte el enlace.'); return; }
    setLoading(true);
    setError('');
    
    const res = await signIn('email', {
      email,
      redirect: false,
    });
    
    if (res?.error) {
      setError('Error al enviar el enlace. Verifica tu correo.');
    } else {
      setError('¡Enlace mágico enviado! Revisa tu bandeja de entrada para entrar sin contraseña.');
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await signIn('credentials', {
      email,
      familyCode,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError(role === 'parent' 
        ? 'Credenciales inválidas. Revisa tu email y contraseña.' 
        : 'Nombre, código de familia o contraseña incorrectos.');
      setLoading(false);
    } else {
      // Obtenemos la sesión para ver el rol real
      const session = await getSession();
      const userRole = (session?.user as { role?: string })?.role;

      if (userRole === 'super_admin') {
        router.push('/super-admin');
      } else if (userRole === 'professional') {
        router.push('/pro');
      } else if (userRole === 'org_admin') {
        router.push('/institucion');
      } else {
        router.push(role === 'parent' ? '/admin' : '/');
      }
      router.refresh();
    }
  };

  return (
    <div className="glass card" style={{ width: '100%', maxWidth: '450px', padding: '40px' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>Play<span style={{ color: 'var(--primary-color)' }}>Balance</span></h1>
        <p style={{ color: 'var(--text-dim)' }}>Tu aventura comienza aquí</p>
        
        {registered && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ 
              marginTop: '20px', padding: '10px', background: 'rgba(16, 185, 129, 0.2)', 
              borderRadius: '12px', color: 'var(--success-color)', display: 'flex', 
              alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.9rem' 
            }}
          >
            <CheckCircle2 size={18} /> ¡Cuenta creada! Ya puedes entrar.
          </motion.div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!role ? (
          <motion.div 
            key="role-selection"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            style={{ display: 'grid', gap: '20px' }}
          >
            
            <button 
              onClick={() => setRole('parent')}
              className="glass" 
              style={{ 
                display: 'flex', alignItems: 'center', gap: '20px', padding: '20px', 
                cursor: 'pointer', border: '1px solid var(--border-color)', color: 'white',
                textAlign: 'left', transition: 'all 0.2s'
              }}
            >
              <div style={{ padding: '12px', background: 'rgba(6, 182, 212, 0.2)', borderRadius: '12px' }}>
                <ShieldCheck color="var(--accent-color)" />
              </div>
              <div>
                <h3 style={{ margin: 0 }}>Panel de Control</h3>
              </div>
            </button>

            <button 
              onClick={() => setRole('child')}
              className="glass" 
              style={{ 
                display: 'flex', alignItems: 'center', gap: '20px', padding: '20px', 
                cursor: 'pointer', border: '1px solid var(--border-color)', color: 'white',
                textAlign: 'left', transition: 'all 0.2s'
              }}
            >
              <div style={{ padding: '12px', background: 'rgba(139, 92, 246, 0.2)', borderRadius: '12px' }}>
                <User color="var(--primary-color)" />
              </div>
              <div>
                <h3 style={{ margin: 0 }}>Mi Aventura</h3>
              </div>
            </button>
          </motion.div>
        ) : (
          <motion.form 
            key="login-form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onSubmit={handleSubmit}
            style={{ display: 'grid', gap: '20px' }}
          >
            <button 
              type="button" 
              onClick={() => { setRole(null); setError(''); }}
              style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem' }}
            >
              ← Volver
            </button>

            <h2 style={{ fontSize: '1.5rem' }}>
              Entrar como {role === 'parent' ? 'Capitán' : 'Aventurero'}
            </h2>

            <div style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>
                {role === 'parent' ? 'Email' : 'Nombre de Usuario'}
              </label>
              <input 
                type={role === 'parent' ? 'email' : 'text'} 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={role === 'parent' ? 'ejemplo@email.com' : 'Tu nombre de pila'}
                required
                style={{
                  width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', 
                  borderRadius: '12px', padding: '12px', color: 'white', outline: 'none'
                }}
              />
            </div>

            {role === 'child' && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }}
                style={{ display: 'grid', gap: '8px' }}
              >
                <label style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>Código de Equipo</label>
                <input 
                  type="text" 
                  value={familyCode}
                  onChange={(e) => setFamilyCode(e.target.value.toUpperCase())}
                  placeholder="EJ: PEREZ-1234"
                  required
                  style={{
                    width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', 
                    borderRadius: '12px', padding: '12px', color: 'white', outline: 'none',
                    textTransform: 'uppercase'
                  }}
                />
              </motion.div>
            )}

            <div style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>Contraseña</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
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
              {loading ? <Loader2 className="animate-spin" size={20} /> : <>Entrar con Contraseña <ArrowRight size={20} /></>}
            </button>

            {role === 'parent' && (
              <>
                <div style={{ textAlign: 'center', margin: '10px 0', color: 'var(--text-dim)', fontSize: '0.9rem' }}>— o —</div>
                <button 
                  type="button" 
                  onClick={handleMagicLink}
                  disabled={loading}
                  className="glass" 
                  style={{ 
                    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px',
                    padding: '12px', border: '1px solid var(--accent-color)', color: 'var(--accent-color)', 
                    borderRadius: '12px', cursor: 'pointer', background: 'rgba(16, 185, 129, 0.1)', fontWeight: 600
                  }}
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : 'Enviar Enlace Mágico (Sin contraseña) 🪄'}
                </button>
              </>
            )}
          </motion.form>
        )}
      </AnimatePresence>

      <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-dim)', marginTop: '30px' }}>
        ¿No tienes una cuenta? <Link href="/register" style={{ color: 'var(--accent-color)', textDecoration: 'none', fontWeight: 600 }}>Registrarse</Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="container" style={{ minHeight: '90vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Suspense fallback={<div className="glass card" style={{ padding: '40px' }}><Loader2 className="animate-spin" /></div>}>
        <LoginForm />
      </Suspense>

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
