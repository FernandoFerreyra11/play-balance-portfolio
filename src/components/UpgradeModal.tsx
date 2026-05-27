'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, CheckCircle2, ArrowRight } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
  mode?: 'parent' | 'pro';
  onSubscribe?: () => void;
  isLoading?: boolean;
}

export default function UpgradeModal({ isOpen, onClose, message, mode = 'parent', onSubscribe, isLoading }: UpgradeModalProps) {
  const [isAnnual, setIsAnnual] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '20px'
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="glass card upgrade-modal"
          style={{
            maxWidth: '500px',
            width: '100%',
            position: 'relative',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(251, 191, 36, 0.1)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}
        >
          <button 
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              color: '#94a3b8',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <X size={18} />
          </button>

          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div style={{ 
              width: '64px', height: '64px', borderRadius: '20px', 
              background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.1) 100%)',
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              margin: '0 auto 20px auto',
              border: '1px solid rgba(251, 191, 36, 0.3)'
            }}>
              <Crown size={32} color="#fbbf24" />
            </div>
            
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '10px', color: 'white' }}>
              Desbloquea PlayBalance <span style={{ color: '#fbbf24' }}>Premium</span>
            </h2>
            <p style={{ color: '#fbbf24', fontSize: '0.95rem', fontWeight: 600 }}>
              {message || (mode === 'pro' ? 'Expande tu práctica con familias ilimitadas.' : 'Lleva el desarrollo de tu equipo al siguiente nivel.')}
            </p>
          </div>

          <div style={{ 
            display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: '15px', 
            padding: '5px', marginBottom: '30px', position: 'relative'
          }}>
            <button 
              onClick={() => setIsAnnual(false)}
              style={{
                flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
                background: !isAnnual ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: !isAnnual ? 'white' : '#94a3b8',
                fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s'
              }}
            >
              {mode === 'pro' ? 'Crecimiento' : 'Mensual'}
            </button>
            <button 
              onClick={() => setIsAnnual(true)}
              style={{
                flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
                background: isAnnual ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: isAnnual ? 'white' : '#94a3b8',
                fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s',
                position: 'relative'
              }}
            >
              {mode === 'pro' ? 'Ilimitado' : 'Anual'}
              {mode !== 'pro' && (
                <span style={{
                  position: 'absolute', top: '-10px', right: '-10px',
                  background: '#10b981', color: 'white', fontSize: '0.65rem',
                  padding: '2px 8px', borderRadius: '10px', fontWeight: 800
                }}>
                  2 MESES GRATIS
                </span>
              )}
            </button>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div style={{ fontSize: '3rem', fontWeight: 800, color: 'white', lineHeight: 1 }}>
              {mode === 'pro' ? (isAnnual ? '$39.990' : '$4.999') : (isAnnual ? '$39.990' : '$3.999')}
            </div>
            <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '5px' }}>
              ARS / {mode === 'pro' ? (isAnnual ? 'mes (tarifa plana)' : 'mes por familia extra') : (isAnnual ? 'año' : 'mes')}
            </div>
            {!isAnnual && mode === 'pro' && (
              <div style={{ color: '#10b981', fontSize: '0.85rem', marginTop: '5px', fontWeight: 600 }}>
                Escala a tu propio ritmo
              </div>
            )}
            {isAnnual && mode !== 'pro' && (
              <div style={{ color: '#10b981', fontSize: '0.85rem', marginTop: '5px', fontWeight: 600 }}>
                (Equivale a $3.332 / mes)
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gap: '15px', marginBottom: '35px' }}>
            {mode === 'pro' ? (
              <>
                <FeatureItem text={isAnnual ? "Familias de pacientes ilimitadas" : "Familias adicionales bajo demanda"} />
                <FeatureItem text="Acceso a historiales clínicos" />
                <FeatureItem text="Herramientas de seguimiento avanzadas" />
                <FeatureItem text="Soporte prioritario" />
              </>
            ) : (
              <>
                <FeatureItem text="Aventureros ilimitados en el equipo" />
                <FeatureItem text="Capitanes y co-capitanes sin límite" />
                <FeatureItem text="Historial de progreso clínico completo" />
                <FeatureItem text="Soporte prioritario 24/7" />
              </>
            )}
          </div>

          <button 
            className="btn-primary"
            onClick={() => setShowComingSoon(true)}
            disabled={isLoading}
            style={{ 
              width: '100%', padding: '16px', fontSize: '1.1rem', 
              background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
              color: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px',
              opacity: isLoading ? 0.7 : 1
            }}
          >
            Suscribirse Ahora <ArrowRight size={20} />
          </button>
          
          <AnimatePresence>
            {showComingSoon && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                style={{ marginTop: '15px', color: '#fbbf24', textAlign: 'center', fontSize: '0.95rem', fontWeight: 600 }}
              >
                ¡Próximamente! Estamos integrando la pasarela de pagos segura.
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        </motion.div>
      )}
      <style jsx>{`
        .upgrade-modal {
          padding: 40px;
        }
        @media (max-width: 768px) {
          .upgrade-modal {
            padding: 25px 20px;
          }
        }
        /* Custom scrollbar for modal */
        .upgrade-modal::-webkit-scrollbar {
          width: 8px;
        }
        .upgrade-modal::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 10px;
        }
        .upgrade-modal::-webkit-scrollbar-thumb {
          background: rgba(251, 191, 36, 0.4);
          border-radius: 10px;
        }
      `}</style>
    </AnimatePresence>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#cbd5e1', fontSize: '0.95rem' }}>
      <CheckCircle2 size={18} color="#10b981" />
      <span>{text}</span>
    </div>
  );
}
