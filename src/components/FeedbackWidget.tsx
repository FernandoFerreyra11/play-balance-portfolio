'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Bug, Lightbulb, Send, Loader2 } from 'lucide-react';
import { submitBetaFeedback } from '@/app/actions/feedback';

export default function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<'bug' | 'feature' | 'other'>('feature');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    setError('');
    
    const res = await submitBetaFeedback(type, content);
    
    if (res.success) {
      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        setContent('');
      }, 3000);
    } else {
      setError(res.error || 'Ocurrió un error. Intenta nuevamente.');
    }
    setLoading(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="feedback-trigger pulse-soft"
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '50px',
          height: '50px',
          borderRadius: '25px',
          background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
          border: 'none',
          color: 'white',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(6, 182, 212, 0.4)',
          zIndex: 40,
        }}
        title="Enviar Feedback a Desarrollo"
      >
        <MessageSquare size={24} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            style={{
              position: 'fixed',
              bottom: '80px',
              right: '20px',
              width: '320px',
              background: 'rgba(15, 23, 42, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '20px',
              padding: '20px',
              zIndex: 50,
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              color: 'white'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={18} color="#06b6d4" /> Buzón Beta
              </h3>
              <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {success ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#10b981' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🚀</div>
                <p style={{ fontWeight: 600 }}>¡Feedback enviado!</p>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '5px' }}>Gracias por ayudarnos a mejorar PlayBalance.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                  <button
                    type="button"
                    onClick={() => setType('feature')}
                    style={{
                      flex: 1, padding: '8px', borderRadius: '10px', border: '1px solid',
                      background: type === 'feature' ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
                      borderColor: type === 'feature' ? '#f59e0b' : 'rgba(255,255,255,0.1)',
                      color: type === 'feature' ? '#f59e0b' : '#94a3b8',
                      cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px', fontSize: '0.85rem', fontWeight: 600
                    }}
                  >
                    <Lightbulb size={14} /> Idea
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('bug')}
                    style={{
                      flex: 1, padding: '8px', borderRadius: '10px', border: '1px solid',
                      background: type === 'bug' ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                      borderColor: type === 'bug' ? '#ef4444' : 'rgba(255,255,255,0.1)',
                      color: type === 'bug' ? '#ef4444' : '#94a3b8',
                      cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px', fontSize: '0.85rem', fontWeight: 600
                    }}
                  >
                    <Bug size={14} /> Error
                  </button>
                </div>

                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Escribe tu sugerencia, idea o reporte de error aquí..."
                  required
                  style={{
                    width: '100%', height: '100px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px', padding: '10px', color: 'white', resize: 'none', outline: 'none',
                    fontSize: '0.9rem', marginBottom: '10px'
                  }}
                />

                {error && <p style={{ color: '#ef4444', fontSize: '0.8rem', marginBottom: '10px' }}>{error}</p>}

                <button
                  type="submit"
                  disabled={loading || !content.trim()}
                  style={{
                    width: '100%', padding: '10px', borderRadius: '10px', border: 'none',
                    background: '#06b6d4', color: 'white', fontWeight: 600, cursor: loading || !content.trim() ? 'not-allowed' : 'pointer',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                    opacity: loading || !content.trim() ? 0.7 : 1
                  }}
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <><Send size={16} /> Enviar a Desarrollo</>}
                </button>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .pulse-soft {
          animation: pulse-soft 2s infinite;
        }
        @keyframes pulse-soft {
          0% { box-shadow: 0 0 0 0 rgba(6, 182, 212, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(6, 182, 212, 0); }
          100% { box-shadow: 0 0 0 0 rgba(6, 182, 212, 0); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
