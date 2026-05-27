import { db } from './src/db';
import { users, transactions } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function test() {
  const allUsers = await db.select().from(users);
  const juan = allUsers.find(u => u.name.includes('Juan Ramón') || u.name.includes('Juan Ramon'));
  if (!juan) {
    console.log("No Juan found. All users:", allUsers.map(u => ({ id: u.id, name: u.name, balance: u.balance })));
    process.exit(1);
  }

  console.log(`Found ${juan.name} (ID: ${juan.id}) with balance: ${juan.balance}`);

  const txs = await db.select().from(transactions).where(eq(transactions.userId, juan.id));
  console.log("Transactions:");
  for (const t of txs) {
    console.log(` - ${t.type}: ${t.amount} (${t.createdAt})`);
  }
  process.exit(0);
}

test();
