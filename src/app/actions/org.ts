'use server';

import { db } from "@/db";
import { users, families, organizations } from "@/db/schema";
import { eq, and, count } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

async function getOrgSession() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'org_admin') {
    return null;
  }
  return session;
}

export async function getOrgStats() {
  const session = await getOrgSession();
  if (!session) return { error: "No autorizado" };

  const orgId = (session.user as any).organizationId;
  if (!orgId) return { error: "Sin organización" };

  try {
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    const [prosCount] = await db
      .select({ value: count() })
      .from(users)
      .where(and(eq(users.organizationId, orgId), eq(users.role, 'professional')));

    const [familiesCount] = await db
      .select({ value: count() })
      .from(families)
      .where(eq(families.organizationId, orgId));

    return {
      orgName: org?.name || "Institución",
      professionalsCount: prosCount.value,
      totalPatients: familiesCount.value,
    };
  } catch (_error) {
    return { error: "Error al cargar estadísticas" };
  }
}

export async function getOrgProfessionals() {
  const session = await getOrgSession();
  if (!session) return [];

  const orgId = (session.user as any).organizationId;
  if (!orgId) return [];

  try {
    return await db
      .select()
      .from(users)
      .where(and(eq(users.organizationId, orgId), eq(users.role, 'professional')))
      .orderBy(users.createdAt);
  } catch (_error) {
    console.error(error);
    return [];
  }
}

export async function createProfessional(formData: FormData) {
  const session = await getOrgSession();
  if (!session) return { error: "No autorizado" };

  const orgId = (session.user as any).organizationId;
  const name = formData.get("name") as string;
  const email = (formData.get("email") as string).toLowerCase().trim();
  const password = formData.get("password") as string;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await db.insert(users).values({
      name,
      email,
      password: hashedPassword,
      role: 'professional',
      organizationId: orgId,
    });

    revalidatePath("/institucion");
    return { success: true };
  } catch (_error) {
    return { error: "Error al crear profesional. ¿El email ya existe?" };
  }
}
