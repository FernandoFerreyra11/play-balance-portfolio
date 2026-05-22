import { redirect } from 'next/navigation';
import { getFamilyDetailsForPro, getFamilyActivityForPro, getProfessionalNotes } from '@/app/actions/proStats';
import { getMessagesForPro } from '@/app/actions/messages';
import ProFamilyClient from './ProFamilyClient';

export default async function ProFamilyPage({ params }: { params: { familyId: string } }) {
  const familyId = params.familyId;

  // Obtenemos todos los datos en el servidor
  const familyData = await getFamilyDetailsForPro(familyId);
  
  if (!familyData) {
    // Si no retorna nada, el pro no tiene acceso o la familia no existe
    redirect('/pro');
  }

  const activityData = await getFamilyActivityForPro(familyId) || { transactions: [], quests: [] };
  const initialNotes = await getProfessionalNotes(familyId);
  const messagesRes = await getMessagesForPro(familyId);
  const initialMessages = messagesRes.success ? messagesRes.data : [];
  const proId = messagesRes.proId || '';

  return (
    <main style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <ProFamilyClient 
        familyData={familyData} 
        activityData={activityData} 
        initialNotes={initialNotes}
        initialMessages={initialMessages}
        proId={proId}
      />
    </main>
  );
}
