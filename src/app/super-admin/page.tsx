import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import SuperAdminClient from "./SuperAdminClient";

export default async function SuperAdminPage() {
  const session = await getServerSession(authOptions);

  // Si no hay sesión o no es super_admin, redirección al login
  if (!session || (session.user as { role?: string }).role !== 'super_admin') {
    redirect("/login");
  }

  return <SuperAdminClient />;
}
