
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { users, families, quests, rewards } from "../src/db/schema";
import { eq, and, isNull } from "drizzle-orm";

async function migrate() {
  console.log("Iniciando migración de familias existentes...");

  const { db } = await import("../src/db/index");

  // 1. Obtener todos los padres sin familyId
  const existingParents = await db.select().from(users).where(and(eq(users.role, 'parent'), isNull(users.familyId)));

  for (const parent of existingParents) {
    const familyCode = `${parent.name.split(' ')[0].toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    
    console.log(`Creando familia para ${parent.name} con código ${familyCode}...`);

    // Crear la familia
    const [newFamily] = await db.insert(families).values({
      name: `Familia ${parent.name}`,
      code: familyCode,
    }).returning();

    // Actualizar al padre
    await db.update(users).set({ familyId: newFamily.id }).where(eq(users.id, parent.id));

    // Actualizar a sus hijos (buscando por parentId)
    await db.update(users).set({ familyId: newFamily.id }).where(eq(users.parentId, parent.id));

    // Actualizar misiones
    await db.update(quests).set({ familyId: newFamily.id }).where(eq(quests.createdBy, parent.id));

    // Actualizar premios
    await db.update(rewards).set({ familyId: newFamily.id }).where(eq(rewards.createdBy, parent.id));
    
    console.log(`¡Migración completada para ${parent.name}!`);
  }

  console.log("Proceso finalizado.");
  process.exit(0);
}

migrate().catch(err => {
  console.error("Error en migración:", err);
  process.exit(1);
});
