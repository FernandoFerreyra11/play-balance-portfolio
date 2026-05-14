'use server';

import { db } from "@/db";
import { quests } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function getEffectiveFamilyId() {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  return (session.user as any).familyId;
}

export async function createQuest(formData: FormData) {
  const familyId = await getEffectiveFamilyId();
  if (!familyId) return { error: "No autorizado" };

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const tokens = parseInt(formData.get("tokens") as string);
  const category = formData.get("category") as string;

  if (!title || isNaN(tokens)) return { error: "Título y tokens son obligatorios" };

  try {
    const session = await getServerSession(authOptions);
    await db.insert(quests).values({
      title,
      description,
      reward: tokens,
      category,
      familyId: familyId as string,
      createdBy: session?.user?.id,
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return { error: "Error al crear la misión" };
  }
}

export async function getQuests() {
  const familyId = await getEffectiveFamilyId();
  if (!familyId) return [];

  // Obtenemos las misiones de la familia
  const data = await db
    .select()
    .from(quests)
    .where(eq(quests.familyId, familyId as string))
    .orderBy(desc(quests.createdAt));

  return data;
}

export async function deleteQuest(id: string) {
  const familyId = await getEffectiveFamilyId();
  if (!familyId) return { error: "No autorizado" };

  try {
    await db.delete(quests)
      .where(and(eq(quests.id, id), eq(quests.familyId, familyId as string)));
    
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return { error: "Error al eliminar la misión" };
  }
}
