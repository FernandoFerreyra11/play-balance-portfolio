import { neon } from '@neondatabase/serverless';

import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined');
}

const sql = neon(process.env.DATABASE_URL);


async function seed() {
  const name = "Admin Papá";
  const email = "admin@playbalance.com";
  const password = "admin123"; // Cambia esto después
  const role = "parent";

  console.log("Generando hash de contraseña...");
  const hashedPassword = await bcrypt.hash(password, 10);

  console.log("Insertando usuario en la base de datos...");
  try {
    await sql`
      INSERT INTO users (id, name, email, password, role)
      VALUES (gen_random_uuid(), ${name}, ${email}, ${hashedPassword}, ${role})
      ON CONFLICT (email) DO NOTHING
    `;
    console.log("✅ Usuario administrador creado con éxito!");
    console.log("Email:", email);
    console.log("Password:", password);
  } catch (error) {
    console.error("❌ Error al crear el usuario:", error);
  }
}

seed();
