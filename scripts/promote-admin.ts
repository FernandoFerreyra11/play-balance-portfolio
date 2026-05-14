import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { eq } from "drizzle-orm";
import { users } from "../src/db/schema";

async function promote() {
  const email = process.argv[2];
  if (!email) {
    console.error("❌ Por favor, proporciona un email: npx tsx scripts/promote-admin.ts tu@email.com");
    process.exit(1);
  }

  console.log(`🛡️ Promoviendo a ${email} a Super Administrador...`);
  
  const { db } = await import("../src/db/index");

  try {
    const result = await db.update(users)
      .set({ role: 'super_admin' })
      .where(eq(users.email, email))
      .returning();

    if (result.length === 0) {
      console.error("❌ No se encontró ningún usuario con ese email.");
    } else {
      console.log(`✅ ¡Felicidades! ${email} ahora es Super Administrador.`);
    }
    process.exit(0);
  } catch (error) {
    console.error("❌ Error al promover usuario:", error);
    process.exit(1);
  }
}

promote();
