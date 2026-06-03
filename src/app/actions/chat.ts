'use server';

import { db } from "@/db";
import { chatSessions, chatMessages, users } from "@/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getChildChatHistory() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'child') return [];

  const childId = (session.user as any).id;

  const [userSession] = await db.select().from(chatSessions).where(eq(chatSessions.childId, childId)).limit(1);
  if (!userSession) return [];

  const messages = await db.select()
    .from(chatMessages)
    .where(eq(chatMessages.sessionId, userSession.id))
    .orderBy(asc(chatMessages.createdAt));

  return messages.map(m => ({
    id: m.id,
    role: m.role,
    content: m.content,
  }));
}

export async function getFamilyChatSessions() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'parent') return [];

  const familyId = (session.user as any).familyId;

  // Encontrar a los niños de la familia y luego sus sesiones de chat
  const data = await db.select({
    sessionId: chatSessions.id,
    childId: chatSessions.childId,
    childName: users.name,
    childImage: users.image,
    updatedAt: chatSessions.updatedAt,
  })
  .from(chatSessions)
  .innerJoin(users, eq(chatSessions.childId, users.id))
  .where(eq(users.familyId, familyId))
  .orderBy(desc(chatSessions.updatedAt));

  return data;
}

export async function getSessionMessages(sessionId: string) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'parent') return [];

  const messages = await db.select()
    .from(chatMessages)
    .where(eq(chatMessages.sessionId, sessionId))
    .orderBy(asc(chatMessages.createdAt));

  return messages;
}
