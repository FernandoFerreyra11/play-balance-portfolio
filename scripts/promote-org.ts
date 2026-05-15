import { db } from "../src/db";
import { users } from "../src/db/schema";
import { eq } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function promoteToOrgAdmin(email: string) {
  console.log(`🏢 Promoviendo a ${email} a Director de Institución...`);
  
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      console.error("❌ Usuario no encontrado.");
      return;
    }

    await db
      .update(users)
      .set({ role: "org_admin" })
      .where(eq(users.id, user.id));

    console.log(`✅ ¡Felicidades! ${email} ahora es Director de Institución.`);
    console.log(`💡 Recuerda que ahora debe crear/unirse a una organización al loguearse.`);
  } catch (error) {
    console.error("❌ Error al promover usuario:", error);
  }
}

const email = process.argv[2];
if (!email) {
  console.error("❌ Por favor proporciona un email: npx tsx scripts/promote-org.ts email@example.com");
} else {
  promoteToOrgAdmin(email);
}
