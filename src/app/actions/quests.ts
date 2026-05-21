'use server';

import { db } from "@/db";
import { quests } from "@/db/schema";
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

export async function createQuest(formData: FormData) {
  const user = await checkParentSession();
  if (!user || !user.familyId) return { error: "No autorizado" };

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const tokens = parseInt(formData.get("tokens") as string);
  const category = formData.get("category") as string;

  if (!title || isNaN(tokens)) return { error: "Título y tokens son obligatorios" };

  try {
    await db.insert(quests).values({
      title,
      description,
      reward: tokens,
      category,
      familyId: user.familyId,
      createdBy: user.id,
    });

    revalidatePath("/admin");
    return { success: true };
  } catch {
    return { error: "Error al crear la misión" };
  }
}

export async function getQuests() {
  const session = await getServerSession(authOptions);
  if (!session) return [];
  const familyId = (session.user as AuthUser).familyId;
  if (!familyId) return [];

  // Obtenemos las misiones de la familia
  const data = await db
    .select()
    .from(quests)
    .where(eq(quests.familyId, familyId))
    .orderBy(desc(quests.createdAt));

  return data;
}

export async function deleteQuest(id: string) {
  const user = await checkParentSession();
  if (!user || !user.familyId) return { error: "No autorizado" };

  try {
    await db.delete(quests)
      .where(and(eq(quests.id, id), eq(quests.familyId, user.familyId)));
    
    revalidatePath("/admin");
    return { success: true };
  } catch {
    return { error: "Error al eliminar la misión" };
  }
}

export async function updateQuest(id: string, formData: FormData) {
  const user = await checkParentSession();
  if (!user || !user.familyId) return { error: "No autorizado" };

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const tokens = parseInt(formData.get("tokens") as string);
  const category = formData.get("category") as string;

  if (!title || isNaN(tokens)) return { error: "Título y tokens son obligatorios" };

  try {
    await db.update(quests)
      .set({
        title,
        description,
        reward: tokens,
        category,
      })
      .where(and(eq(quests.id, id), eq(quests.familyId, user.familyId)));
    
    revalidatePath("/admin");
    return { success: true };
  } catch {
    return { error: "Error al actualizar la misión" };
  }
}

