'use server';

import { db } from "@/db";
import { users, routines, routineCompletions, transactions } from "@/db/schema";
import { eq, and, gte, desc } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

interface AuthUser {
  id?: string;
  familyId?: string;
  role?: string;
}

// === PARENT / PROFESSIONAL ACTIONS ===

export async function getRoutines() {
  const session = await getServerSession(authOptions);
  if (!session) return [];

  const role = (session.user as AuthUser).role;
  const familyId = (session.user as AuthUser).familyId;

  if (role !== 'parent' && role !== 'professional') return [];
  if (!familyId) return [];

  const data = await db
    .select()
    .from(routines)
    .where(eq(routines.familyId, familyId))
    .orderBy(desc(routines.createdAt));

  return data;
}

export async function createRoutine(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "No autorizado" };

  const role = (session.user as AuthUser).role;
  if (role !== 'parent' && role !== 'professional') return { error: "No autorizado" };

  const familyId = (session.user as AuthUser).familyId;
  if (!familyId) return { error: "No autorizado" };

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const icon = formData.get('icon') as string || '🌙';
  const steps = formData.get('steps') as string; // JSON string

  if (!title || !steps) return { error: "Título y pasos son obligatorios" };

  try {
    const parsedSteps = JSON.parse(steps);
    const totalTokens = parsedSteps.reduce((acc: number, s: { tokens: number }) => acc + s.tokens, 0);

    await db.insert(routines).values({
      familyId,
      title,
      description,
      icon,
      totalTokens,
      steps,
      createdBy: (session.user as AuthUser).id as string,
    });

    revalidatePath("/admin");
    revalidatePath("/pro");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error al crear rutina:", error);
    return { error: "Error al crear la rutina" };
  }
}

export async function updateRoutine(id: string, formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "No autorizado" };

  const role = (session.user as AuthUser).role;
  if (role !== 'parent' && role !== 'professional') return { error: "No autorizado" };

  const familyId = (session.user as AuthUser).familyId;
  if (!familyId) return { error: "No autorizado" };

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const icon = formData.get('icon') as string || '🌙';
  const steps = formData.get('steps') as string;

  if (!title || !steps) return { error: "Título y pasos son obligatorios" };

  try {
    const parsedSteps = JSON.parse(steps);
    const totalTokens = parsedSteps.reduce((acc: number, s: { tokens: number }) => acc + s.tokens, 0);

    await db.update(routines)
      .set({ title, description, icon, totalTokens, steps })
      .where(and(eq(routines.id, id), eq(routines.familyId, familyId)));

    revalidatePath("/admin");
    revalidatePath("/pro");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error al actualizar rutina:", error);
    return { error: "Error al actualizar la rutina" };
  }
}

export async function deleteRoutine(id: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "No autorizado" };

  const role = (session.user as AuthUser).role;
  if (role !== 'parent' && role !== 'professional') return { error: "No autorizado" };

  const familyId = (session.user as AuthUser).familyId;
  if (!familyId) return { error: "No autorizado" };

  try {
    // Delete completions first, then the routine
    const [routine] = await db.select().from(routines)
      .where(and(eq(routines.id, id), eq(routines.familyId, familyId)))
      .limit(1);

    if (!routine) return { error: "Rutina no encontrada" };

    await db.delete(routineCompletions).where(eq(routineCompletions.routineId, id));
    await db.delete(routines).where(eq(routines.id, id));

    revalidatePath("/admin");
    revalidatePath("/pro");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error al eliminar rutina:", error);
    return { error: "Error al eliminar la rutina" };
  }
}

// === CHILD ACTIONS ===

export async function getAvailableRoutines() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as AuthUser).role !== 'child') return [];

  const familyId = (session.user as AuthUser).familyId;
  if (!familyId) return [];

  const data = await db
    .select()
    .from(routines)
    .where(and(
      eq(routines.familyId, familyId),
      eq(routines.status, 'active')
    ))
    .orderBy(desc(routines.createdAt));

  return data;
}

export async function getTodayRoutineProgress() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as AuthUser).role !== 'child') return [];

  const childId = (session.user as AuthUser).id as string;
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const data = await db
    .select()
    .from(routineCompletions)
    .where(and(
      eq(routineCompletions.childId, childId),
      gte(routineCompletions.createdAt, startOfDay)
    ));

  return data;
}

export async function startRoutine(routineId: string) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as AuthUser).role !== 'child') return { error: "No autorizado" };

  const childId = (session.user as AuthUser).id as string;
  const familyId = (session.user as AuthUser).familyId;
  if (!familyId) return { error: "No autorizado" };

  // Check if already started today
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [existing] = await db
    .select()
    .from(routineCompletions)
    .where(and(
      eq(routineCompletions.childId, childId),
      eq(routineCompletions.routineId, routineId),
      gte(routineCompletions.createdAt, startOfDay)
    ))
    .limit(1);

  if (existing) return { error: "Ya empezaste esta rutina hoy" };

  // Get the routine to know total steps
  const [routine] = await db
    .select()
    .from(routines)
    .where(and(eq(routines.id, routineId), eq(routines.familyId, familyId)))
    .limit(1);

  if (!routine) return { error: "Rutina no encontrada" };

  const parsedSteps = JSON.parse(routine.steps);

  try {
    const [completion] = await db.insert(routineCompletions).values({
      childId,
      routineId,
      stepsCompleted: 0,
      totalSteps: parsedSteps.length,
    }).returning();

    revalidatePath("/");
    return { success: true, completionId: completion.id };
  } catch (error) {
    console.error("Error al iniciar rutina:", error);
    return { error: "Error al iniciar la rutina" };
  }
}

export async function completeRoutineStep(completionId: string) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as AuthUser).role !== 'child') return { error: "No autorizado" };

  const childId = (session.user as AuthUser).id as string;

  // Get the completion
  const [completion] = await db
    .select()
    .from(routineCompletions)
    .where(and(
      eq(routineCompletions.id, completionId),
      eq(routineCompletions.childId, childId)
    ))
    .limit(1);

  if (!completion) return { error: "Progreso no encontrado" };
  if (completion.completed === 1) return { error: "Ya completaste esta rutina" };

  // Get the routine for step tokens
  const [routine] = await db
    .select()
    .from(routines)
    .where(eq(routines.id, completion.routineId))
    .limit(1);

  if (!routine) return { error: "Rutina no encontrada" };

  const parsedSteps = JSON.parse(routine.steps);
  const currentStepIndex = completion.stepsCompleted || 0;
  const currentStep = parsedSteps[currentStepIndex];

  if (!currentStep) return { error: "No hay más pasos" };

  const newStepsCompleted = currentStepIndex + 1;
  const isComplete = newStepsCompleted >= completion.totalSteps;
  const stepTokens = currentStep.tokens || 0;

  try {
    // 1. Update completion progress
    await db.update(routineCompletions)
      .set({
        stepsCompleted: newStepsCompleted,
        completed: isComplete ? 1 : 0,
        completedAt: isComplete ? new Date() : null,
      })
      .where(eq(routineCompletions.id, completionId));

    // 2. Award tokens for this step
    if (stepTokens > 0) {
      const [child] = await db.select().from(users).where(eq(users.id, childId)).limit(1);
      await db.update(users)
        .set({ balance: (child.balance || 0) + stepTokens })
        .where(eq(users.id, childId));

      await db.insert(transactions).values({
        userId: childId,
        amount: stepTokens,
        type: 'bonus',
        description: `🌅 Rutina: ${currentStep.title}`,
      });
    }

    revalidatePath("/");
    return {
      success: true,
      tokensEarned: stepTokens,
      isComplete,
      stepsCompleted: newStepsCompleted,
      totalSteps: completion.totalSteps,
    };
  } catch (error) {
    console.error("Error al completar paso:", error);
    return { error: "Error al completar el paso" };
  }
}

// === HISTORY (for parent/pro) ===

export async function getChildRoutineHistory(childId: string) {
  const session = await getServerSession(authOptions);
  if (!session) return [];

  const role = (session.user as AuthUser).role;
  if (role !== 'parent' && role !== 'professional' && role !== 'super_admin') return [];

  const data = await db
    .select({
      id: routineCompletions.id,
      routineId: routineCompletions.routineId,
      routineTitle: routines.title,
      routineIcon: routines.icon,
      stepsCompleted: routineCompletions.stepsCompleted,
      totalSteps: routineCompletions.totalSteps,
      completed: routineCompletions.completed,
      completedAt: routineCompletions.completedAt,
      createdAt: routineCompletions.createdAt,
    })
    .from(routineCompletions)
    .innerJoin(routines, eq(routineCompletions.routineId, routines.id))
    .where(eq(routineCompletions.childId, childId))
    .orderBy(desc(routineCompletions.createdAt))
    .limit(30);

  return data;
}
