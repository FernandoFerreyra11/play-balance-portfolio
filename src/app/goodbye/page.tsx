'use client';

import { motion } from 'framer-motion';
import { Heart, Stars, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function GoodbyePage() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      background: '#0a0a0a', 
      color: 'white', 
      padding: '20px',
      fontFamily: 'system-ui',
      textAlign: 'center'
    }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="glass"
        style={{
          maxWidth: '600px',
          padding: '60px 40px',
          borderRadius: '40px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Decoración de fondo */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '150px',
          height: '150px',
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.2) 0%, transparent 70%)',
          zIndex: 0
        }} />

        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ marginBottom: '30px', color: 'var(--primary-color)', display: 'inline-block' }}
        >
          <Heart size={64} fill="var(--primary-color)" />
        </motion.div>

        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '20px' }}>
          ¡Hasta pronto!
        </h1>

        <p style={{ 
          fontSize: '1.2rem', 
          lineHeight: '1.6', 
          color: 'rgba(255, 255, 255, 0.8)', 
          marginBottom: '40px' 
        }}>
          &quot;Gracias por haber compartido este tiempo juntos, te esperamos cuando quieras regresar a esta aventura o a otras de nuestra colección. Para seguir encontrando bienestar digital.&quot;
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '40px' }}>
          <Stars color="var(--gold-color)" />
          <Stars color="var(--gold-color)" />
          <Stars color="var(--gold-color)" />
        </div>

        <Link href="/" style={{ textDecoration: 'none' }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="glass"
            style={{
              padding: '12px 30px',
              borderRadius: '15px',
              border: '1px solid var(--border-color)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              fontSize: '1rem',
              margin: '0 auto'
            }}
          >
            <ArrowLeft size={18} /> Volver al inicio
          </motion.button>
        </Link>
      </motion.div>

      <style jsx>{`
        .glass {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(10px);
        }
      `}</style>
    </div>
  );
}
