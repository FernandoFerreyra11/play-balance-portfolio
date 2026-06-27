/**
 * seed-test-data.ts
 * 
 * Script para preparar la base de datos de testing con datos controlados.
 * Se ejecuta antes de los tests E2E en CI/CD.
 * 
 * Uso:
 *   npx tsx scripts/seed-test-data.ts
 * 
 * ⚠️ ESTE SCRIPT BORRA TODOS LOS DATOS de la DB configurada en DATABASE_URL.
 *    Asegurate de que apunte a la DB de testing, NUNCA a producción.
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined');
}

const sql = neon(process.env.DATABASE_URL);

// ============================================================
// Datos de test controlados
// ============================================================

const TEST_PASSWORD = 'Segura123!';

const TEST_USERS = {
  // Usuario que ya "existe" — necesario para TEST-04 (registro con email duplicado)
  existingUser: {
    name: 'Usuario Existente',
    email: 'existe@test.com',
    role: 'parent' as const,
  },
  // Padre de familia para smoke tests generales
  parentUser: {
    name: 'Padre Test',
    email: 'padre@test.com',
    role: 'parent' as const,
  },
  // Hijo para tests que necesiten un child
  childUser: {
    name: 'Hijo Test',
    email: 'hijo@test.com',
    role: 'child' as const,
  },
  // Profesional para tests del flujo profesional
  proUser: {
    name: 'Dr. Test',
    email: 'profesional@test.com',
    role: 'professional' as const,
  },
};

const TEST_FAMILY = {
  name: 'Familia Test',
  code: 'TEST-001',
  plan: 'free',
};

// ============================================================
// Paso 1: Limpiar todas las tablas
// ============================================================

async function cleanDatabase() {
  console.log('💣 Limpiando base de datos de testing...\n');

  // Usar TRUNCATE CASCADE para manejar dependencias circulares
  // (users.family_id → families, families.professional_id → users)
  const tables = [
    'chat_messages', 'chat_sessions', 'beta_feedback', 'jomo_projects',
    'routine_completions', 'routines', 'mood_checkins', 'body_checkins',
    'messages', 'professional_notes', 'transactions', 'reward_claims',
    'active_quests', 'suggestions', 'rewards', 'quests',
    'sessions', 'accounts', 'verification_tokens',
    'families', 'users', 'organizations',
  ];

  const tableList = tables.map(t => `"${t}"`).join(', ');
  await sql.query(`TRUNCATE TABLE ${tableList} CASCADE`);

  for (const table of tables) {
    console.log(`  ✓ ${table}`);
  }

  console.log('\n✅ Base de datos limpia.\n');
}

// ============================================================
// Paso 2: Insertar datos de test
// ============================================================

async function seedTestData() {
  console.log('🌱 Insertando datos de testing...\n');

  // --- Crear familia ---
  const familyResult = await sql`
    INSERT INTO families (id, name, code, plan)
    VALUES (gen_random_uuid(), ${TEST_FAMILY.name}, ${TEST_FAMILY.code}, ${TEST_FAMILY.plan})
    RETURNING id
  `;
  const familyId = familyResult[0].id;
  console.log(`  ✓ Familia: "${TEST_FAMILY.name}" (code: ${TEST_FAMILY.code})`);

  // --- Hash de la contraseña de test (se reutiliza para todos) ---
  const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);

  // --- Crear usuarios ---
  for (const [key, user] of Object.entries(TEST_USERS)) {
    const assignFamilyId = key !== 'proUser' ? familyId : null;

    await sql`
      INSERT INTO users (id, name, email, password, role, family_id, balance)
      VALUES (
        gen_random_uuid(),
        ${user.name},
        ${user.email},
        ${hashedPassword},
        ${user.role},
        ${assignFamilyId},
        ${key === 'childUser' ? 100 : 0}
      )
      ON CONFLICT (email) DO NOTHING
    `;
    console.log(`  ✓ Usuario: ${user.name} (${user.email}) [${user.role}]`);
  }

  // --- Crear una misión de ejemplo para smoke tests ---
  await sql`
    INSERT INTO quests (id, title, description, reward, category, family_id)
    VALUES (
      gen_random_uuid(),
      'Misión de prueba',
      'Una misión creada automáticamente para testing',
      10,
      'general',
      ${familyId}
    )
  `;
  console.log('  ✓ Misión: "Misión de prueba" (10 tokens)');

  // --- Crear un premio de ejemplo ---
  await sql`
    INSERT INTO rewards (id, title, cost, minutes, icon, family_id)
    VALUES (
      gen_random_uuid(),
      'Premio de prueba',
      50,
      30,
      '🎮',
      ${familyId}
    )
  `;
  console.log('  ✓ Premio: "Premio de prueba" (50 tokens, 30 min)');

  console.log('\n✅ Datos de testing insertados.\n');
}

// ============================================================
// Paso 3: Resumen
// ============================================================

async function printSummary() {
  console.log('═══════════════════════════════════════════');
  console.log('📋 RESUMEN DE DATOS DE TESTING');
  console.log('═══════════════════════════════════════════');
  console.log('');
  console.log('Credenciales de test (todas usan la misma contraseña):');
  console.log(`  Contraseña: ${TEST_PASSWORD}`);
  console.log('');
  console.log('Usuarios disponibles:');
  for (const user of Object.values(TEST_USERS)) {
    console.log(`  📧 ${user.email} (${user.role})`);
  }
  console.log('');
  console.log('Familia: Familia Test (código: TEST-001)');
  console.log('');
  console.log('═══════════════════════════════════════════');
}

// ============================================================
// Main
// ============================================================

async function main() {
  console.log('');
  console.log('🚀 Seed de datos de testing para play-balance');
  console.log(`📡 DB: ${process.env.DATABASE_URL?.replace(/\/\/.*@/, '//***@')}`); // Oculta credenciales en el log
  console.log('');

  try {
    await cleanDatabase();
    await seedTestData();
    await printSummary();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    process.exit(1);
  }
}

main();
