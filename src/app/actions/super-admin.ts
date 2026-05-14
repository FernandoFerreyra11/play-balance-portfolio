'use server';

import { db } from "@/db";
import { users, families, quests, transactions } from "@/db/schema";
import { count, eq, sql } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { revalidatePath } from "next/cache";

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

export async function deleteFamily(id: string) {
  if (!(await checkSuperAdmin())) return { error: "No autorizado" };

  try {
    // Primero borramos los usuarios vinculados a esa familia
    await db.delete(users).where(eq(users.familyId, id));
    // Luego borramos la familia
    await db.delete(families).where(eq(families.id, id));
    
    revalidatePath("/super-admin");
    return { success: true };
  } catch (error) {
    return { error: "Error al eliminar la familia" };
  }
}

export async function resetFamilyCode(id: string, familyName: string) {
  if (!(await checkSuperAdmin())) return { error: "No autorizado" };

  const newCode = `${familyName.split(' ')[0].toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

  try {
    await db.update(families)
      .set({ code: newCode })
      .where(eq(families.id, id));
    
    revalidatePath("/super-admin");
    return { success: true, newCode };
  } catch (error) {
    return { error: "Error al resetear código" };
  }
}

export async function updateFamilyName(id: string, newName: string) {
  if (!(await checkSuperAdmin())) return { error: "No autorizado" };

  try {
    await db.update(families)
      .set({ name: newName })
      .where(eq(families.id, id));
    
    revalidatePath("/super-admin");
    return { success: true };
  } catch (error) {
    return { error: "Error al actualizar nombre" };
  }
}

