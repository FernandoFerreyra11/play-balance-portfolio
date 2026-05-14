'use server';

import { db } from "@/db";
import { users, families, quests, rewards, suggestions, activeQuests, transactions } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function getEffectiveFamilyId() {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  return (session.user as any).familyId;
}

export async function createFamilyMember(formData: FormData) {
  const session = await getServerSession(authOptions);
  const familyId = await getEffectiveFamilyId();

  if (!session || (session.user as any).role !== 'parent' || !familyId) {
    return { error: "No tienes permiso para realizar esta acción" };
  }

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as 'child' | 'parent';
  const image = formData.get("image") as string;

  if (!name || !password || !role) {
    return { error: "Nombre, contraseña y rol son obligatorios" };
  }

  if (email) {
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (existing) return { error: "Este correo ya está registrado" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await db.insert(users).values({
      name,
      email: email || null,
      password: hashedPassword,
      role,
      image: image || '👤',
      parentId: (session.user as any).id,
      familyId: familyId as string,
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return { error: "Error al crear el miembro de la familia" };
  }
}

export async function getFamilyMembers() {
  const familyId = await getEffectiveFamilyId();
  if (!familyId) return [];

  const members = await db
    .select({
      id: users.id,
      name: users.name,
      role: users.role,
      balance: users.balance,
      image: users.image,
    })
    .from(users)
    .where(eq(users.familyId, familyId as string));

  return members;
}

export async function updateFamilyMember(id: string, formData: FormData) {
  const familyId = await getEffectiveFamilyId();
  if (!familyId) return { error: "No autorizado" };

  const name = formData.get("name") as string;
  const role = formData.get("role") as 'child' | 'parent';
  const password = formData.get("password") as string;
  const image = formData.get("image") as string;

  const updateData: any = { name, role, image };
  if (password) {
    updateData.password = await bcrypt.hash(password, 10);
  }

  try {
    await db.update(users)
      .set(updateData)
      .where(and(eq(users.id, id), eq(users.familyId, familyId as string)));
    
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return { error: "Error al actualizar" };
  }
}

export async function deleteFamilyMember(id: string) {
  const familyId = await getEffectiveFamilyId();
  if (!familyId) return { error: "No autorizado" };

  try {
    await db.delete(users)
      .where(and(eq(users.id, id), eq(users.familyId, familyId as string)));
    
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return { error: "Error al eliminar" };
  }
}

export async function getFamilyDetail() {
  const familyId = await getEffectiveFamilyId();
  if (!familyId) return null;

  const [family] = await db
    .select()
    .from(families)
    .where(eq(families.id, familyId as string))
    .limit(1);
  
  return family;
}

export async function deleteOwnFamily() {
  const session = await getServerSession(authOptions);
  const familyId = await getEffectiveFamilyId();

  if (!session || (session.user as any).role !== 'parent' || !familyId) {
    return { error: "No autorizado" };
  }

  try {
    // 1. Obtener IDs de todos los usuarios de la familia para limpiar sus datos
    const familyUsers = await db.select({ id: users.id }).from(users).where(eq(users.familyId, familyId as string));
    const userIds = familyUsers.map(u => u.id);

    if (userIds.length > 0) {
      // 2. Limpiar datos vinculados a usuarios
      await db.delete(transactions).where(inArray(transactions.userId, userIds));
      await db.delete(activeQuests).where(inArray(activeQuests.childId, userIds));
      await db.delete(suggestions).where(inArray(suggestions.childId, userIds));
    }

    // 3. Limpiar datos vinculados a la familia
    await db.delete(rewards).where(eq(rewards.familyId, familyId as string));
    await db.delete(quests).where(eq(quests.familyId, familyId as string));
    
    // 4. Borrar todos los usuarios de la familia
    await db.delete(users).where(eq(users.familyId, familyId as string));
    
    // 5. Borrar la familia
    await db.delete(families).where(eq(families.id, familyId as string));
    
    return { success: true };
  } catch (error) {
    console.error("Error al eliminar propia familia:", error);
    return { error: "Error al eliminar la cuenta familiar" };
  }
}
