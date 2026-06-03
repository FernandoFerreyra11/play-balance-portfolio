'use server';

import { db } from "@/db";
import { users, jomoProjects, transactions } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
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

async function checkChildSession() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as AuthUser).role !== 'child') {
    return null;
  }
  return session.user as { id: string; familyId: string; role: string };
}

export async function submitJomoProject(formData: FormData) {
  const user = await checkChildSession();
  if (!user) return { error: "No autorizado" };

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const minutesSpent = parseInt(formData.get('minutesSpent') as string) || 0;
  const suggestedTokens = parseInt(formData.get('suggestedTokens') as string) || 0;

  if (!title || !description) {
    return { error: "Título y descripción son requeridos" };
  }

  try {
    await db.insert(jomoProjects).values({
      childId: user.id,
      title,
      description,
      minutesSpent,
      suggestedTokens,
      status: 'pending',
    });
    
    revalidatePath("/");
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "Error al enviar el proyecto JOMO" };
  }
}

export async function getChildJomoProjects() {
  const user = await checkChildSession();
  if (!user) return [];

  const data = await db
    .select()
    .from(jomoProjects)
    .where(eq(jomoProjects.childId, user.id))
    .orderBy(desc(jomoProjects.createdAt));

  return data;
}

export async function getFamilyJomoProjects() {
  const user = await checkParentSession();
  if (!user || !user.familyId) return [];

  const data = await db
    .select({
      id: jomoProjects.id,
      childId: jomoProjects.childId,
      title: jomoProjects.title,
      description: jomoProjects.description,
      minutesSpent: jomoProjects.minutesSpent,
      suggestedTokens: jomoProjects.suggestedTokens,
      grantedTokens: jomoProjects.grantedTokens,
      status: jomoProjects.status,
      parentFeedback: jomoProjects.parentFeedback,
      createdAt: jomoProjects.createdAt,
      childName: users.name,
      childImage: users.image,
    })
    .from(jomoProjects)
    .innerJoin(users, eq(jomoProjects.childId, users.id))
    .where(eq(users.familyId, user.familyId))
    .orderBy(desc(jomoProjects.createdAt));

  return data;
}

export async function reviewJomoProject(
  projectId: string, 
  status: 'approved' | 'rejected', 
  grantedTokens: number, 
  feedback: string
) {
  const user = await checkParentSession();
  if (!user || !user.familyId) return { error: "No autorizado" };

  try {
    // Check if project belongs to family
    const [project] = await db
      .select({ id: jomoProjects.id, childId: jomoProjects.childId, status: jomoProjects.status })
      .from(jomoProjects)
      .innerJoin(users, eq(jomoProjects.childId, users.id))
      .where(and(
        eq(jomoProjects.id, projectId),
        eq(users.familyId, user.familyId)
      ))
      .limit(1);

    if (!project) return { error: "Proyecto no encontrado" };
    if (project.status === 'approved') return { error: "El proyecto ya fue aprobado" };

    // Update project
    await db.update(jomoProjects)
      .set({
        status,
        grantedTokens: status === 'approved' ? grantedTokens : null,
        parentFeedback: feedback,
        reviewedBy: user.id,
        reviewedAt: new Date(),
      })
      .where(eq(jomoProjects.id, projectId));

    // If approved, give tokens to child
    if (status === 'approved' && grantedTokens > 0) {
      await db.insert(transactions).values({
        userId: project.childId,
        amount: grantedTokens,
        type: 'earn',
        description: `Proyecto JOMO: Recompensa aprobada`,
      });
      
      const [child] = await db.select({ balance: users.balance }).from(users).where(eq(users.id, project.childId)).limit(1);
      await db.update(users)
        .set({ balance: (child.balance || 0) + grantedTokens })
        .where(eq(users.id, project.childId));
    }

    revalidatePath("/admin");
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "Error al evaluar el proyecto" };
  }
}

export async function resubmitJomoProject(projectId: string, additionalDetails: string) {
  const user = await checkChildSession();
  if (!user) return { error: "No autorizado" };

  if (!additionalDetails) {
    return { error: "Debes escribir qué mejoras le hiciste al proyecto" };
  }

  try {
    const [project] = await db
      .select({ id: jomoProjects.id, childId: jomoProjects.childId, description: jomoProjects.description, status: jomoProjects.status })
      .from(jomoProjects)
      .where(and(
        eq(jomoProjects.id, projectId),
        eq(jomoProjects.childId, user.id)
      ))
      .limit(1);

    if (!project) return { error: "Proyecto no encontrado" };
    if (project.status !== 'rejected') return { error: "Solo puedes re-enviar proyectos que necesitan mejoras" };

    const updatedDescription = `${project.description}\n\n--- MEJORAS AÑADIDAS ---\n${additionalDetails}`;

    await db.update(jomoProjects)
      .set({
        status: 'pending',
        description: updatedDescription,
        parentFeedback: null, // Clear feedback so parent can review anew
      })
      .where(eq(jomoProjects.id, projectId));

    revalidatePath("/");
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "Error al re-enviar el proyecto" };
  }
}
