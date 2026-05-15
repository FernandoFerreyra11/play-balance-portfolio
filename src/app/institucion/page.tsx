import OrgDashboardClient from "./OrgDashboardClient";
import { getOrgStats, getOrgProfessionals } from "../actions/org";

export default async function OrgPage() {
  const [stats, professionals] = await Promise.all([
    getOrgStats(),
    getOrgProfessionals()
  ]);

  return (
    <OrgDashboardClient 
      initialStats={stats} 
      initialProfessionals={professionals} 
    />
  );
}
