'use server';

import { db } from "@/db";
import { users, suggestions } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createSuggestion(content: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "No autorizado" };

  try {
    await db.insert(suggestions).values({
      childId: (session.user as any).id,
      content,
    });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { error: "Error al enviar la sugerencia" };
  }
}

export async function getSuggestions() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'parent') return [];

  const parentId = (session.user as any).id;

  const data = await db
    .select({
      id: suggestions.id,
      content: suggestions.content,
      status: suggestions.status,
      createdAt: suggestions.createdAt,
      childName: users.name,
      childImage: users.image,
    })
    .from(suggestions)
    .innerJoin(users, eq(suggestions.childId, users.id))
    .where(eq(users.parentId, parentId))
    .orderBy(desc(suggestions.createdAt));

  return data;
}

export async function updateSuggestionStatus(id: string, status: 'approved' | 'rejected') {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'parent') return { error: "No autorizado" };

  try {
    await db.update(suggestions)
      .set({ status })
      .where(eq(suggestions.id, id));
    
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return { error: "Error al actualizar la sugerencia" };
  }
}
