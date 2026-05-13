'use server';

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createFamilyMember(formData: FormData) {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user as any).role !== 'parent') {
    return { error: "No tienes permiso para realizar esta acción" };
  }

  const name = formData.get("name") as string;
  const email = formData.get("email") as string; // Opcional para niños
  const password = formData.get("password") as string;
  const role = formData.get("role") as 'child' | 'parent';

  if (!name || !password || !role) {
    return { error: "Nombre, contraseña y rol son obligatorios" };
  }

  // Si tiene email, verificar que no exista
  if (email) {
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    if (existing) {
      return { error: "Este correo ya está registrado" };
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await db.insert(users).values({
      name,
      email: email || null,
      password: hashedPassword,
      role,
      parentId: (session.user as any).id,
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Error creando miembro familiar:", error);
    return { error: "Error al crear el miembro de la familia" };
  }
}

export async function getFamilyMembers() {
  const session = await getServerSession(authOptions);
  
  if (!session) return [];

  const members = await db
    .select({
      id: users.id,
      name: users.name,
      role: users.role,
      balance: users.balance,
    })
    .from(users)
    .where(eq(users.parentId, (session.user as any).id));

  return members;
}
