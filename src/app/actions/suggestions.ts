'use server';

import { db } from "@/db";
import { users, suggestions } from "@/db/schema";
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

async function checkChildSession() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as AuthUser).role !== 'child') {
    return null;
  }
  return session.user as { id: string; familyId: string; role: string };
}

export async function createSuggestion(content: string) {
  const user = await checkChildSession();
  if (!user) return { error: "No autorizado" };

  try {
    await db.insert(suggestions).values({
      childId: user.id,
      content,
    });
    revalidatePath("/");
    return { success: true };
  } catch {
    return { error: "Error al enviar la sugerencia" };
  }
}

export async function getMySuggestions() {
  const user = await checkChildSession();
  if (!user) return [];

  const data = await db
    .select()
    .from(suggestions)
    .where(eq(suggestions.childId, user.id))
    .orderBy(desc(suggestions.createdAt));

  return data;
}

export async function getSuggestions() {
  const user = await checkParentSession();
  if (!user || !user.familyId) return [];

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
    .where(eq(users.familyId, user.familyId))
    .orderBy(desc(suggestions.createdAt));

  return data;
}

export async function updateSuggestionStatus(id: string, status: 'approved' | 'rejected') {
  const user = await checkParentSession();
  if (!user || !user.familyId) return { error: "No autorizado" };

  try {
    // Verificar que la sugerencia pertenezca a un miembro de la familia del padre (evitar IDOR)
    const [sug] = await db
      .select({ id: suggestions.id })
      .from(suggestions)
      .innerJoin(users, eq(suggestions.childId, users.id))
      .where(and(
        eq(suggestions.id, id),
        eq(users.familyId, user.familyId)
      ))
      .limit(1);

    if (!sug) return { error: "Sugerencia no encontrada o no pertenece a tu equipo" };

    await db.update(suggestions)
      .set({ status })
      .where(eq(suggestions.id, id));
    
    revalidatePath("/admin");
    return { success: true };
  } catch {
    return { error: "Error al actualizar la sugerencia" };
  }
}
