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
  Plus,
  MessageSquare,
  Send,
  Stethoscope,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect } from 'react';
import { addProfessionalNote, deleteProfessionalNote, assignTherapyQuest } from '@/app/actions/proStats';
import { sendMessage } from '@/app/actions/messages';
import { getFamilyMetrics } from '@/app/actions/proMetrics';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

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

interface MetricsData {
  complianceRate: number;
  topRewards: { name: string; count: number }[];
  weeklyTrend: { day: string; tokens: number }[];
  avgResponseTimeHrs: number;
}

interface ProFamilyClientProps {
  familyData: FamilyData;
  activityData: ActivityData;
  initialNotes: Note[];
  initialMessages: any[];
  initialMetrics?: MetricsData | null;
  proId: string;
}

export default function ProFamilyClient({ familyData, activityData, initialNotes, initialMessages, initialMetrics, proId }: ProFamilyClientProps) {
  const [selectedChild, setSelectedChild] = useState<string | 'all'>('all');
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [loading, setLoading] = useState(false);
  const [msgLoading, setMsgLoading] = useState(false);
  const [therapyLoading, setTherapyLoading] = useState(false);
  const [messageTarget, setMessageTarget] = useState<'parents' | 'children'>('parents');
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'messages' | 'therapies'>('overview');
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [metrics, setMetrics] = useState<MetricsData | null>(initialMetrics || null);
  const router = useRouter();

  // Fetch metrics when selected child changes
  useEffect(() => {
    const fetchMetrics = async () => {
      const res = await getFamilyMetrics(familyData.family.id, selectedChild === 'all' ? undefined : selectedChild);
      if (res.success && res.metrics) {
        setMetrics(res.metrics as MetricsData);
      }
    };
    fetchMetrics();
  }, [selectedChild, familyData.family.id]);

  // Filtramos la actividad si se seleccionó un niño específico
  const filteredTransactions = selectedChild === 'all' 
    ? activityData.transactions 
    : activityData.transactions.filter(t => t.childId === selectedChild);

  // Filtramos los mensajes según el destinatario seleccionado
  const filteredMessages = initialMessages.filter(msg => {
    if (messageTarget === 'parents') {
      return msg.receiverType === 'parents' || (msg.senderRole === 'parent' && msg.receiverType === 'professional') || (msg.senderRole === 'org_admin' && msg.receiverType === 'professional');
    } else {
      return msg.receiverType === 'children' || (msg.senderRole === 'child' && msg.receiverType === 'professional');
    }
  });

  const handleAddNote = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const content = formData.get('content') as string;
    const childId = selectedChild === 'all' ? undefined : selectedChild;

    const res = await addProfessionalNote(familyData.family.id, content, childId);
    if (res.success) {
      setNotification({ message: 'Apunte guardado correctamente', type: 'success' });
      (e.target as HTMLFormElement).reset();
      router.refresh();
    } else {
      setNotification({ message: res.error || 'Error al guardar apunte', type: 'error' });
    }
    setLoading(false);
  };

  const handleDeleteNote = async (id: string) => {
    if (confirm('¿Eliminar este apunte?')) {
      const res = await deleteProfessionalNote(id, familyData.family.id);
      if (res.success) {
        setNotification({ message: 'Apunte eliminado', type: 'success' });
        router.refresh();
      }
    }
  };

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMsgLoading(true);
    const formData = new FormData(e.currentTarget);
    const content = formData.get('content') as string;

    const res = await sendMessage(familyData.family.id, content, messageTarget);
    if (res.success) {
      setNotification({ message: 'Mensaje enviado correctamente', type: 'success' });
      (e.target as HTMLFormElement).reset();
      router.refresh();
    } else {
      setNotification({ message: res.error || 'Error al enviar mensaje', type: 'error' });
    }
    setMsgLoading(false);
  };

  const handleAssignTherapy = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTherapyLoading(true);
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const reward = parseInt(formData.get('reward') as string);
    const targetChildId = formData.get('targetChildId') as string;

    const res = await assignTherapyQuest(familyData.family.id, targetChildId, title, description, reward);
    if (res.success) {
      setNotification({ message: 'Terapia asignada con éxito al aventurero', type: 'success' });
      (e.target as HTMLFormElement).reset();
      router.refresh();
    } else {
      setNotification({ message: res.error || 'Error al asignar terapia', type: 'error' });
    }
    setTherapyLoading(false);
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      
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
              <AlertCircle size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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
      <div className="tabs-container">
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
        <button
          onClick={() => setActiveTab('messages')}
          style={{ 
            padding: '15px 20px', background: 'none', border: 'none', color: activeTab === 'messages' ? '#f59e0b' : '#94a3b8', 
            borderBottom: activeTab === 'messages' ? '2px solid #f59e0b' : '2px solid transparent', cursor: 'pointer', fontWeight: 600, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <MessageSquare size={18} /> Buzón de Familia
        </button>
        <button
          onClick={() => setActiveTab('therapies')}
          style={{ 
            padding: '15px 20px', background: 'none', border: 'none', color: activeTab === 'therapies' ? '#f43f5e' : '#94a3b8', 
            borderBottom: activeTab === 'therapies' ? '2px solid #f43f5e' : '2px solid transparent', cursor: 'pointer', fontWeight: 600, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <Stethoscope size={18} /> Terapias Clínicas
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' ? (
          <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            
            {/* KPI Cards */}
            <div className="pro-family-grid" style={{ gap: '20px', marginBottom: '30px' }}>
              <div className="glass card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '15px', borderRadius: '15px', color: '#10b981' }}>
                  <Activity size={30} />
                </div>
                <div>
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '5px' }}>Tasa de Cumplimiento</p>
                  <h3 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>{metrics?.complianceRate || 0}%</h3>
                </div>
              </div>
              <div className="glass card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ background: 'rgba(56, 189, 248, 0.2)', padding: '15px', borderRadius: '15px', color: '#38bdf8' }}>
                  <MessageSquare size={30} />
                </div>
                <div>
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '5px' }}>T. Promedio de Respuesta</p>
                  <h3 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>{metrics?.avgResponseTimeHrs || 0} hs</h3>
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="pro-family-grid" style={{ gap: '30px', marginBottom: '30px' }}>
              <div className="glass card">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: '#fbbf24' }}>
                  <TrendingUp size={20} /> Tendencia Semanal (Fichas)
                </h3>
                <div style={{ width: '100%', height: 250 }}>
                  <ResponsiveContainer>
                    <LineChart data={metrics?.weeklyTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <RechartsTooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                      <Line type="monotone" dataKey="tokens" stroke="#fbbf24" strokeWidth={3} dot={{ r: 4, fill: '#fbbf24', strokeWidth: 0 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass card">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: '#f43f5e' }}>
                  <Award size={20} /> Top 3 Recompensas
                </h3>
                <div style={{ width: '100%', height: 250 }}>
                  <ResponsiveContainer>
                    <BarChart data={metrics?.topRewards || []} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.1)" />
                      <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis dataKey="name" type="category" stroke="#e2e8f0" fontSize={12} tickLine={false} axisLine={false} width={80} />
                      <RechartsTooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                        {metrics?.topRewards?.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#f43f5e', '#fbbf24', '#38bdf8'][index % 3]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="pro-family-grid" style={{ gap: '30px' }}>
              
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
        ) : activeTab === 'notes' ? (
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

            <div className="pro-family-grid-sidebar" style={{ gap: '30px' }}>
              
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
        ) : activeTab === 'messages' ? (
          <motion.div key="messages" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            
            <div className="pro-family-grid-sidebar">
              
              <div className="glass card">
                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#f59e0b' }}>
                  <Send size={20} /> Nuevo Mensaje
                </h3>
                
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                  <button 
                    onClick={() => setMessageTarget('parents')}
                    style={{ flex: 1, padding: '10px', borderRadius: '10px', border: messageTarget === 'parents' ? '2px solid #f59e0b' : '1px solid rgba(255,255,255,0.1)', background: messageTarget === 'parents' ? 'rgba(245, 158, 11, 0.1)' : 'transparent', color: messageTarget === 'parents' ? 'white' : '#94a3b8', cursor: 'pointer' }}
                  >
                    Para Padres
                  </button>
                  <button 
                    onClick={() => setMessageTarget('children')}
                    style={{ flex: 1, padding: '10px', borderRadius: '10px', border: messageTarget === 'children' ? '2px solid #06b6d4' : '1px solid rgba(255,255,255,0.1)', background: messageTarget === 'children' ? 'rgba(6, 182, 212, 0.1)' : 'transparent', color: messageTarget === 'children' ? 'white' : '#94a3b8', cursor: 'pointer' }}
                  >
                    Para Niños
                  </button>
                </div>

                <form onSubmit={handleSendMessage} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <textarea 
                    name="content" 
                    required 
                    placeholder={messageTarget === 'parents' 
                      ? "Mensaje privado para los capitanes (los aventureros no lo verán)..."
                      : "Mensaje de aliento o indicación para los aventureros..."
                    }
                    style={{ padding: '15px', borderRadius: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', minHeight: '120px', resize: 'vertical' }} 
                  />
                  <button disabled={msgLoading} type="submit" className="btn-primary" style={{ padding: '12px', background: messageTarget === 'parents' ? '#f59e0b' : '#06b6d4', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                    {msgLoading ? 'Enviando...' : 'Enviar Mensaje'}
                  </button>
                </form>
              </div>

              <div className="glass card">
                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <MessageSquare size={20} /> Historial de Conversación
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '600px', overflowY: 'auto', paddingRight: '10px' }}>
                  {filteredMessages.map((msg) => (
                    <div key={msg.id} className={`pro-chat-bubble ${msg.senderId === proId ? 'pro-chat-bubble-mine' : 'pro-chat-bubble-other'}`} style={{ 
                      background: msg.senderId === proId ? 'rgba(6, 182, 212, 0.1)' : 'rgba(255,255,255,0.05)', 
                      borderLeft: msg.senderId === proId ? '4px solid #06b6d4' : '4px solid #94a3b8',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: msg.senderId === proId ? '#06b6d4' : 'white' }}>
                          {msg.senderId === proId ? 'Tú' : msg.senderName}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                            {new Date(msg.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5, color: '#e2e8f0', fontSize: '0.95rem' }}>{msg.content}</p>
                    </div>
                  ))}
                  {filteredMessages.length === 0 && (
                    <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px' }}>Aún no hay mensajes en esta conversación.</p>
                  )}
                </div>
              </div>

            </div>
          </motion.div>
        ) : activeTab === 'therapies' ? (
          <motion.div key="therapies" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="pro-family-grid" style={{ gap: '30px' }}>
              
              <div className="glass card">
                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#f43f5e' }}>
                  <Stethoscope size={20} /> Asignar Terapia (Misión)
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '20px' }}>
                  Crea una misión que llegará al dispositivo del aventurero. El progreso será monitoreado y los padres validarán la recompensa de tokens.
                </p>
                <form onSubmit={handleAssignTherapy} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <select 
                    name="targetChildId" 
                    required 
                    style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '15px', color: 'white' }}
                  >
                    <option value="" disabled selected>Selecciona al Aventurero...</option>
                    {familyData.children.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <input 
                    name="title" 
                    placeholder="Ej: Ejercicios de respiración (5 min)" 
                    required 
                    style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '15px', color: 'white' }} 
                  />
                  <textarea 
                    name="description" 
                    placeholder="Instrucciones adicionales para el aventurero y los padres..." 
                    rows={3} 
                    style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '15px', color: 'white', resize: 'vertical' }} 
                  />
                  <input 
                    name="reward" 
                    type="number"
                    placeholder="Recompensa en Tokens (Ej: 50)" 
                    required 
                    style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '15px', color: 'white' }} 
                  />
                  <button disabled={therapyLoading} type="submit" style={{ background: '#f43f5e', color: 'white', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                    {therapyLoading ? 'Asignando...' : <><Plus size={18} /> Asignar Terapia</>}
                  </button>
                </form>
              </div>

              <div className="glass card">
                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#f59e0b' }}>
                  <Award size={20} /> Terapias Asignadas (Activas)
                </h3>
                {activityData.quests.filter(q => q.isTherapy === 1).length === 0 ? (
                  <p style={{ color: '#94a3b8', textAlign: 'center', padding: '20px' }}>No hay terapias asignadas actualmente.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {activityData.quests.filter(q => q.isTherapy === 1).map((q, i) => (
                      <div key={q.id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', borderLeft: q.status === 'completed' ? '4px solid #10b981' : '4px solid #f43f5e' }}>
                        <div>
                          <p style={{ fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Stethoscope size={14} color="#f43f5e" /> {q.questTitle}
                          </p>
                          <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{q.childName} • Estado: {q.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </motion.div>
        ) : null}
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
      {/* Add jsx styles for chat bubbles and layouts */}
      <style jsx>{`
        .pro-family-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
        }
        .pro-family-grid-sidebar {
          display: grid;
          grid-template-columns: 1fr 2fr;
        }
        .tabs-container {
          display: flex;
          gap: 20px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          margin-bottom: 30px;
          overflow-x: auto;
          white-space: nowrap;
        }
        .pro-chat-bubble {
          padding: 15px;
          border-radius: 15px;
        }
        .pro-chat-bubble-mine {
          margin-left: 40px;
          margin-right: 0;
        }
        .pro-chat-bubble-other {
          margin-left: 0;
          margin-right: 40px;
        }
        @media (max-width: 768px) {
          .pro-chat-bubble-mine {
            margin-left: 10px;
          }
          .pro-chat-bubble-other {
            margin-right: 10px;
          }
          .pro-family-grid {
            grid-template-columns: 1fr;
          }
          .pro-family-grid-sidebar {
            grid-template-columns: 1fr;
          }
          .tabs-container {
            flex-direction: column;
            gap: 10px;
          }
        }
      `}</style>
    </div>
  );
}
