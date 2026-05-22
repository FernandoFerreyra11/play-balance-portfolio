'use server';

import { db } from "@/db";
import { users, quests, activeQuests, transactions } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

interface AuthUser {
  id?: string;
  familyId?: string;
  role?: string;
}

async function checkParentSession() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as AuthUser).role !== 'parent') {
    return null;
  }
  return session.user as { id: string; familyId: string; role: string };
}

export async function getPendingApprovals() {
  const user = await checkParentSession();
  if (!user || !user.familyId) return [];

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
        eq(users.familyId, user.familyId)
      )
    )
    .orderBy(desc(activeQuests.createdAt));

  return pending;
}

export async function approveQuest(activeQuestId: string) {
  const user = await checkParentSession();
  if (!user || !user.familyId) return { error: "No autorizado" };

  try {
    const [aq] = await db
      .select({
        childId: activeQuests.childId,
        childFamilyId: users.familyId,
        questReward: quests.reward,
        questTitle: quests.title,
      })
      .from(activeQuests)
      .innerJoin(users, eq(activeQuests.childId, users.id))
      .innerJoin(quests, eq(activeQuests.questId, quests.id))
      .where(and(
        eq(activeQuests.id, activeQuestId),
        eq(users.familyId, user.familyId)
      ))
      .limit(1);

    if (!aq) return { error: "Solicitud no encontrada o no pertenece a tu equipo" };

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
      description: `Misión completada: ${aq.questTitle}`,
    });

    revalidatePath("/admin");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error al aprobar misión:", error);
    return { error: "Error al aprobar la misión" };
  }
}

export async function rejectQuest(activeQuestId: string) {
  const user = await checkParentSession();
  if (!user || !user.familyId) return { error: "No autorizado" };

  try {
    const [aq] = await db
      .select({
        id: activeQuests.id,
      })
      .from(activeQuests)
      .innerJoin(users, eq(activeQuests.childId, users.id))
      .where(and(
        eq(activeQuests.id, activeQuestId),
        eq(users.familyId, user.familyId)
      ))
      .limit(1);

    if (!aq) return { error: "Solicitud no encontrada o no pertenece a tu equipo" };

    await db.update(activeQuests)
      .set({ status: 'in_progress' })
      .where(eq(activeQuests.id, activeQuestId));

    revalidatePath("/admin");
    return { success: true };
  } catch {
    return { error: "Error al rechazar" };
  }
}
