import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { users, families, quests, rewards, suggestions, activeQuests, transactions } from "../src/db/schema";

async function reset() {
  console.log("💣 Iniciando limpieza total de la base de datos...");
  const { db } = await import("../src/db/index");

  try {
    // El orden importa por las claves foráneas
    console.log("- Limpiando transacciones...");
    await db.delete(transactions);
    
    console.log("- Limpiando misiones activas...");
    await db.delete(activeQuests);
    
    console.log("- Limpiando sugerencias...");
    await db.delete(suggestions);
    
    console.log("- Limpiando premios...");
    await db.delete(rewards);
    
    console.log("- Limpiando misiones...");
    await db.delete(quests);
    
    console.log("- Limpiando usuarios...");
    await db.delete(users);
    
    console.log("- Limpiando familias...");
    await db.delete(families);

    console.log("✅ ¡Base de datos en 0! Limpia y reluciente.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error al limpiar la base de datos:", error);
    process.exit(1);
  }
}

reset();
