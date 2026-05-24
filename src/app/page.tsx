import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LandingPage } from "@/components/LandingPage";
import { Dashboards } from "@/components/Dashboards";
import { 
  getPlayerStats, 
  getAvailableQuests, 
  getAvailableRewards,
  getPendingRewardClaimsForChild
} from "./actions/player";
import { getMySuggestions } from "./actions/suggestions";
import { getMessagesForFamily } from "./actions/messages";

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

  let initialMessages: any[] = [];
  let pendingRewards: any[] = [];
  if (session?.user && (session.user as any).role === 'child') {
    const [msgsRes, pr] = await Promise.all([
      getMessagesForFamily('children'),
      getPendingRewardClaimsForChild()
    ]);
    if (msgsRes.success) {
      initialMessages = msgsRes.data;
    }
    pendingRewards = pr;
  }

  return (
    <Dashboards 
      initialData={{ 
        player: player as any, 
        quests: quests as any, 
        rewards: rewards as any, 
        pendingRewards: pendingRewards as any,
        mySuggestions: mySuggestions as any,
        messages: initialMessages
      }} 
    />
  );
}


