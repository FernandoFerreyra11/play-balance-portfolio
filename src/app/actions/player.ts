'use server';

import { db } from "@/db";
import { users, quests, rewards, activeQuests, transactions } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getPlayerStats() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, (session.user as any).id))
    .limit(1);

  return user;
}

export async function getAvailableQuests() {
  const session = await getServerSession(authOptions);
  if (!session) return [];

  const player = await getPlayerStats();
  if (!player || !player.parentId) return [];

  // Obtenemos todas las misiones del padre
  const parentQuests = await db
    .select({
      id: quests.id,
      title: quests.title,
      reward: quests.reward,
      category: quests.category,
      status: activeQuests.status,
    })
    .from(quests)
    .leftJoin(activeQuests, and(
      eq(quests.id, activeQuests.questId),
      eq(activeQuests.childId, player.id),
      eq(activeQuests.status, 'pending_approval')
    ))
    .where(eq(quests.createdBy, player.parentId))
    .orderBy(desc(quests.createdAt));

  return parentQuests;
}

export async function getAvailableRewards() {
  const session = await getServerSession(authOptions);
  if (!session) return [];

  const player = await getPlayerStats();
  if (!player || !player.parentId) return [];

  const parentRewards = await db
    .select()
    .from(rewards)
    .where(eq(rewards.createdBy, player.parentId))
    .orderBy(desc(rewards.createdAt));

  return parentRewards;
}

export async function requestQuestCompletion(questId: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "No autorizado" };

  try {
    await db.insert(activeQuests).values({
      childId: (session.user as any).id,
      questId,
      status: 'pending_approval', // Usamos el enum del esquema
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { error: "Error al solicitar aprobación" };
  }
}

export async function requestReward(rewardId: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "No autorizado" };

  const player = await getPlayerStats();
  if (!player) return { error: "Jugador no encontrado" };

  const [reward] = await db
    .select()
    .from(rewards)
    .where(eq(rewards.id, rewardId))
    .limit(1);

  if (!reward) return { error: "Premio no encontrado" };
  if (player.balance! < reward.cost) return { error: "No tienes suficientes tokens" };

  try {
    // 1. Restar balance
    await db.update(users)
      .set({ balance: player.balance! - reward.cost })
      .where(eq(users.id, player.id));

    // 2. Registrar transacción
    await db.insert(transactions).values({
      userId: player.id,
      amount: -reward.cost,
      type: 'reward',
      description: `Canje de premio: ${reward.title}`,
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { error: "Error al procesar el canje" };
  }
}
