'use server';

import { db } from "@/db";
import { users, families, transactions, activeQuests, quests, professionalNotes } from "@/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
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
  
  const [family] = await db
    .select()
    .from(families)
    .where(
      and(
        eq(families.id, familyId),
        // Si el pro tiene organización, la familia debe estar en esa organización
        pro.organizationId ? eq(families.organizationId, pro.organizationId) : undefined
      )
    )
    .limit(1);

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
      childName: users.name,
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
