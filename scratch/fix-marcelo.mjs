import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function fixMarcelo() {
  const orgId = '45b550a2-5230-48bc-af36-ce9989d4a56f'; // Instituto del Niño
  const userId = 'c4837eff-c1a5-46c9-a5dd-81f0a13a5922'; // Marcelo Polino
  
  await sql`UPDATE users SET organization_id = ${orgId} WHERE id = ${userId}`;
  console.log('Marcelo Polino movido a Instituto del Niño');
}

fixMarcelo();
