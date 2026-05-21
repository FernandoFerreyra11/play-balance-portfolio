import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function listOrgs() {
  const result = await sql`SELECT * FROM organizations`;
  console.log(JSON.stringify(result, null, 2));
}

listOrgs();
