'use server';

import { db } from "@/db";
import { quests } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createQuest(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'parent') return { error: "No autorizado" };

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const tokens = parseInt(formData.get("tokens") as string);
  const category = formData.get("category") as string;

  if (!title || isNaN(tokens)) return { error: "Título y tokens son obligatorios" };

  try {
    await db.insert(quests).values({
      title,
      description,
      tokens,
      category,
      createdBy: (session.user as any).id,
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return { error: "Error al crear la misión" };
  }
}

export async function getQuests() {
  const session = await getServerSession(authOptions);
  if (!session) return [];

  // Obtenemos las misiones creadas por este padre
  const data = await db
    .select()
    .from(quests)
    .where(eq(quests.createdBy, (session.user as any).id));

  return data;
}

export async function deleteQuest(id: string) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'parent') return { error: "No autorizado" };

  try {
    await db.delete(quests)
      .where(and(eq(quests.id, id), eq(quests.createdBy, (session.user as any).id)));
    
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return { error: "Error al eliminar la misión" };
  }
}
