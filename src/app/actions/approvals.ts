'use server';

import { db } from "@/db";
import { users, quests, activeQuests, transactions } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function getEffectiveFamilyId() {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  return (session.user as any).familyId;
}

export async function getPendingApprovals() {
  const familyId = await getEffectiveFamilyId();
  if (!familyId) return [];

  const pending = await db
    .select({
      id: activeQuests.id,
      status: activeQuests.status,
      createdAt: activeQuests.createdAt,
      childName: users.name,
      childImage: users.image,
      childId: users.id,
      questTitle: quests.title,
      questReward: quests.reward,
      questId: quests.id,
    })
    .from(activeQuests)
    .innerJoin(users, eq(activeQuests.childId, users.id))
    .innerJoin(quests, eq(activeQuests.questId, quests.id))
    .where(
      and(
        eq(activeQuests.status, 'pending_approval'),
        eq(users.familyId, familyId)
      )
    )
    .orderBy(desc(activeQuests.createdAt));

  return pending;
}

export async function approveQuest(activeQuestId: string) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'parent') return { error: "No autorizado" };

  try {
    const [aq] = await db
      .select({
        childId: activeQuests.childId,
        questReward: quests.reward,
        questTitle: quests.title,
      })
      .from(activeQuests)
      .innerJoin(quests, eq(activeQuests.questId, quests.id))
      .where(eq(activeQuests.id, activeQuestId))
      .limit(1);

    if (!aq) return { error: "Solicitud no encontrada" };

    await db.update(activeQuests)
      .set({ status: 'completed', completedAt: new Date() })
      .where(eq(activeQuests.id, activeQuestId));

    const [user] = await db.select().from(users).where(eq(users.id, aq.childId!)).limit(1);
    await db.update(users)
      .set({ balance: (user.balance || 0) + aq.questReward })
      .where(eq(users.id, aq.childId!));

    await db.insert(transactions).values({
      userId: aq.childId!,
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
      .set({ status: 'in_progress' }) // Lo devolvemos a en progreso si se rechaza
      .where(eq(activeQuests.id, activeQuestId));

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return { error: "Error al rechazar" };
  }
}
