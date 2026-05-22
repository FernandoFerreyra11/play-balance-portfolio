'use server';

import { db } from "@/db";
import { activeQuests, quests, transactions, messages, users } from "@/db/schema";
import { eq, and, desc, asc, gte, inArray } from "drizzle-orm";
import { getProSession } from "./pro";

export async function getFamilyMetrics(familyId: string, childId?: string) {
  const session = await getProSession();
  if (!session) return { error: "No autorizado" };

  try {
    // 1. Get children of the family to filter properly
    const familyChildren = await db.select({ id: users.id, name: users.name })
      .from(users)
      .where(and(eq(users.familyId, familyId), eq(users.role, 'child')));
      
    if (familyChildren.length === 0) {
      return { 
        success: true, 
        metrics: { complianceRate: 0, topRewards: [], weeklyTrend: [], avgResponseTimeHrs: 0 } 
      };
    }

    const childIds = childId && childId !== 'all' 
      ? [childId] 
      : familyChildren.map(c => c.id);

    // 2. Tasa de Cumplimiento (%)
    const assignedQuests = await db.select({ 
        status: activeQuests.status 
      })
      .from(activeQuests)
      .where(inArray(activeQuests.childId, childIds));
      
    const totalQuests = assignedQuests.length;
    const completedQuests = assignedQuests.filter(q => q.status === 'completed').length;
    const complianceRate = totalQuests > 0 ? Math.round((completedQuests / totalQuests) * 100) : 0;

    // 3. Top 3 Premios Reclamados
    const spendTransactions = await db.select({ description: transactions.description })
      .from(transactions)
      .where(and(
        inArray(transactions.userId, childIds),
        eq(transactions.type, 'spend')
      ));
      
    const rewardCounts: Record<string, number> = {};
    spendTransactions.forEach(tx => {
      const desc = tx.description || 'Recompensa';
      rewardCounts[desc] = (rewardCounts[desc] || 0) + 1;
    });
    
    const topRewards = Object.entries(rewardCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    // 4. Tendencia Semanal (Últimos 7 días)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const earnTransactions = await db.select({ 
        amount: transactions.amount, 
        createdAt: transactions.createdAt 
      })
      .from(transactions)
      .where(and(
        inArray(transactions.userId, childIds),
        eq(transactions.type, 'earn'),
        gte(transactions.createdAt, sevenDaysAgo)
      ));

    // Initialize the last 7 days array
    const weeklyTrendMap: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('es-ES', { weekday: 'short' });
      weeklyTrendMap[dateStr] = 0;
    }

    earnTransactions.forEach(tx => {
      if (!tx.createdAt) return;
      const dateStr = new Date(tx.createdAt).toLocaleDateString('es-ES', { weekday: 'short' });
      if (weeklyTrendMap[dateStr] !== undefined) {
        weeklyTrendMap[dateStr] += tx.amount;
      }
    });

    const weeklyTrend = Object.entries(weeklyTrendMap).map(([day, tokens]) => ({ day, tokens }));

    // 5. Tiempo de Respuesta (Receptividad)
    const familyMsgs = await db.select()
      .from(messages)
      .where(eq(messages.familyId, familyId))
      .orderBy(asc(messages.createdAt));

    let responseTimes: number[] = [];
    for (let i = 0; i < familyMsgs.length; i++) {
      const msg = familyMsgs[i];
      // Si es un mensaje de la familia (o admin pro) hacia los niños
      const isToChild = msg.receiverType === 'children';
      if (isToChild) {
        // Buscar el siguiente mensaje del niño hacia los padres/pro
        const nextReply = familyMsgs.slice(i + 1).find(m => 
          (m.receiverType === 'professional' || m.receiverType === 'parents') && 
          childIds.includes(m.senderId)
        );
        if (nextReply && msg.createdAt && nextReply.createdAt) {
          const diffMs = nextReply.createdAt.getTime() - msg.createdAt.getTime();
          const diffHrs = diffMs / (1000 * 60 * 60);
          responseTimes.push(diffHrs);
        }
      }
    }
    
    let avgResponseTimeHrs = 0;
    if (responseTimes.length > 0) {
      avgResponseTimeHrs = Math.round((responseTimes.reduce((a,b) => a+b, 0) / responseTimes.length) * 10) / 10;
    }

    return {
      success: true,
      metrics: {
        complianceRate,
        topRewards,
        weeklyTrend,
        avgResponseTimeHrs
      }
    };
  } catch (error) {
    console.error(error);
    return { error: "Error al cargar métricas" };
  }
}
