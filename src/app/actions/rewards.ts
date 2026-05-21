'use server';

import { db } from "@/db";
import { rewards } from "@/db/schema";
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

export async function createReward(formData: FormData) {
  const user = await checkParentSession();
  if (!user || !user.familyId) return { error: "No autorizado" };

  const title = formData.get("title") as string;
  const cost = parseInt(formData.get("cost") as string);
  const minutes = formData.get("minutes") ? parseInt(formData.get("minutes") as string) : null;

  try {
    await db.insert(rewards).values({
      title,
      cost,
      minutes,
      familyId: user.familyId,
      createdBy: user.id,
    });

    revalidatePath("/admin");
    return { success: true };
  } catch {
    return { error: "Error al crear premio" };
  }
}

export async function getRewards() {
  const session = await getServerSession(authOptions);
  if (!session) return [];
  const familyId = (session.user as AuthUser).familyId;
  if (!familyId) return [];

  const data = await db
    .select()
    .from(rewards)
    .where(eq(rewards.familyId, familyId))
    .orderBy(desc(rewards.createdAt));

  return data;
}

export async function updateReward(id: string, formData: FormData) {
  const user = await checkParentSession();
  if (!user || !user.familyId) return { error: "No autorizado" };

  const title = formData.get("title") as string;
  const cost = parseInt(formData.get("cost") as string);
  const minutes = formData.get("minutes") ? parseInt(formData.get("minutes") as string) : null;

  try {
    await db.update(rewards)
      .set({ title, cost, minutes })
      .where(and(eq(rewards.id, id), eq(rewards.familyId, user.familyId)));
    
    revalidatePath("/admin");
    return { success: true };
  } catch {
    return { error: "Error al actualizar" };
  }
}

export async function deleteReward(id: string) {
  const user = await checkParentSession();
  if (!user || !user.familyId) return { error: "No autorizado" };

  try {
    await db.delete(rewards)
      .where(and(eq(rewards.id, id), eq(rewards.familyId, user.familyId)));
    
    revalidatePath("/admin");
    return { success: true };
  } catch {
    return { error: "Error al eliminar" };
  }
}
