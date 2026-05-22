'use server';

import { db } from "@/db";
import { users, families, messages } from "@/db/schema";
import { eq, and, desc, or } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getSession() {
  const session = await getServerSession(authOptions);
  return session;
}

// Para el Profesional: Obtener los mensajes de una familia
export async function getMessagesForPro(familyId: string) {
  const session = await getSession();
  if (!session || (session.user as any).role !== 'professional') return { error: 'No autorizado', data: [] };
  
  const proId = (session.user as any).id;

  try {
    const familyMsgs = await db
      .select({
        id: messages.id,
        content: messages.content,
        receiverType: messages.receiverType,
        createdAt: messages.createdAt,
        senderId: messages.senderId,
        senderName: users.name,
        senderRole: users.role,
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.familyId, familyId))
      .orderBy(desc(messages.createdAt));

    return { success: true, data: familyMsgs, proId };
  } catch (error) {
    return { error: 'Error al obtener mensajes', data: [] };
  }
}

// Para la Familia: Obtener mensajes
export async function getMessagesForFamily(receiverTypeFilter: 'parents' | 'children') {
  const session = await getSession();
  if (!session) return { error: 'No autorizado', data: [] };
  
  const user = session.user as any;
  if (!user.familyId) return { error: 'No perteneces a una familia', data: [] };

  try {
    // Si es padre (admin), puede ver los mensajes dirigidos a padres Y a niños.
    // Si es niño (player), solo puede ver los mensajes dirigidos a niños.
    // Pero la función permite filtrar por receiverType explícito.
    
    let condition;
    if (user.role === 'parent' || user.role === 'org_admin') {
      condition = eq(messages.receiverType, receiverTypeFilter);
    } else {
      // Un niño solo puede ver mensajes para niños
      if (receiverTypeFilter === 'parents') return { error: 'No autorizado', data: [] };
      condition = eq(messages.receiverType, 'children');
    }

    const familyMsgs = await db
      .select({
        id: messages.id,
        content: messages.content,
        receiverType: messages.receiverType,
        createdAt: messages.createdAt,
        senderId: messages.senderId,
        senderName: users.name,
        senderRole: users.role,
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(
        and(
          eq(messages.familyId, user.familyId),
          condition
        )
      )
      .orderBy(desc(messages.createdAt));

    return { success: true, data: familyMsgs, currentUserId: user.id };
  } catch (error) {
    return { error: 'Error al obtener mensajes', data: [] };
  }
}

// Enviar un mensaje (sirve para Pro, Parent, Child)
export async function sendMessage(familyId: string, content: string, receiverType: 'parents' | 'children' | 'professional') {
  const session = await getSession();
  if (!session) return { error: 'No autorizado' };
  
  const user = session.user as any;
  const senderId = user.id;

  try {
    await db.insert(messages).values({
      familyId,
      senderId,
      receiverType,
      content,
    });
    
    // Revalidar las rutas relevantes
    if (user.role === 'professional') {
      revalidatePath(`/pro/family/${familyId}`);
    } else {
      revalidatePath('/admin');
      revalidatePath('/');
    }
    
    return { success: true };
  } catch (error) {
    return { error: 'Error al enviar el mensaje' };
  }
}
