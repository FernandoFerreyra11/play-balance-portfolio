'use server';

import { db } from "@/db";
import { users, families } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function registerUser(formData: FormData) {
  const name = formData.get("name") as string;
  const emailRaw = formData.get("email") as string;
  const email = emailRaw.toLowerCase().trim();
  const password = formData.get("password") as string;

  if (!name || !email || !password) {
    return { error: "Todos los campos son obligatorios" };
  }

  // Verificar si el usuario ya existe
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser) {
    return { error: "El correo electrónico ya está registrado" };
  }

  // Encriptar contraseña
  const hashedPassword = await bcrypt.hash(password, 10);

  // Generar un código de familia único y amigable
  const familyCode = `${name.split(' ')[0].toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

  // Crear usuario y familia en una transacción (o secuencia)
  try {
    const insertedFamilies = await db.insert(families).values({
      name: `Familia ${name}`,
      code: familyCode,
    }).returning();

    const newFamily = (insertedFamilies as any)[0];

    await db.insert(users).values({
      name,
      email: email,
      password: hashedPassword,
      role: "parent",
      familyId: newFamily.id,
    });

    return { success: true, familyCode };
  } catch (error) {
    console.error("Error en registro:", error);
    return { error: "Error al crear la cuenta. Inténtalo de nuevo." };
  }
}
