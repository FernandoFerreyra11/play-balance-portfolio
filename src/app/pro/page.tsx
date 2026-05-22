import ProDashboardClient from "./ProDashboardClient";
import { getProfessionalStats, getManagedFamilies } from "../actions/pro";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function ProPage() {
  const session = await getServerSession(authOptions);
  let hasOrganization = false;
  
  if (session?.user && (session.user as any).id) {
    const [dbUser] = await db.select({ organizationId: users.organizationId }).from(users).where(eq(users.id, (session.user as any).id));
    hasOrganization = !!dbUser?.organizationId;
  }

  const [stats, families] = await Promise.all([
    getProfessionalStats(),
    getManagedFamilies()
  ]);

  return (
    <ProDashboardClient 
      initialStats={stats} 
      initialFamilies={families} 
      hasOrganization={hasOrganization}
    />
  );
}
