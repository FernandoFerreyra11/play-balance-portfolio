'use server';

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function registerUser(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
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

  // Crear usuario
  try {
    await db.insert(users).values({
      name,
      email,
      password: hashedPassword,
      role: "parent", // El registro directo es siempre para padres
    });

    return { success: true };
  } catch (error) {
    console.error("Error en registro:", error);
    return { error: "Error al crear la cuenta. Inténtalo de nuevo." };
  }
}
