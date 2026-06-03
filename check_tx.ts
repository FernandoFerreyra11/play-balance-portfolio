import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { db } from "./src/db";
import { users, transactions } from "./src/db/schema";
import { eq, inArray, asc } from "drizzle-orm";

async function check() {
  const children = await db.select({ id: users.id, name: users.name, balance: users.balance })
    .from(users)
    .where(inArray(users.name, ['Felipe', 'Helena']));

  for (const child of children) {
    const txs = await db.select()
      .from(transactions)
      .where(eq(transactions.userId, child.id))
      .orderBy(asc(transactions.createdAt));
    
    let calcBalance = 0;
    console.log(`\nTransactions for ${child.name} (Current Balance: ${child.balance}):`);
    const tableData = txs.map(t => {
      calcBalance += t.amount;
      return { amount: t.amount, type: t.type, runningBalance: calcBalance, desc: t.description, date: t.createdAt };
    });
    console.table(tableData);
    console.log(`Calculated Balance for ${child.name} from txs: ${calcBalance}`);
  }
  process.exit(0);
}

check();
