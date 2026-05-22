'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  ArrowLeft,
  Activity,
  Award,
  TrendingUp,
  FileText,
  Trash2,
  Lock,
  Plus
} from 'lucide-react';
import Link from 'next/link';
import { addProfessionalNote, deleteProfessionalNote } from '@/app/actions/proStats';

interface Child {
  id: string;
  name: string;
  image: string | null;
  balance: number | null;
}

interface FamilyData {
  family: {
    id: string;
    name: string;
    code: string;
  };
  children: Child[];
}

interface ActivityData {
  transactions: any[];
  quests: any[];
}

interface Note {
  id: string;
  content: string;
  createdAt: Date | null;
  childId: string | null;
}

interface ProFamilyClientProps {
  familyData: FamilyData;
  activityData: ActivityData;
  initialNotes: Note[];
}

export default function ProFamilyClient({ familyData, activityData, initialNotes }: ProFamilyClientProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'notes'>('overview');
  const [selectedChild, setSelectedChild] = useState<string | 'all'>('all');
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [loading, setLoading] = useState(false);

  // Filtramos la actividad si se seleccionó un niño específico
  const filteredTransactions = selectedChild === 'all' 
    ? activityData.transactions 
    : activityData.transactions.filter(t => t.childId === selectedChild);

  const handleAddNote = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const content = formData.get('content') as string;
    const childId = selectedChild === 'all' ? undefined : selectedChild;

    const res = await addProfessionalNote(familyData.family.id, content, childId);
    if (res.success) {
      window.location.reload();
    } else {
      alert(res.error);
    }
    setLoading(false);
  };

  const handleDeleteNote = async (id: string) => {
    if (confirm('¿Eliminar este apunte?')) {
      const res = await deleteProfessionalNote(id, familyData.family.id);
      if (res.success) window.location.reload();
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      
      <div style={{ marginBottom: '30px' }}>
        <Link href="/pro" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', textDecoration: 'none', marginBottom: '20px', width: 'fit-content' }}>
          <ArrowLeft size={16} /> Volver al Panel
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '15px' }}>
              <Users color="#06b6d4" />
              {familyData.family.name}
            </h1>
            <p style={{ color: '#94a3b8' }}>Código de Vinculación: <span style={{ color: 'white', fontWeight: 600 }}>{familyData.family.code}</span></p>
          </div>
        </div>
      </div>

      {/* Selectores de Aventureros */}
      {familyData.children.length > 0 && (
        <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', overflowX: 'auto', paddingBottom: '10px' }}>
          <button
            onClick={() => setSelectedChild('all')}
            className="glass"
            style={{ 
              padding: '10px 20px', borderRadius: '15px', cursor: 'pointer',
              border: selectedChild === 'all' ? '2px solid #06b6d4' : '1px solid rgba(255,255,255,0.1)',
              color: selectedChild === 'all' ? 'white' : '#94a3b8'
            }}
          >
            Toda la Familia
          </button>
          {familyData.children.map(child => (
            <button
              key={child.id}
              onClick={() => setSelectedChild(child.id)}
              className="glass"
              style={{ 
                padding: '10px 20px', borderRadius: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
                border: selectedChild === child.id ? '2px solid #06b6d4' : '1px solid rgba(255,255,255,0.1)',
                color: selectedChild === child.id ? 'white' : '#94a3b8'
              }}
            >
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '0.8rem' }}>
                {child.image || '👤'}
              </div>
              {child.name}
            </button>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '30px' }}>
        <button
          onClick={() => setActiveTab('overview')}
          style={{ 
            padding: '15px 20px', background: 'none', border: 'none', color: activeTab === 'overview' ? '#06b6d4' : '#94a3b8', 
            borderBottom: activeTab === 'overview' ? '2px solid #06b6d4' : '2px solid transparent', cursor: 'pointer', fontWeight: 600, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <Activity size={18} /> Historial Clínico
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          style={{ 
            padding: '15px 20px', background: 'none', border: 'none', color: activeTab === 'notes' ? '#8b5cf6' : '#94a3b8', 
            borderBottom: activeTab === 'notes' ? '2px solid #8b5cf6' : '2px solid transparent', cursor: 'pointer', fontWeight: 600, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <Lock size={18} /> Apuntes Privados
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' ? (
          <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
              
              <div className="glass card">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: '#10b981' }}>
                  <TrendingUp size={20} /> Flujo de Tokens Reciente
                </h3>
                {filteredTransactions.length === 0 ? (
                  <p style={{ color: '#94a3b8', textAlign: 'center', padding: '20px' }}>Sin transacciones registradas.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {filteredTransactions.slice(0, 10).map((tx, i) => (
                      <div key={tx.id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                        <div>
                          <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>{tx.description}</p>
                          <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{tx.childName} • {new Date(tx.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div style={{ fontWeight: 800, color: tx.amount > 0 ? '#10b981' : '#ef4444' }}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="glass card">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: '#f59e0b' }}>
                  <Award size={20} /> Últimas Misiones
                </h3>
                {activityData.quests.length === 0 ? (
                  <p style={{ color: '#94a3b8', textAlign: 'center', padding: '20px' }}>No hay misiones recientes.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {activityData.quests.filter(q => selectedChild === 'all' || q.childId === selectedChild).slice(0, 10).map((q, i) => (
                      <div key={q.id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', borderLeft: q.status === 'completed' ? '4px solid #10b981' : '4px solid #f59e0b' }}>
                        <div>
                          <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>{q.questTitle}</p>
                          <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{q.childName} • Estado: {q.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </motion.div>
        ) : (
          <motion.div key="notes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            
            {/* Aviso Legal Obligatorio */}
            <div style={{ padding: '20px', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid #8b5cf6', borderRadius: '15px', marginBottom: '30px', display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
              <Lock color="#8b5cf6" style={{ flexShrink: 0 }} />
              <div>
                <h4 style={{ color: '#c4b5fd', marginBottom: '5px' }}>Privacidad y Secreto Profesional</h4>
                <p style={{ fontSize: '0.9rem', color: '#a78bfa', lineHeight: 1.5 }}>
                  Estos apuntes de seguimiento son estrictamente confidenciales y visibles <strong>únicamente para ti</strong>. 
                  Ni los padres ni los menores tienen acceso a esta sección. <br/>
                  <em>Nota legal: Estos apuntes son para uso organizativo interno del profesional y no reemplazan la Historia Clínica Oficial obligatoria por la Ley 26.529.</em>
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
              
              <div className="glass card">
                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Plus size={20} /> Nuevo Apunte
                </h3>
                <form onSubmit={handleAddNote} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <textarea 
                    name="content" 
                    required 
                    placeholder={selectedChild === 'all' 
                      ? "Escribe tus observaciones generales sobre la familia..."
                      : `Escribe tus observaciones sobre el paciente...`
                    }
                    style={{ padding: '15px', borderRadius: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', minHeight: '150px', resize: 'vertical' }} 
                  />
                  <button disabled={loading} type="submit" className="btn-primary" style={{ padding: '12px', background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                    {loading ? 'Guardando...' : 'Guardar Apunte Seguro'}
                  </button>
                </form>
              </div>

              <div className="glass card">
                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FileText size={20} /> Registro Privado
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {notes.filter(n => selectedChild === 'all' || n.childId === selectedChild || !n.childId).map((note) => (
                    <div key={note.id} style={{ padding: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: '15px', borderLeft: '4px solid #8b5cf6', position: 'relative' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ fontSize: '0.8rem', color: '#c4b5fd' }}>
                          {note.createdAt ? new Date(note.createdAt).toLocaleString() : ''}
                          {note.childId && familyData.children.find(c => c.id === note.childId) && (
                            <span style={{ marginLeft: '10px', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '10px' }}>
                              👤 {familyData.children.find(c => c.id === note.childId)?.name}
                            </span>
                          )}
                        </span>
                        <button onClick={() => handleDeleteNote(note.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.7 }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, color: '#e2e8f0' }}>{note.content}</p>
                    </div>
                  ))}
                  {notes.length === 0 && (
                    <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px' }}>No hay apuntes registrados para este paciente.</p>
                  )}
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .glass {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(10px);
        }
        .card {
          padding: 30px;
          border-radius: 30px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
      `}</style>
    </div>
  );
}
