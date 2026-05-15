import ProDashboardClient from "./ProDashboardClient";
import { getProfessionalStats, getManagedFamilies } from "../actions/pro";

export default async function ProPage() {
  const [stats, families] = await Promise.all([
    getProfessionalStats(),
    getManagedFamilies()
  ]);

  return (
    <ProDashboardClient 
      initialStats={stats} 
      initialFamilies={families} 
    />
  );
}
