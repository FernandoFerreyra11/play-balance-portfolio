'use server';

import { db } from "@/db";
import { users, families } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { hardDeleteFamilyById } from "./family";

import { organizations } from "@/db/schema";

export async function registerUser(formData: FormData) {
  const name = formData.get("name") as string;
  const emailRaw = formData.get("email") as string;
  const email = emailRaw.toLowerCase().trim();
  const password = formData.get("password") as string;
  const role = (formData.get("role") as string) || "parent";
  const orgName = formData.get("organizationName") as string;

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
    if (existingUser.deletedAt && existingUser.familyId) {
      // Borrado silencioso de la familia antigua pausada
      await hardDeleteFamilyById(existingUser.familyId);
      // Continuar con el flujo normal para crear una cuenta nueva...
    } else {
      return { error: "El correo electrónico ya está registrado" };
    }
  }

  // Encriptar contraseña
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    if (role === "org_admin") {
      if (!orgName) return { error: "El nombre de la institución es obligatorio" };
      
      const slug = orgName.toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') + '-' + Math.random().toString(36).substring(2, 7);

      // 1. Crear Organización
      const insertedOrgs = await db.insert(organizations).values({
        name: orgName,
        slug: slug,
      }).returning();
      
      const newOrg = insertedOrgs[0];

      // 2. Crear Usuario
      await db.insert(users).values({
        name,
        email,
        password: hashedPassword,
        role: "org_admin",
        organizationId: newOrg.id,
      });

      return { success: true };
    } 
    
    if (role === "professional") {
      // Crear Profesional independiente
      await db.insert(users).values({
        name,
        email,
        password: hashedPassword,
        role: "professional",
      });
      return { success: true };
    }

    // Default: Familia (Parent)
    const proCode = formData.get("familyCode") as string;
    
    if (proCode && proCode.trim() !== '') {
      const [existingFamily] = await db.select().from(families).where(eq(families.code, proCode.trim()));
      
      if (!existingFamily) {
        return { error: "El código de profesional/familia no es válido" };
      }
      
      await db.insert(users).values({
        name,
        email,
        password: hashedPassword,
        role: "parent",
        familyId: existingFamily.id,
      });

      return { success: true, familyCode: existingFamily.code };
    }

    // Si no hay código, creamos una nueva familia
    const familyCode = `${name.split(' ')[0].toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const insertedFamilies = await db.insert(families).values({
      name: `Equipo de ${name}`,
      code: familyCode,
    }).returning();
    
    const newFamily = insertedFamilies[0];

    await db.insert(users).values({
      name,
      email,
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
