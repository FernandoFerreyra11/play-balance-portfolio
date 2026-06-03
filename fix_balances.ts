import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { db } from "./src/db";
import { users, transactions } from "./src/db/schema";
import { eq } from "drizzle-orm";

async function fixBalances() {
  console.log("Iniciando recalculo de balances para todos los aventureros...");
  
  // Obtener todos los niños
  const children = await db.select({ id: users.id, name: users.name, balance: users.balance })
    .from(users)
    .where(eq(users.role, 'child'));

  let fixedCount = 0;

  for (const child of children) {
    const txs = await db.select({ amount: transactions.amount })
      .from(transactions)
      .where(eq(transactions.userId, child.id));
    
    // Sumar todas las transacciones reales
    const realBalance = txs.reduce((acc, t) => acc + t.amount, 0);

    if (child.balance !== realBalance) {
      console.log(`Corrigiendo a ${child.name}: Balance DB = ${child.balance} | Balance Real (Transacciones) = ${realBalance}`);
      
      // Actualizar el balance
      await db.update(users)
        .set({ balance: realBalance })
        .where(eq(users.id, child.id));
        
      fixedCount++;
    } else {
      console.log(`OK - ${child.name}: Balance DB = ${child.balance}`);
    }
  }

  console.log(`\n¡Proceso completado! Se corrigieron los balances de ${fixedCount} aventureros.`);
  process.exit(0);
}

fixBalances();
