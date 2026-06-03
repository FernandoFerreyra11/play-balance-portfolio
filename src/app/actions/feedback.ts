'use server';

import { db } from "@/db";
import { betaFeedback, families, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function submitBetaFeedback(type: 'bug' | 'feature' | 'other', content: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "No autorizado" };

  const userId = (session.user as any).id;
  const familyId = (session.user as any).familyId;

  try {
    await db.insert(betaFeedback).values({
      familyId,
      userId,
      type,
      content,
    });
    
    return { success: true };
  } catch (error) {
    console.error("Error al enviar feedback:", error);
    return { error: "Error al enviar el reporte." };
  }
}

export async function getBetaFeedback() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'super_admin') {
    return { error: "No autorizado" };
  }

  try {
    const feedbackList = await db
      .select({
        id: betaFeedback.id,
        type: betaFeedback.type,
        content: betaFeedback.content,
        status: betaFeedback.status,
        createdAt: betaFeedback.createdAt,
        familyName: families.name,
        userEmail: users.email,
      })
      .from(betaFeedback)
      .leftJoin(families, eq(betaFeedback.familyId, families.id))
      .leftJoin(users, eq(betaFeedback.userId, users.id))
      .orderBy(desc(betaFeedback.createdAt));

    return { success: true, data: feedbackList };
  } catch (error) {
    console.error("Error al obtener feedback:", error);
    return { error: "Error al obtener la lista de feedback." };
  }
}

export async function markFeedbackReviewed(id: string) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'super_admin') {
    return { error: "No autorizado" };
  }

  try {
    await db.update(betaFeedback)
      .set({ status: 'reviewed' })
      .where(eq(betaFeedback.id, id));
      
    revalidatePath('/super-admin');
    return { success: true };
  } catch (error) {
    console.error("Error al marcar como revisado:", error);
    return { error: "No se pudo actualizar el estado." };
  }
}
