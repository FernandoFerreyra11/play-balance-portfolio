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
import { getMessagesForFamily } from "@/app/actions/messages";
import { getFamilyDetail } from "@/app/actions/family";
import { getTodayCheckin } from "@/app/actions/checkin";

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
  let hasProfessional = false;

  if (session?.user && (session.user as any).role === 'child') {
    const [msgsRes, pr, family] = await Promise.all([
      getMessagesForFamily('children'),
      getPendingRewardClaimsForChild(),
      getFamilyDetail()
    ]);
    if (msgsRes.success) {
      initialMessages = msgsRes.data;
    }
    pendingRewards = pr;
    hasProfessional = !!family?.professionalId;
  }

  const todayCheckin = (session?.user as any)?.role === 'child'
    ? await getTodayCheckin()
    : null;

  return (
    <Dashboards 
      initialData={{ 
        player: player as any, 
        quests: quests as any, 
        rewards: rewards as any, 
        pendingRewards: pendingRewards as any,
        mySuggestions: mySuggestions as any,
        messages: initialMessages,
        hasProfessional,
        todayCheckin: todayCheckin as any,
      }} 
    />
  );
}


