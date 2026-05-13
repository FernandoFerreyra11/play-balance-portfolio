'use server';

import { db } from "@/db";
import { users, quests, activeQuests, transactions } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getPendingApprovals() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'parent') return [];

  const parentId = (session.user as any).id;

  // Obtenemos las misiones activas que están pendientes
  // y que pertenecen a hijos de este padre
  const pending = await db
    .select({
      id: activeQuests.id,
      status: activeQuests.status,
      requestedAt: activeQuests.requestedAt,
      childName: users.name,
      childImage: users.image,
      childId: users.id,
      questTitle: quests.title,
      questReward: quests.reward,
      questId: quests.id,
    })
    .from(activeQuests)
    .innerJoin(users, eq(activeQuests.userId, users.id))
    .innerJoin(quests, eq(activeQuests.questId, quests.id))
    .where(
      and(
        eq(activeQuests.status, 'pending'),
        eq(users.parentId, parentId)
      )
    )
    .orderBy(desc(activeQuests.requestedAt));

  return pending;
}

export async function approveQuest(activeQuestId: string) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'parent') return { error: "No autorizado" };

  try {
    // 1. Obtener datos de la misión y el usuario
    const [aq] = await db
      .select({
        userId: activeQuests.userId,
        questReward: quests.reward,
        questTitle: quests.title,
      })
      .from(activeQuests)
      .innerJoin(quests, eq(activeQuests.questId, quests.id))
      .where(eq(activeQuests.id, activeQuestId))
      .limit(1);

    if (!aq) return { error: "Solicitud no encontrada" };

    // 2. Actualizar estado de la misión
    await db.update(activeQuests)
      .set({ status: 'approved', completedAt: new Date() })
      .where(eq(activeQuests.id, activeQuestId));

    // 3. Sumar tokens al usuario
    const [user] = await db.select().from(users).where(eq(users.id, aq.userId!)).limit(1);
    await db.update(users)
      .set({ balance: (user.balance || 0) + aq.questReward })
      .where(eq(users.id, aq.userId!));

    // 4. Registrar transacción
    await db.insert(transactions).values({
      userId: aq.userId!,
      amount: aq.questReward,
      type: 'quest',
      description: `Misión completada: ${aq.questTitle}`,
    });

    revalidatePath("/admin");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { error: "Error al aprobar la misión" };
  }
}

export async function rejectQuest(activeQuestId: string) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'parent') return { error: "No autorizado" };

  try {
    await db.update(activeQuests)
      .set({ status: 'rejected' })
      .where(eq(activeQuests.id, activeQuestId));

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return { error: "Error al rechazar" };
  }
}
