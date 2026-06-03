'use server';

import { db } from "@/db";
import { users, families, transactions, activeQuests, quests, professionalNotes, bodyCheckins, moodCheckins } from "@/db/schema";
import { eq, and, desc, inArray, or } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

interface AuthUser {
  id?: string;
  role?: string;
  organizationId?: string;
}

// Verifica que el profesional tenga acceso a esta familia (misma org o terapeuta asignado)
async function verifyProAccess(familyId: string) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as AuthUser).role !== 'professional') {
    return null;
  }
  
  const pro = session.user as AuthUser;
  
  const [dbUser] = await db.select({ organizationId: users.organizationId }).from(users).where(eq(users.id, pro.id as string));
  if (dbUser) {
    pro.organizationId = dbUser.organizationId || undefined;
  }
  
  console.log("verifyProAccess START", { proId: pro.id, orgId: pro.organizationId, familyId });
  
  const conditions = [eq(families.professionalId, pro.id as string)];
  if (pro.organizationId) {
    conditions.push(eq(families.organizationId, pro.organizationId));
  }
  
  const [family] = await db
    .select()
    .from(families)
    .where(
      and(
        eq(families.id, familyId),
        conditions.length > 1 ? or(...conditions) : conditions[0]
      )
    )
    .limit(1);

  console.log("verifyProAccess RESULT", { familyFound: !!family });

  if (!family) return null;
  return pro;
}

export async function getFamilyDetailsForPro(familyId: string) {
  const pro = await verifyProAccess(familyId);
  if (!pro) return null;

  const [familyData] = await db.select().from(families).where(eq(families.id, familyId)).limit(1);
  if (!familyData) return null;

  const children = await db
    .select({
      id: users.id,
      name: users.name,
      image: users.image,
      balance: users.balance,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(
      and(
        eq(users.familyId, familyId),
        eq(users.role, 'child')
      )
    );

  return {
    family: familyData,
    children,
  };
}

export async function getFamilyActivityForPro(familyId: string, childId?: string) {
  const pro = await verifyProAccess(familyId);
  if (!pro) return null;

  // Transacciones
  const txs = await db
    .select({
      id: transactions.id,
      amount: transactions.amount,
      type: transactions.type,
      description: transactions.description,
      createdAt: transactions.createdAt,
      childName: users.name,
      childId: users.id,
    })
    .from(transactions)
    .innerJoin(users, eq(transactions.userId, users.id))
    .where(
      and(
        eq(users.familyId, familyId),
        childId ? eq(users.id, childId) : undefined
      )
    )
    .orderBy(desc(transactions.createdAt))
    .limit(50); // Últimas 50 transacciones

  // Quests pendientes o recientes
  const recentQuests = await db
    .select({
      id: activeQuests.id,
      status: activeQuests.status,
      completedAt: activeQuests.completedAt,
      questTitle: quests.title,
      isTherapy: quests.isTherapy,
      childName: users.name,
      childId: users.id,
    })
    .from(activeQuests)
    .innerJoin(users, eq(activeQuests.childId, users.id))
    .innerJoin(quests, eq(activeQuests.questId, quests.id))
    .where(
      and(
        eq(users.familyId, familyId),
        childId ? eq(users.id, childId) : undefined
      )
    )
    .orderBy(desc(activeQuests.createdAt))
    .limit(20);

  return {
    transactions: txs,
    quests: recentQuests,
  };
}

export async function getProfessionalNotes(familyId: string) {
  const pro = await verifyProAccess(familyId);
  if (!pro || !pro.id) return [];

  const notes = await db
    .select()
    .from(professionalNotes)
    .where(
      and(
        eq(professionalNotes.familyId, familyId),
        eq(professionalNotes.professionalId, pro.id)
      )
    )
    .orderBy(desc(professionalNotes.createdAt));

  return notes;
}

export async function addProfessionalNote(familyId: string, content: string, childId?: string) {
  const pro = await verifyProAccess(familyId);
  if (!pro || !pro.id) return { error: "No autorizado" };

  try {
    await db.insert(professionalNotes).values({
      professionalId: pro.id,
      familyId,
      childId: childId || null,
      content,
    });
    
    revalidatePath(`/pro/family/${familyId}`);
    return { success: true };
  } catch (error) {
    return { error: "Error al guardar el apunte" };
  }
}

export async function deleteProfessionalNote(noteId: string, familyId: string) {
  const pro = await verifyProAccess(familyId);
  if (!pro || !pro.id) return { error: "No autorizado" };

  try {
    await db.delete(professionalNotes).where(
      and(
        eq(professionalNotes.id, noteId),
        eq(professionalNotes.professionalId, pro.id)
      )
    );
    
    revalidatePath(`/pro/family/${familyId}`);
    return { success: true };
  } catch (error) {
    return { error: "Error al eliminar el apunte" };
  }
}

export async function assignTherapyQuest(familyId: string, childId: string, title: string, description: string, reward: number) {
  const pro = await verifyProAccess(familyId);
  if (!pro || !pro.id) return { error: "No autorizado" };

  try {
    await db.insert(quests).values({
      familyId,
      targetChildId: childId,
      isTherapy: 1, // Es terapia clínica
      title,
      description,
      reward,
      category: 'Salud', // Podemos fijarla en Salud o permitir que el pro elija
      createdBy: pro.id,
    });
    
    revalidatePath(`/pro/family/${familyId}`);
    return { success: true };
  } catch (error) {
    console.error("Error asignando terapia:", error);
    return { error: "Error al asignar la terapia" };
  }
}

export async function approveTherapyQuest(activeQuestId: string, familyId: string) {
  const pro = await verifyProAccess(familyId);
  if (!pro || !pro.id) return { error: "No autorizado" };

  try {
    const [aq] = await db
      .select({
        childId: activeQuests.childId,
        questReward: quests.reward,
        questTitle: quests.title,
      })
      .from(activeQuests)
      .innerJoin(quests, eq(activeQuests.questId, quests.id))
      .where(and(
        eq(activeQuests.id, activeQuestId),
        eq(quests.isTherapy, 1)
      ))
      .limit(1);

    if (!aq) return { error: "Terapia no encontrada" };

    await db.update(activeQuests)
      .set({ status: 'completed', completedAt: new Date() })
      .where(eq(activeQuests.id, activeQuestId));

    const [child] = await db.select().from(users).where(eq(users.id, aq.childId!)).limit(1);
    await db.update(users)
      .set({ balance: (child.balance || 0) + aq.questReward })
      .where(eq(users.id, aq.childId!));

    await db.insert(transactions).values({
      userId: aq.childId!,
      amount: aq.questReward,
      type: 'quest',
      description: `Terapia validada: ${aq.questTitle}`,
    });

    revalidatePath(`/pro/family/${familyId}`);
    return { success: true };
  } catch (error) {
    console.error("Error al aprobar terapia:", error);
    return { error: "Error al aprobar la terapia" };
  }
}

export async function rejectTherapyQuest(activeQuestId: string, familyId: string) {
  const pro = await verifyProAccess(familyId);
  if (!pro || !pro.id) return { error: "No autorizado" };

  try {
    const [aq] = await db
      .select({ id: activeQuests.id })
      .from(activeQuests)
      .innerJoin(quests, eq(activeQuests.questId, quests.id))
      .where(and(
        eq(activeQuests.id, activeQuestId),
        eq(quests.isTherapy, 1)
      ))
      .limit(1);

    if (!aq) return { error: "Terapia no encontrada" };

    await db.update(activeQuests)
      .set({ status: 'in_progress' })
      .where(eq(activeQuests.id, activeQuestId));

    revalidatePath(`/pro/family/${familyId}`);
    return { success: true };
  } catch {
    return { error: "Error al rechazar" };
  }
}

export async function getCheckinsForPro(familyId: string) {
  const pro = await verifyProAccess(familyId);
  if (!pro) return { body: [], mood: [] };

  const familyChildren = await db.select({ id: users.id, name: users.name })
    .from(users)
    .where(and(eq(users.familyId, familyId), eq(users.role, 'child')));

  const childIds = familyChildren.map(c => c.id);
  if (childIds.length === 0) return { body: [], mood: [] };

  const body = await db.select({
      id: bodyCheckins.id,
      childId: bodyCheckins.childId,
      childName: users.name,
      eyes: bodyCheckins.eyes,
      neck: bodyCheckins.neck,
      head: bodyCheckins.head,
      createdAt: bodyCheckins.createdAt
    })
    .from(bodyCheckins)
    .innerJoin(users, eq(bodyCheckins.childId, users.id))
    .where(inArray(bodyCheckins.childId, childIds))
    .orderBy(desc(bodyCheckins.createdAt))
    .limit(50);

  const mood = await db.select({
      id: moodCheckins.id,
      childId: moodCheckins.childId,
      childName: users.name,
      mood: moodCheckins.mood,
      energy: moodCheckins.energy,
      note: moodCheckins.note,
      createdAt: moodCheckins.createdAt
    })
    .from(moodCheckins)
    .innerJoin(users, eq(moodCheckins.childId, users.id))
    .where(inArray(moodCheckins.childId, childIds))
    .orderBy(desc(moodCheckins.createdAt))
    .limit(50);

  return { body, mood };
}
