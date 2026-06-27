'use server';

import { db } from "@/db";
import { users, families, quests, rewards, suggestions, activeQuests, transactions } from "@/db/schema";
import { count, eq, sql, inArray } from "drizzle-orm";
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
    // 1. Obtener IDs de todos los usuarios de la familia
    const familyUsers = await db.select({ id: users.id }).from(users).where(eq(users.familyId, id));
    const userIds = familyUsers.map(u => u.id);

    if (userIds.length > 0) {
      // 2. Limpiar datos vinculados a usuarios
      await db.delete(transactions).where(inArray(transactions.userId, userIds));
      await db.delete(activeQuests).where(inArray(activeQuests.childId, userIds));
      await db.delete(suggestions).where(inArray(suggestions.childId, userIds));
    }

    // 3. Limpiar datos vinculados a la familia por familyId
    await db.delete(rewards).where(eq(rewards.familyId, id));
    await db.delete(quests).where(eq(quests.familyId, id));
    
    // 4. Borrar los usuarios
    await db.delete(users).where(eq(users.familyId, id));
    
    // 5. Finalmente borrar la familia
    await db.delete(families).where(eq(families.id, id));
    
    revalidatePath("/super-admin");
    return { success: true };
  } catch (error) {
    console.error("Error al eliminar familia:", error);
    return { error: "Error al eliminar la familia. Asegúrate de que no haya dependencias circulares." };
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
  } catch (_error) {
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
  } catch (_error) {
    return { error: "Error al actualizar nombre" };
  }
}
