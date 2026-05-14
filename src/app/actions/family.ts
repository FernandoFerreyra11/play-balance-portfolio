'use server';

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
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
      familyId: familyId,
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
    .where(eq(users.familyId, familyId));

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
      .where(and(eq(users.id, id), eq(users.familyId, familyId)));
    
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
      .where(and(eq(users.id, id), eq(users.familyId, familyId)));
    
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
    .where(eq(families.id, familyId))
    .limit(1);
  
  return family;
}
