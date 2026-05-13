'use server';

import { db } from "@/db";
import { rewards } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createReward(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'parent') return { error: "No autorizado" };

  const title = formData.get("title") as string;
  const cost = parseInt(formData.get("cost") as string);
  const minutes = formData.get("minutes") ? parseInt(formData.get("minutes") as string) : null;

  if (!title || isNaN(cost)) return { error: "Título y costo son obligatorios" };

  try {
    await db.insert(rewards).values({
      title,
      cost,
      minutes,
      createdBy: (session.user as any).id,
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return { error: "Error al crear el premio" };
  }
}

export async function getRewards() {
  const session = await getServerSession(authOptions);
  if (!session) return [];

  const data = await db
    .select()
    .from(rewards)
    .where(eq(rewards.createdBy, (session.user as any).id));

  return data;
}

export async function updateReward(id: string, formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'parent') return { error: "No autorizado" };

  const title = formData.get("title") as string;
  const cost = parseInt(formData.get("cost") as string);
  const minutes = formData.get("minutes") ? parseInt(formData.get("minutes") as string) : null;

  try {
    await db.update(rewards)
      .set({ title, cost, minutes })
      .where(and(eq(rewards.id, id), eq(rewards.createdBy, (session.user as any).id)));
    
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return { error: "Error al actualizar" };
  }
}

export async function deleteReward(id: string) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'parent') return { error: "No autorizado" };

  try {
    await db.delete(rewards)
      .where(and(eq(rewards.id, id), eq(rewards.createdBy, (session.user as any).id)));
    
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return { error: "Error al eliminar" };
  }
}
