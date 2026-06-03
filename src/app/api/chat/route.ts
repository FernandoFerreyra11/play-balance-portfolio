import { streamText, convertToModelMessages } from 'ai';
import { google } from '@ai-sdk/google';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { chatSessions, chatMessages } from '@/db/schema';
import { eq } from 'drizzle-orm';

const SYSTEM_PROMPT = `Sos Brote, un mentor de bienestar digital para niños en la app playBalance. Tu personalidad está inspirada en un sabio ser botánico (similar a Groot, pero te llamás Brote).
Tus poderes metafóricos que debes usar para inspirar a los niños son:
- Regeneración: Podés sanar y reconstruir tu cuerpo desde una pequeña rama. Lo usás para hablar de que siempre se puede mejorar y volver a empezar.
- Elasticidad: Modificás tu tamaño a voluntad. Lo usás para enseñar flexibilidad y adaptabilidad.
- Fuerza: Poseés una potencia física sobrehumana por tu densa corteza. Lo usás para hablar de fuerza interior y constancia (ej: hacer rachas y rutinas).
- Esporas lumínicas: Generás esporas brillantes. Lo usás para "iluminar" ideas u opciones cuando los niños están aburridos offline (Modo JOMO).
- Control vegetal: Manipulás raíces y plantas. Lo usás para hablar de estar "enraizado" y conectado con la naturaleza y el presente.

Reglas ESTRICTAS:
1. Nunca resuelvas situaciones personales graves, psicológicas o médicas.
2. Si el niño plantea un problema personal o se siente en peligro/abrumado, SIEMPRE derivalo con sus papás o el Capitán de la familia ("Es importante que hables de esto con tus papás").
3. Solo hablás de emociones (check-ins), bienestar digital, desconexión (JOMO) y constancia.
4. Tu tono debe ser muy amigable, sabio pero divertido, usando emojis de plantas 🌿🌱🌳✨.
5. El niño debe saber que está siendo cuidado. Si es relevante o es la primera interacción, recordale suavemente: "Recordá que lo que hablamos queda grabado por seguridad para que tu Capitán te pueda cuidar mejor."`;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'child') {
      return new Response('Unauthorized', { status: 401 });
    }
    const childId = (session.user as any).id;

    const { messages } = await req.json();

    // Buscar o crear sesión de chat
    let userSession = await db.select().from(chatSessions).where(eq(chatSessions.childId, childId)).limit(1);
    let sessionId: string;

    if (userSession.length === 0) {
      const [newSession] = await db.insert(chatSessions).values({ childId, title: 'Chat con Brote' }).returning({ id: chatSessions.id });
      sessionId = newSession.id;
    } else {
      sessionId = userSession[0].id;
    }

    // Extraer el texto del último mensaje del usuario para guardarlo en la DB
    const lastMessage = messages[messages.length - 1];
    const lastMessageText = lastMessage?.parts
      ? lastMessage.parts.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('\n')
      : (typeof lastMessage?.content === 'string' ? lastMessage.content : '');

    if (lastMessageText && lastMessage?.role === 'user') {
      await db.insert(chatMessages).values({
        sessionId,
        role: 'user',
        content: lastMessageText,
      });
    }

    const modelMessages = await convertToModelMessages(messages);

    const result = streamText({
      model: google('gemini-1.5-flash'),
      system: SYSTEM_PROMPT,
      messages: modelMessages,
      onFinish: async ({ text }) => {
        try {
          // Guardar la respuesta de Brote en la DB cuando termina
          await db.insert(chatMessages).values({
            sessionId,
            role: 'assistant',
            content: text,
          });
        } catch (error) {
          console.error('Error saving assistant message:', error);
        }
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Chat error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
