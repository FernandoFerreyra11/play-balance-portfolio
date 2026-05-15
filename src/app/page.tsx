import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LandingPage } from "@/components/LandingPage";
import { Dashboards } from "@/components/Dashboards";
import { 
  getPlayerStats, 
  getAvailableQuests, 
  getAvailableRewards 
} from "./actions/player";
import { getMySuggestions } from "./actions/suggestions";

export default async function Home() {
  console.log("SERVER: Rendering Home page");
  const session = await getServerSession(authOptions);
  console.log("SERVER: Session status:", !!session);

  if (!session) {
    console.log("SERVER: No session, showing LandingPage");
    return <LandingPage />;
  }

  // Si hay sesión, cargamos los datos iniciales para el dashboard
  const [player, quests, rewards, mySuggestions] = await Promise.all([
    getPlayerStats(),
    getAvailableQuests(),
    getAvailableRewards(),
    getMySuggestions()
  ]);

  return (
    <Dashboards 
      initialData={{ 
        player, 
        quests, 
        rewards, 
        mySuggestions 
      }} 
    />
  );
}


