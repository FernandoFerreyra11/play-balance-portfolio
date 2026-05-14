'use server';

import { db } from "@/db";
import { users, families, quests, transactions } from "@/db/schema";
import { count, eq, sql } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

async function checkSuperAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'super_admin') {
    return false;
  }
  return true;
}

export async function getGlobalStats() {
  if (!(await checkSuperAdmin())) return null;

  const [familiesCount] = await db.select({ value: count() }).from(families);
  const [usersCount] = await db.select({ value: count() }).from(users);
  const [questsCount] = await db.select({ value: count() }).from(quests);
  
  // Total de tokens en circulación
  const [tokensInCirculation] = await db.select({ 
    value: sql<number>`sum(${users.balance})` 
  }).from(users);

  return {
    families: familiesCount.value,
    users: usersCount.value,
    quests: questsCount.value,
    tokens: tokensInCirculation.value || 0,
  };
}

export async function getAllFamilies() {
  if (!(await checkSuperAdmin())) return [];

  const data = await db
    .select({
      id: families.id,
      name: families.name,
      code: families.code,
      createdAt: families.createdAt,
      memberCount: count(users.id),
    })
    .from(families)
    .leftJoin(users, eq(families.id, users.familyId))
    .groupBy(families.id)
    .orderBy(families.createdAt);

  return data;
}
