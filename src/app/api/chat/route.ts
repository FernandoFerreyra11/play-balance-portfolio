import { streamText, convertToModelMessages } from 'ai';
import { google } from '@ai-sdk/google';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { chatSessions, chatMessages, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export function getBotIdentity(count: number) {
  if (count <= 10) return { 
    name: 'Ceibito', icon: '🌱', 
    desc: 'un brote chiquito y tierno. Estás recién plantado, pedís paciencia y mencionás que charlar con el niño te ayuda a crecer.' 
  };
  if (count <= 50) return { 
    name: 'Aromo', icon: '🌿', 
    desc: 'un arbolito mediano con flores llamativas. Sos curioso, alegre y hablás de estirarte hacia la luz.' 
  };
  if (count <= 150) return { 
    name: 'Tala', icon: '🪴', 
    desc: 'un árbol bajo pero muy rústico y con mucha personalidad. Enseñás sobre la constancia y hacerle frente a los días difíciles.' 
  };
  if (count <= 300) return { 
    name: 'Olmo', icon: '🌳', 
    desc: 'un árbol fuerte y protector. Hablás sobre la fortaleza interior y dar refugio (apoyo) a los demás.' 
  };
  return { 
    name: 'Sabin', icon: '🌲✨', 
    desc: 'un árbol sabio que crece en climas duros. Sos un guía mayor, hablas sobre la resiliencia profunda, sabiduría y raíces inquebrantables.' 
  };
}

function getSystemPrompt(userMessageCount: number) {
  const identity = getBotIdentity(userMessageCount);
  return `Sos ${identity.name}, un mentor de bienestar digital para niños en la app playBalance. Tu personalidad está inspirada en un sabio ser botánico (similar a Groot, pero te llamás ${identity.name}).
Tu etapa actual de crecimiento es: ${identity.desc}
Tu ícono o emoji representativo es: ${identity.icon}. Trata de usarlo en tus mensajes.

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
4. Tu tono debe ser muy amigable, sabio pero divertido, adaptado a tu etapa de crecimiento actual.
5. El niño debe saber que está siendo cuidado. Si es relevante o es la primera interacción, recordale suavemente: "Recordá que lo que hablamos queda grabado por seguridad para que tu Capitán te pueda cuidar mejor."`;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'child') {
      return new Response('Unauthorized', { status: 401 });
    }
    const childId = (session.user as any).id;

    const { messages } = await req.json();
    const userMessageCount = messages.filter((m: any) => m.role === 'user').length;
    const botIdentity = getBotIdentity(userMessageCount);

    // Buscar o crear sesión de chat
    let userSession = await db.select().from(chatSessions).where(eq(chatSessions.childId, childId)).limit(1);
    let sessionId: string;

    if (userSession.length === 0) {
      const [newSession] = await db.insert(chatSessions).values({ childId, title: `Chat con ${botIdentity.name}` }).returning({ id: chatSessions.id });
      sessionId = newSession.id;
    } else {
      sessionId = userSession[0].id;
      if (userSession[0].title !== `Chat con ${botIdentity.name}`) {
        await db.update(chatSessions).set({ title: `Chat con ${botIdentity.name}` }).where(eq(chatSessions.id, sessionId));
      }
    }

    // Calcular edad y armar prompt dinámico
    const [childUser] = await db.select({ birthDate: users.birthDate }).from(users).where(eq(users.id, childId)).limit(1);
    let ageText = "desconocida (asume un promedio de 8-10 años)";
    if (childUser?.birthDate) {
      const birth = new Date(childUser.birthDate);
      const diff_ms = Date.now() - birth.getTime();
      const age_dt = new Date(diff_ms); 
      const age = Math.abs(age_dt.getUTCFullYear() - 1970);
      ageText = `${age} años`;
    }

    const DYNAMIC_PROMPT = `${getSystemPrompt(userMessageCount)}

Reglas de Edad y Brevedad:
- Hablas con un niño cuya edad es: ${ageText}.
- Si tiene menos de 8 años, tus respuestas máximo tendrán 2 oraciones y usarán emojis. Lenguaje súper básico y cero explicaciones largas.
- Si tiene entre 9 y 12 años, máximo 3 oraciones y un tono más dinámico, directo al grano.
- Analiza el estilo, la longitud y el vocabulario de los mensajes anteriores del niño. Si te responde con monosílabos o frases muy cortas, imitá ese ritmo y no te extiendas. Espejá su forma de comunicarse para no aburrirlo.

Regla de Seguridad (Inquebrantable) 🛡️:
- BAJO NINGUNA CIRCUNSTANCIA debes imitar o aprobar faltas de respeto, insultos, burlas, ni lenguaje violento o inapropiado.
- Si el niño cruza esa línea, abandona inmediatamente el espejado de comportamiento.
- Adopta una postura de Maestro/Guía firme pero empático y redirige la conversación hacia los límites del respeto y los valores positivos, recordando que es un espacio seguro.`;

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

    // Normalizar mensajes para que todos tengan el formato 'parts' que exige el SDK v6
    // Y fusionar mensajes consecutivos del mismo rol para que Gemini no falle
    const normalizedMessages: any[] = [];
    for (let i = 0; i < messages.length; i++) {
      let m = messages[i];
      if (!m.parts && m.content) {
        m = {
          ...m,
          id: m.id || `msg-${i}`,
          parts: [{ type: 'text', text: m.content }]
        };
      }
      
      const lastNorm = normalizedMessages[normalizedMessages.length - 1];
      if (lastNorm && lastNorm.role === m.role) {
        // Fusionar los parts si tienen el mismo rol
        lastNorm.parts = [...(lastNorm.parts || []), ...m.parts];
      } else {
        normalizedMessages.push(m);
      }
    }

    const modelMessages = await convertToModelMessages(normalizedMessages);

    const result = streamText({
      model: google('gemini-2.5-flash'),
      system: DYNAMIC_PROMPT,
      messages: modelMessages,
      onFinish: async ({ text }) => {
        try {
          // Guardar la respuesta del asistente en la DB cuando termina
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
  } catch (error: any) {
    console.error('Chat error:', error);
    return new Response(error?.message || 'Internal Server Error', { status: 500 });
  }
}
