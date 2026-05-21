import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function fixFamilies() {
  const orgId = '45b550a2-5230-48bc-af36-ce9989d4a56f'; // Instituto del Niño
  const proId = 'c4837eff-c1a5-46c9-a5dd-81f0a13a5922'; // Marcelo Polino
  
  await sql`UPDATE families SET organization_id = ${orgId} WHERE professional_id = ${proId}`;
  console.log('Familias de Marcelo Polino movidas a Instituto del Niño');
}

fixFamilies();
