'use server';

import { db } from "@/db";
import { users, bodyCheckins, transactions } from "@/db/schema";
import { eq, and, gte } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

interface AuthUser {
  id?: string;
  familyId?: string;
  role?: string;
}

const CHECKIN_REWARD = 10;

export async function submitBodyCheckin(
  eyes: string,
  neck: string,
  head: string
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as AuthUser).role !== 'child') {
    return { error: "No autorizado" };
  }

  const childId = (session.user as AuthUser).id as string;

  // Check if already done today
  const today = await getTodayCheckin();
  if (today) {
    return { error: "Ya completaste tu check-in de hoy. ¡Volvé mañana!" };
  }

  try {
    // 1. Save check-in
    await db.insert(bodyCheckins).values({ childId, eyes, neck, head });

    // 2. Award tokens
    const [child] = await db.select().from(users).where(eq(users.id, childId)).limit(1);
    await db.update(users)
      .set({ balance: (child.balance || 0) + CHECKIN_REWARD })
      .where(eq(users.id, childId));

    // 3. Record transaction
    await db.insert(transactions).values({
      userId: childId,
      amount: CHECKIN_REWARD,
      type: 'bonus',
      description: '🌿 Check-in corporal completado',
    });

    revalidatePath("/");
    return { success: true, tokensEarned: CHECKIN_REWARD };
  } catch (error) {
    console.error("Error al guardar check-in:", error);
    return { error: "Error al guardar el check-in" };
  }
}

export async function getTodayCheckin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as AuthUser).role !== 'child') return null;

  const childId = (session.user as AuthUser).id as string;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [existing] = await db
    .select()
    .from(bodyCheckins)
    .where(and(
      eq(bodyCheckins.childId, childId),
      gte(bodyCheckins.createdAt, startOfDay)
    ))
    .limit(1);

  return existing || null;
}

export async function getChildCheckins(childId: string) {
  const session = await getServerSession(authOptions);
  if (!session) return [];
  
  const role = (session.user as AuthUser).role;
  if (role !== 'parent' && role !== 'professional' && role !== 'super_admin') return [];

  const checkins = await db
    .select()
    .from(bodyCheckins)
    .where(eq(bodyCheckins.childId, childId))
    .orderBy(bodyCheckins.createdAt)
    .limit(14); // últimas 2 semanas

  return checkins;
}
