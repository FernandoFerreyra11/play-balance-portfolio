'use server';

import { db } from "@/db";
import { users, bodyCheckins, moodCheckins, transactions } from "@/db/schema";
import { eq, and, gte } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

interface AuthUser {
  id?: string;
  familyId?: string;
  role?: string;
}

const BODY_CHECKIN_REWARD = 10;
const MOOD_CHECKIN_REWARD = 5;

// Streak milestone bonuses
const STREAK_MILESTONES: Record<number, number> = {
  7: 50,
  14: 100,
  30: 200,
};

// === STREAK LOGIC ===

function getTodayDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function getYesterdayDateString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
}

async function updateStreak(childId: string): Promise<{ newStreak: number; milestoneBonus: number }> {
  const [child] = await db.select().from(users).where(eq(users.id, childId)).limit(1);
  if (!child) return { newStreak: 0, milestoneBonus: 0 };

  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();

  // Already counted today
  if (child.lastCheckinDate === today) {
    return { newStreak: child.currentStreak || 0, milestoneBonus: 0 };
  }

  let newStreak: number;
  if (child.lastCheckinDate === yesterday) {
    // Consecutive day!
    newStreak = (child.currentStreak || 0) + 1;
  } else {
    // Streak broken or first time
    newStreak = 1;
  }

  const newLongest = Math.max(child.longestStreak || 0, newStreak);

  // Check for milestone bonus
  let milestoneBonus = 0;
  if (STREAK_MILESTONES[newStreak]) {
    milestoneBonus = STREAK_MILESTONES[newStreak];

    // Award milestone tokens
    await db.update(users)
      .set({ balance: (child.balance || 0) + milestoneBonus })
      .where(eq(users.id, childId));

    await db.insert(transactions).values({
      userId: childId,
      amount: milestoneBonus,
      type: 'bonus',
      description: `🔥 ¡Racha de ${newStreak} días! Bonus especial`,
    });
  }

  // Update streak fields
  await db.update(users)
    .set({
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastCheckinDate: today,
    })
    .where(eq(users.id, childId));

  return { newStreak, milestoneBonus };
}

// === BODY CHECK-IN ===

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
    return { error: "Ya completaste tu check-in corporal de hoy. ¡Volvé mañana!" };
  }

  try {
    // 1. Save check-in
    await db.insert(bodyCheckins).values({ childId, eyes, neck, head });

    // 2. Award tokens
    const [child] = await db.select().from(users).where(eq(users.id, childId)).limit(1);
    await db.update(users)
      .set({ balance: (child.balance || 0) + BODY_CHECKIN_REWARD })
      .where(eq(users.id, childId));

    // 3. Record transaction
    await db.insert(transactions).values({
      userId: childId,
      amount: BODY_CHECKIN_REWARD,
      type: 'bonus',
      description: '🌿 Check-in corporal completado',
    });

    // 4. Update streak
    const streakResult = await updateStreak(childId);

    revalidatePath("/");
    return {
      success: true,
      tokensEarned: BODY_CHECKIN_REWARD,
      streakBonus: streakResult.milestoneBonus,
      currentStreak: streakResult.newStreak,
    };
  } catch (error) {
    console.error("Error al guardar check-in:", error);
    return { error: "Error al guardar el check-in" };
  }
}

// === MOOD CHECK-IN ===

export async function submitMoodCheckin(
  mood: string,
  energy: string,
  note?: string
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as AuthUser).role !== 'child') {
    return { error: "No autorizado" };
  }

  const childId = (session.user as AuthUser).id as string;

  // Check if already done today
  const todayMood = await getTodayMoodCheckin();
  if (todayMood) {
    return { error: "Ya completaste tu check-in emocional de hoy. ¡Volvé mañana!" };
  }

  try {
    // 1. Save mood check-in
    await db.insert(moodCheckins).values({
      childId,
      mood,
      energy,
      note: note || null,
    });

    // 2. Award tokens
    const [child] = await db.select().from(users).where(eq(users.id, childId)).limit(1);
    await db.update(users)
      .set({ balance: (child.balance || 0) + MOOD_CHECKIN_REWARD })
      .where(eq(users.id, childId));

    // 3. Record transaction
    await db.insert(transactions).values({
      userId: childId,
      amount: MOOD_CHECKIN_REWARD,
      type: 'bonus',
      description: '🧠 Check-in emocional completado',
    });

    // 4. Update streak (in case they only do mood, not body)
    const streakResult = await updateStreak(childId);

    revalidatePath("/");
    return {
      success: true,
      tokensEarned: MOOD_CHECKIN_REWARD,
      streakBonus: streakResult.milestoneBonus,
      currentStreak: streakResult.newStreak,
    };
  } catch (error) {
    console.error("Error al guardar mood check-in:", error);
    return { error: "Error al guardar el check-in emocional" };
  }
}

// === QUERIES ===

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

export async function getTodayMoodCheckin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as AuthUser).role !== 'child') return null;

  const childId = (session.user as AuthUser).id as string;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [existing] = await db
    .select()
    .from(moodCheckins)
    .where(and(
      eq(moodCheckins.childId, childId),
      gte(moodCheckins.createdAt, startOfDay)
    ))
    .limit(1);

  return existing || null;
}

export async function getStreakInfo() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as AuthUser).role !== 'child') return null;

  const childId = (session.user as AuthUser).id as string;

  const [child] = await db
    .select({
      currentStreak: users.currentStreak,
      longestStreak: users.longestStreak,
      lastCheckinDate: users.lastCheckinDate,
    })
    .from(users)
    .where(eq(users.id, childId))
    .limit(1);

  if (!child) return null;

  // Check if streak is still active (last check-in was today or yesterday)
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();
  const isActive = child.lastCheckinDate === today || child.lastCheckinDate === yesterday;

  return {
    currentStreak: isActive ? (child.currentStreak || 0) : 0,
    longestStreak: child.longestStreak || 0,
    lastCheckinDate: child.lastCheckinDate,
    isActive,
  };
}

// === FOR PARENT / PROFESSIONAL ===

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

export async function getChildMoodCheckins(childId: string) {
  const session = await getServerSession(authOptions);
  if (!session) return [];

  const role = (session.user as AuthUser).role;
  if (role !== 'parent' && role !== 'professional' && role !== 'super_admin') return [];

  const checkins = await db
    .select()
    .from(moodCheckins)
    .where(eq(moodCheckins.childId, childId))
    .orderBy(moodCheckins.createdAt)
    .limit(14);

  return checkins;
}
