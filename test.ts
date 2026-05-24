import { config } from 'dotenv';
config({ path: '.env.local' });
import { db } from './src/db';
import { families, users } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function run() {
  const allFamilies = await db.select().from(families);
  console.log('FAMILIES', allFamilies);
  const allPros = await db.select().from(users).where(eq(users.role, 'professional'));
  console.log('PROS', allPros);
  process.exit(0);
}
run();
