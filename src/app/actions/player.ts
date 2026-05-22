'use server';

import { db } from "@/db";
import { users, quests, rewards, activeQuests, transactions } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

interface AuthUser {
  id?: string;
  familyId?: string;
  role?: string;
}

export async function getPlayerStats() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, (session.user as AuthUser).id as string))
    .limit(1);

  return user;
}

export async function getAvailableQuests() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as AuthUser).role !== 'child') return [];

  const player = await getPlayerStats();
  if (!player || !player.familyId) return [];

  // Obtenemos todas las misiones del capitán
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
    .where(eq(quests.familyId, player.familyId))
    .orderBy(desc(quests.createdAt));

  return parentQuests;
}

export async function getAvailableRewards() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as AuthUser).role !== 'child') return [];

  const player = await getPlayerStats();
  if (!player || !player.familyId) return [];

  const parentRewards = await db
    .select()
    .from(rewards)
    .where(eq(rewards.familyId, player.familyId))
    .orderBy(desc(rewards.createdAt));

  return parentRewards;
}

export async function requestQuestCompletion(questId: string) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as AuthUser).role !== 'child') return { error: "No autorizado" };

  const familyId = (session.user as AuthUser).familyId;
  if (!familyId) return { error: "No autorizado" };

  try {
    // Verificar que la misión pertenezca a la familia del menor (evitar IDOR)
    const [quest] = await db
      .select({ id: quests.id })
      .from(quests)
      .where(and(eq(quests.id, questId), eq(quests.familyId, familyId)))
      .limit(1);

    if (!quest) return { error: "Misión no encontrada o no pertenece a tu equipo" };

    await db.insert(activeQuests).values({
      childId: (session.user as AuthUser).id as string,
      questId,
      status: 'pending_approval',
    });

    revalidatePath("/");
    return { success: true };
  } catch {
    return { error: "Error al solicitar aprobación" };
  }
}

export async function requestReward(rewardId: string) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as AuthUser).role !== 'child') return { error: "No autorizado" };

  const playerId = (session.user as AuthUser).id as string;
  const familyId = (session.user as AuthUser).familyId;
  if (!familyId) return { error: "No autorizado" };

  try {
    // Obtener jugador y premio sin transacción anidada
    const [player] = await db
      .select()
      .from(users)
      .where(eq(users.id, playerId))
      .limit(1);

    if (!player) return { error: "Jugador no encontrado" };

    const [reward] = await db
      .select()
      .from(rewards)
      .where(and(eq(rewards.id, rewardId), eq(rewards.familyId, familyId)))
      .limit(1);

    if (!reward) return { error: "Premio no encontrado o no pertenece a tu equipo" };
    if ((player.balance || 0) < reward.cost) return { error: "No tienes suficientes tokens" };

    // 1. Restar balance
    await db.update(users)
      .set({ balance: (player.balance || 0) - reward.cost })
      .where(eq(users.id, playerId));

    // 2. Registrar transacción
    await db.insert(transactions).values({
      userId: playerId,
      amount: -reward.cost,
      type: 'reward',
      description: `Canje de premio: ${reward.title}`,
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error al procesar el canje de premio:", error);
    return { error: "Error al procesar el canje" };
  }
}

export async function getFamilyStats(period: '7d' | '30d' | 'all', childId?: string) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return null;

  const familyId = (session.user as AuthUser).familyId;
  if (!familyId) return null;

  // Si se pasa childId, verificar que el menor pertenezca al mismo familyId (evitar IDOR)
  if (childId) {
    const [child] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, childId), eq(users.familyId, familyId)))
      .limit(1);
    if (!child) return null;
  }

  // Calculamos la fecha de inicio
  let startDate = new Date(0); // Por defecto 'all'
  if (period === '7d') startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  if (period === '30d') startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // 1. Obtener todas las transacciones de los aventureros de este equipo en el período
  const data = await db
    .select({
      id: transactions.id,
      amount: transactions.amount,
      type: transactions.type,
      description: transactions.description,
      createdAt: transactions.createdAt,
      userName: users.name,
      userImage: users.image,
      userId: users.id,
    })
    .from(transactions)
    .innerJoin(users, eq(transactions.userId, users.id))
    .where(and(
      childId ? eq(users.id, childId) : eq(users.familyId, familyId),
    ))
    .orderBy(desc(transactions.createdAt));

  // Filtrado manual por fecha para mayor compatibilidad
  const filteredData = data.filter(t => new Date(t.createdAt!) >= startDate);

  // 2. Agrupar totales
  const totalEarned = filteredData.filter(t => t.type === 'quest').reduce((acc, t) => acc + t.amount, 0);
  const totalSpent = Math.abs(filteredData.filter(t => t.type === 'reward').reduce((acc, t) => acc + t.amount, 0));
  const questsCount = filteredData.filter(t => t.type === 'quest').length;
  const rewardsCount = filteredData.filter(t => t.type === 'reward').length;

  return {
    transactions: filteredData,
    summary: {
      totalEarned,
      totalSpent,
      questsCount,
      rewardsCount
    }
  };
}

export async function awardSpontaneousTokens(childId: string, amount: number, description: string) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as AuthUser).role !== 'parent') return { error: "No autorizado" };

  const familyId = (session.user as AuthUser).familyId;
  if (!familyId) return { error: "No autorizado" };
  if (amount <= 0) return { error: "La cantidad debe ser mayor a 0" };

  try {
    // Verificamos que el aventurero pertenece al mismo equipo
    const [child] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, childId), eq(users.familyId, familyId)))
      .limit(1);

    if (!child) return { error: "Aventurero no encontrado o no pertenece al equipo" };

    // 1. Sumar balance
    await db.update(users)
      .set({ balance: (child.balance || 0) + amount })
      .where(eq(users.id, childId));

    // 2. Registrar transacción
    await db.insert(transactions).values({
      userId: childId,
      amount: amount,
      type: 'bonus',
      description: `Bonus: ${description}`,
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Error al otorgar tokens espontáneos:", error);
    return { error: "Error al otorgar el bonus" };
  }
}
