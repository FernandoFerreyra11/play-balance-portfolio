'use client';

import { useState } from 'react';
import { Coins, Book, Gamepad2, Smartphone, Trophy, MessageSquarePlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const [tokens, setTokens] = useState(150);
  const [showSuggestion, setShowSuggestion] = useState(false);

  return (
    <div className="container">
      {/* Header con Saldo */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '40px 0' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 700 }}>Hola, <span style={{ color: 'var(--primary-color)' }}>Mateo</span>! 👋</h1>
          <p style={{ color: 'var(--text-dim)' }}>¿Qué aventura elegiremos hoy?</p>
        </div>
        <div className="glass card floating" style={{ textAlign: 'center', minWidth: '200px' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Tus Fichas</p>
          <div className="token-balance">
            <Coins size={32} />
            {tokens}
          </div>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        
        {/* Sección de Misiones */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Trophy color="var(--primary-color)" />
            <h2 style={{ fontSize: '1.5rem' }}>Misiones Disponibles</h2>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div className="glass card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <div style={{ padding: '12px', background: 'rgba(139, 92, 246, 0.2)', borderRadius: '12px' }}>
                    <Book color="var(--primary-color)" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem' }}>Lectura de aventura</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>15 minutos de lectura = 2hs de pantalla</p>
                  </div>
                </div>
                <button className="btn-primary">+2h</button>
              </div>
            </div>

            <div className="glass card" style={{ opacity: 0.8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <div style={{ padding: '12px', background: 'rgba(6, 182, 212, 0.2)', borderRadius: '12px' }}>
                    <Trophy color="var(--accent-color)" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem' }}>Ordenar cuarto</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Tu cuarto debe quedar impecable</p>
                  </div>
                </div>
                <div style={{ color: 'var(--gold-color)', fontWeight: 600 }}>+30 Tokens</div>
              </div>
            </div>
          </div>
        </section>

        {/* Sección de Canje */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Gamepad2 color="var(--accent-color)" />
            <h2 style={{ fontSize: '1.5rem' }}>Canjear Tiempo</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="glass card" style={{ textAlign: 'center' }}>
              <Smartphone size={40} style={{ marginBottom: '15px', color: 'var(--accent-color)' }} />
              <h3>1 Hora Celular</h3>
              <p style={{ color: 'var(--gold-color)', margin: '10px 0' }}>50 Tokens</p>
              <button className="btn-primary" style={{ width: '100%' }}>Usar</button>
            </div>

            <div className="glass card" style={{ textAlign: 'center' }}>
              <Gamepad2 size={40} style={{ marginBottom: '15px', color: 'var(--primary-color)' }} />
              <h3>1 Hora Play</h3>
              <p style={{ color: 'var(--gold-color)', margin: '10px 0' }}>60 Tokens</p>
              <button className="btn-primary" style={{ width: '100%', filter: tokens < 60 ? 'grayscale(1)' : 'none' }}>Usar</button>
            </div>
          </div>
        </section>
      </div>

      {/* Botón Flotante de Sugerencias */}
      <motion.button 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowSuggestion(true)}
        style={{
          position: 'fixed',
          bottom: '40px',
          right: '40px',
          width: '60px',
          height: '60px',
          borderRadius: '30px',
          background: 'var(--primary-color)',
          border: 'none',
          color: 'white',
          boxShadow: '0 10px 20px rgba(0,0,0,0.3)',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <MessageSquarePlus />
      </motion.button>

      {/* Modal de Sugerencias */}
      <AnimatePresence>
        {showSuggestion && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(15, 23, 42, 0.8)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 100
            }}
            onClick={() => setShowSuggestion(false)}
          >
            <motion.div 
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              className="glass card"
              style={{ width: '90%', maxWidth: '400px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ marginBottom: '20px' }}>Sugerir Idea 💡</h2>
              <textarea 
                placeholder="Ej: 'Limpiar el patio por 40 tokens'..."
                style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '15px',
                  color: 'white',
                  height: '120px',
                  fontFamily: 'inherit',
                  marginBottom: '20px'
                }}
              />
              <button className="btn-primary" style={{ width: '100%' }} onClick={() => setShowSuggestion(false)}>Enviar Idea a Papá</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
