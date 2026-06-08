'use server';

import { db } from "@/db";
import { 
  users, families, quests, rewards, suggestions, activeQuests, transactions,
  rewardClaims, professionalNotes, messages, bodyCheckins, moodCheckins,
  routines, routineCompletions, jomoProjects, chatSessions, betaFeedback
} from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import bcrypt from "bcryptjs";
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

export async function createFamilyMember(formData: FormData) {
  const user = await checkParentSession();
  if (!user || !user.familyId) {
    return { error: "No tienes permiso para realizar esta acción" };
  }

  const name = formData.get("name") as string;
  const emailRaw = formData.get("email") as string;
  const email = emailRaw ? emailRaw.toLowerCase().trim() : null;
  const password = formData.get("password") as string;
  const role = formData.get("role") as 'child' | 'parent';
  const image = formData.get("image") as string;
  const birthDate = formData.get("birthDate") as string | null;

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

  // --- Límites del Plan Gratuito ---
  const familyData = await db
    .select({ plan: families.plan })
    .from(families)
    .where(eq(families.id, user.familyId))
    .limit(1);
    
  const isPremium = familyData[0]?.plan === 'premium';

  if (!isPremium) {
    const existingMembers = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.familyId, user.familyId));

    const childCount = existingMembers.filter(m => m.role === 'child').length;
    const parentCount = existingMembers.filter(m => m.role === 'parent').length;

    if (role === 'child' && childCount >= 1) {
      return { error: "El plan gratuito solo permite 1 Aventurero. Actualiza a PREMIUM para agregar más." };
    }
    
    if (role === 'parent' && parentCount >= 2) {
      return { error: "El plan gratuito solo permite un máximo de 2 Capitanes por equipo." };
    }
  }
  // ---------------------------------

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await db.insert(users).values({
      name,
      email: email,
      password: hashedPassword,
      role,
      image: image || '👤',
      parentId: user.id,
      familyId: user.familyId,
      birthDate: role === 'child' ? birthDate : null,
    });

    revalidatePath("/admin");
    return { success: true };
  } catch {
    return { error: "Error al crear el miembro de la familia" };
  }
}

export async function getFamilyMembers() {
  const session = await getServerSession(authOptions);
  if (!session) return [];
  const familyId = (session.user as AuthUser).familyId;
  if (!familyId) return [];

  const members = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      balance: users.balance,
      image: users.image,
      birthDate: users.birthDate,
    })
    .from(users)
    .where(eq(users.familyId, familyId));

  return members;
}

export async function updateFamilyMember(id: string, formData: FormData) {
  const user = await checkParentSession();
  if (!user || !user.familyId) return { error: "No autorizado" };

  const name = formData.get("name") as string;
  const role = formData.get("role") as 'child' | 'parent';
  const emailRaw = formData.get("email") as string;
  const email = emailRaw ? emailRaw.toLowerCase().trim() : null;
  const password = formData.get("password") as string;
  const image = formData.get("image") as string;
  const birthDate = formData.get("birthDate") as string | null;

  const updateData: { name?: string; role?: 'child' | 'parent'; image?: string; email?: string | null; password?: string; birthDate?: string | null } = { name, role, image, email };
  if (role === 'child') {
    updateData.birthDate = birthDate;
  }
  if (password) {
    updateData.password = await bcrypt.hash(password, 10);
  }

  try {
    await db.update(users)
      .set(updateData)
      .where(and(eq(users.id, id), eq(users.familyId, user.familyId)));
    
    revalidatePath("/admin");
    return { success: true };
  } catch {
    return { error: "Error al actualizar" };
  }
}

export async function deleteFamilyMember(id: string) {
  const user = await checkParentSession();
  if (!user || !user.familyId) return { error: "No autorizado" };

  try {
    await db.delete(users)
      .where(and(eq(users.id, id), eq(users.familyId, user.familyId)));
    
    revalidatePath("/admin");
    return { success: true };
  } catch {
    return { error: "Error al eliminar" };
  }
}

export async function getFamilyDetail() {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  const familyId = (session.user as AuthUser).familyId;
  if (!familyId) return null;

  const result = await db
    .select()
    .from(families)
    .where(eq(families.id, familyId))
    .limit(1);
  
  return result[0] || null;
}

export async function deleteOwnFamily() {
  const user = await checkParentSession();
  if (!user || !user.familyId) {
    return { error: "No autorizado" };
  }

  try {
    const familyUsers = await db.select({ id: users.id }).from(users).where(eq(users.familyId, user.familyId));
    const userIds = familyUsers.map(u => u.id);

    await db.transaction(async (tx) => {
      const now = new Date();
      if (userIds.length > 0) {
        await tx.update(users).set({ deletedAt: now }).where(inArray(users.id, userIds));
      }
      await tx.update(families).set({ deletedAt: now }).where(eq(families.id, user.familyId));
    });
    
    return { success: true };
  } catch (error: any) {
    console.error("Error al pausar la familia:", error);
    return { error: `Error al pausar: ${error?.message || String(error)}` };
  }
}

export async function restoreFamily() {
  const user = await checkParentSession();
  if (!user || !user.familyId) {
    return { error: "No autorizado" };
  }

  try {
    const familyUsers = await db.select({ id: users.id }).from(users).where(eq(users.familyId, user.familyId));
    const userIds = familyUsers.map(u => u.id);

    await db.transaction(async (tx) => {
      if (userIds.length > 0) {
        await tx.update(users).set({ deletedAt: null }).where(inArray(users.id, userIds));
      }
      await tx.update(families).set({ deletedAt: null }).where(eq(families.id, user.familyId));
    });
    
    return { success: true };
  } catch (error) {
    console.error("Error al restaurar la familia:", error);
    return { error: "Error al restaurar la cuenta familiar" };
  }
}

export async function hardDeleteOwnFamily() {
  const user = await checkParentSession();
  if (!user || !user.familyId) {
    return { error: "No autorizado" };
  }

  try {
    // 1. Obtener IDs de todos los usuarios de la familia para limpiar sus datos
    const familyUsers = await db.select({ id: users.id }).from(users).where(eq(users.familyId, user.familyId));
    const userIds = familyUsers.map(u => u.id);

    await db.transaction(async (tx) => {
      if (userIds.length > 0) {
        // 2. Limpiar datos vinculados a usuarios
        await tx.delete(transactions).where(inArray(transactions.userId, userIds));
        await tx.delete(activeQuests).where(inArray(activeQuests.childId, userIds));
        await tx.delete(rewardClaims).where(inArray(rewardClaims.childId, userIds));
        await tx.delete(suggestions).where(inArray(suggestions.childId, userIds));
        await tx.delete(bodyCheckins).where(inArray(bodyCheckins.childId, userIds));
        await tx.delete(moodCheckins).where(inArray(moodCheckins.childId, userIds));
        await tx.delete(routineCompletions).where(inArray(routineCompletions.childId, userIds));
        await tx.delete(jomoProjects).where(inArray(jomoProjects.childId, userIds));
        await tx.delete(chatSessions).where(inArray(chatSessions.childId, userIds));
      }

      // 3. Limpiar datos vinculados a la familia
      await tx.delete(betaFeedback).where(eq(betaFeedback.familyId, user.familyId));
      await tx.delete(messages).where(eq(messages.familyId, user.familyId));
      await tx.delete(professionalNotes).where(eq(professionalNotes.familyId, user.familyId));
      await tx.delete(routines).where(eq(routines.familyId, user.familyId));
      await tx.delete(rewards).where(eq(rewards.familyId, user.familyId));
      await tx.delete(quests).where(eq(quests.familyId, user.familyId));
      
      // 4. Borrar todos los usuarios de la familia
      await tx.delete(users).where(eq(users.familyId, user.familyId));
      
      // 5. Borrar la familia
      await tx.delete(families).where(eq(families.id, user.familyId));
    });
    
    return { success: true };
  } catch (error) {
    console.error("Error al eliminar permanentemente propia familia:", error);
    return { error: "Error al eliminar permanentemente la cuenta familiar" };
  }
}
