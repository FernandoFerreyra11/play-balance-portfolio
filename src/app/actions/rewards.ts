'use server';

import { db } from "@/db";
import { rewards } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function getEffectiveFamilyId() {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  return (session.user as any).familyId;
}

export async function createReward(formData: FormData) {
  const familyId = await getEffectiveFamilyId();
  if (!familyId) return { error: "No autorizado" };

  const session = await getServerSession(authOptions);
  const title = formData.get("title") as string;
  const cost = parseInt(formData.get("cost") as string);
  const minutes = formData.get("minutes") ? parseInt(formData.get("minutes") as string) : null;

  try {
    await db.insert(rewards).values({
      title,
      cost,
      minutes,
      familyId: familyId as string,
      createdBy: (session?.user as any)?.id,
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return { error: "Error al crear premio" };
  }
}

export async function getRewards() {
  const familyId = await getEffectiveFamilyId();
  if (!familyId) return [];

  const data = await db
    .select()
    .from(rewards)
    .where(eq(rewards.familyId, familyId as string))
    .orderBy(desc(rewards.createdAt));

  return data;
}

export async function updateReward(id: string, formData: FormData) {
  const familyId = await getEffectiveFamilyId();
  if (!familyId) return { error: "No autorizado" };

  const title = formData.get("title") as string;
  const cost = parseInt(formData.get("cost") as string);
  const minutes = formData.get("minutes") ? parseInt(formData.get("minutes") as string) : null;

  try {
    await db.update(rewards)
      .set({ title, cost, minutes })
      .where(and(eq(rewards.id, id), eq(rewards.familyId, familyId as string)));
    
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return { error: "Error al actualizar" };
  }
}

export async function deleteReward(id: string) {
  const familyId = await getEffectiveFamilyId();
  if (!familyId) return { error: "No autorizado" };

  try {
    await db.delete(rewards)
      .where(and(eq(rewards.id, id), eq(rewards.familyId, familyId as string)));
    
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return { error: "Error al eliminar" };
  }
}
