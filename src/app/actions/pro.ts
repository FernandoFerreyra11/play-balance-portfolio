'use server';

import { db } from "@/db";
import { users, families, organizations, activeQuests } from "@/db/schema";
import { eq, and, sql, count, inArray } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getProSession() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'professional') {
    return null;
  }
  
  const [dbUser] = await db.select({ organizationId: users.organizationId }).from(users).where(eq(users.id, (session.user as any).id));
  if (dbUser) {
    (session.user as any).organizationId = dbUser.organizationId;
  }
  
  return session;
}

export async function getProfessionalStats() {
  const session = await getProSession();
  if (!session) return { error: "No autorizado" };

  const proId = (session.user as any).id;

  try {
    const familiesCount = await db
      .select({ value: count() })
      .from(families)
      .where(eq(families.professionalId, proId));

    // Get all families managed by the professional
    const managedFamilies = await db.select({ id: families.id }).from(families).where(eq(families.professionalId, proId));
    
    let globalComplianceRate = 0;
    let activeMissions = 0;

    if (managedFamilies.length > 0) {
      const familyIds = managedFamilies.map(f => f.id);
      
      // Get all children for these families
      const children = await db.select({ id: users.id })
        .from(users)
        .where(and(inArray(users.familyId, familyIds), eq(users.role, 'child')));
        
      if (children.length > 0) {
        const childIds = children.map(c => c.id);
        
        // Get all active quests for these children
        const quests = await db.select({ status: activeQuests.status })
          .from(activeQuests)
          .where(inArray(activeQuests.childId, childIds));
          
        const totalAssigned = quests.length;
        const completed = quests.filter(q => q.status === 'completed').length;
        
        globalComplianceRate = totalAssigned > 0 ? Math.round((completed / totalAssigned) * 100) : 0;
        activeMissions = quests.filter(q => q.status === 'in_progress').length;
      }
    }

    return {
      familiesCount: familiesCount[0].value,
      activePatients: familiesCount[0].value,
      globalComplianceRate,
      activeMissions
    };
  } catch (error) {
    return { error: "Error al cargar estadísticas" };
  }
}

export async function getManagedFamilies() {
  const session = await getProSession();
  if (!session) return [];

  const proId = (session.user as any).id;

  try {
    return await db
      .select()
      .from(families)
      .where(eq(families.professionalId, proId))
      .orderBy(families.createdAt);
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function createOrganization(name: string, slug: string) {
  const session = await getProSession();
  if (!session) return { error: "No autorizado" };

  const proId = (session.user as any).id;

  try {
    const insertedOrgs = await db.insert(organizations).values({
      name,
      slug: slug.toLowerCase().replace(/\s+/g, '-'),
    }).returning();

    const newOrg = (insertedOrgs as any)[0];

    // Vincular al profesional con su organización
    await db.update(users)
      .set({ organizationId: newOrg.id })
      .where(eq(users.id, proId));

    revalidatePath("/pro");
    return { success: true, organization: newOrg };
  } catch (error) {
    return { error: "Error al crear la organización. El slug podría estar duplicado." };
  }
}

export async function createPatientFamily(familyName: string) {
  const session = await getProSession();
  if (!session) return { error: "No autorizado" };

  const proId = (session.user as any).id;
  const orgId = (session.user as any).organizationId;

  // Verificar límites del plan
  const [dbUser] = await db.select({ subscriptionPlan: users.subscriptionPlan }).from(users).where(eq(users.id, proId));
  const plan = dbUser?.subscriptionPlan || 'free';
  
  if (plan === 'free') {
    const familiesCount = await db
      .select({ value: count() })
      .from(families)
      .where(eq(families.professionalId, proId));
      
    if (familiesCount[0].value >= 2) {
      return { error: "UPGRADE_REQUIRED" };
    }
  }

  // Generar un código único
  const familyCode = `PRO-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  try {
    const insertedFamilies = await db.insert(families).values({
      name: familyName,
      code: familyCode,
      professionalId: proId,
      organizationId: orgId || null,
    }).returning();

    const newFamily = (insertedFamilies as any)[0];

    revalidatePath("/pro");
    return { success: true, family: newFamily };
  } catch (error) {
    return { error: "Error al crear la familia del paciente" };
  }
}

export async function linkExistingFamily(familyCode: string) {
  const session = await getProSession();
  if (!session) return { error: "No autorizado" };

  const proId = (session.user as any).id;
  const orgId = (session.user as any).organizationId;

  // Verificar límites del plan
  const [dbUser] = await db.select({ subscriptionPlan: users.subscriptionPlan }).from(users).where(eq(users.id, proId));
  const plan = dbUser?.subscriptionPlan || 'free';
  
  if (plan === 'free') {
    const familiesCount = await db
      .select({ value: count() })
      .from(families)
      .where(eq(families.professionalId, proId));
      
    if (familiesCount[0].value >= 2) {
      return { error: "UPGRADE_REQUIRED" };
    }
  }

  try {
    const existingFamily = await db.select().from(families).where(eq(families.code, familyCode));
    
    if (existingFamily.length === 0) {
      return { error: "Código de familia no encontrado" };
    }

    if (existingFamily[0].professionalId) {
      if (existingFamily[0].professionalId !== proId) {
        return { error: "Esta familia ya está vinculada a otro profesional" };
      }
      return { error: "Ya estabas vinculado a esta familia" };
    }

    await db.update(families)
      .set({ 
        professionalId: proId,
        organizationId: orgId || existingFamily[0].organizationId 
      })
      .where(eq(families.id, existingFamily[0].id));

    revalidatePath("/pro");
    return { success: true };
  } catch (error) {
    return { error: "Error al vincular familia" };
  }
}

export async function upgradeProPlan(plan: 'growth' | 'unlimited') {
  const session = await getProSession();
  if (!session) return { error: "No autorizado" };

  const proId = (session.user as any).id;

  try {
    await db.update(users).set({ subscriptionPlan: plan }).where(eq(users.id, proId));
    revalidatePath("/pro");
    return { success: true };
  } catch (error) {
    return { error: "Error al actualizar el plan" };
  }
}
