import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function listUsers() {
  const result = await sql`SELECT u.id, u.name, u.email, u.role, o.name as org_name FROM users u LEFT JOIN organizations o ON u.organization_id = o.id`;
  console.log(JSON.stringify(result, null, 2));
}

listUsers();
