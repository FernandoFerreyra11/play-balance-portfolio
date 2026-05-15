import { db } from "../src/db";
import { users } from "../src/db/schema";
import { eq } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function promoteToPro(email: string) {
  console.log(`🛡️ Promoviendo a ${email} a Profesional...`);
  
  try {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    const user = result[0];

    if (!user) {
      console.error("❌ Usuario no encontrado.");
      return;
    }

    await db
      .update(users)
      .set({ role: "professional" })
      .where(eq(users.id, user.id));

    console.log(`✅ ¡Felicidades! ${email} ahora es Profesional.`);
  } catch (error) {
    console.error("❌ Error al promover usuario:", error);
  }
}

const email = process.argv[2];
if (!email) {
  console.error("❌ Por favor proporciona un email: npx tsx scripts/promote-pro.ts email@example.com");
} else {
  promoteToPro(email);
}
