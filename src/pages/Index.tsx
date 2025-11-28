import { CompanionWidget } from "@/components/CompanionWidget";
import { TaskList } from "@/components/TaskList";
import { IcyTowerGame } from "@/components/IcyTowerGame";
import { Leaderboard } from "@/components/Leaderboard";
import { RewardShop } from "@/components/RewardShop";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, Gamepad2, Trophy, ShoppingBag } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary via-primary to-secondary text-primary-foreground shadow-lg sticky top-0 z-10">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Wikamp - Wirtualny Towarzysz</h1>
              <p className="text-primary-foreground/90 text-sm">
                Ucz się, baw się i zdobywaj nagrody!
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <Tabs defaultValue="tasks" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-auto p-2 bg-card border-2 border-primary/10">
            <TabsTrigger
              value="tasks"
              className="flex flex-col gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <GraduationCap className="w-5 h-5" />
              <span className="text-sm font-semibold">Zadania</span>
            </TabsTrigger>
            <TabsTrigger
              value="game"
              className="flex flex-col gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Gamepad2 className="w-5 h-5" />
              <span className="text-sm font-semibold">Mini Gra</span>
            </TabsTrigger>
            <TabsTrigger
              value="leaderboard"
              className="flex flex-col gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Trophy className="w-5 h-5" />
              <span className="text-sm font-semibold">Ranking</span>
            </TabsTrigger>
            <TabsTrigger
              value="shop"
              className="flex flex-col gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="text-sm font-semibold">Sklep</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-6">
            <TaskList />
          </TabsContent>

          <TabsContent value="game" className="space-y-6">
            <IcyTowerGame />
          </TabsContent>

          <TabsContent value="leaderboard" className="space-y-6">
            <Leaderboard />
          </TabsContent>

          <TabsContent value="shop" className="space-y-6">
            <RewardShop />
          </TabsContent>
        </Tabs>
      </main>

      {/* Companion Widget - Fixed position */}
      <CompanionWidget />
    </div>
  );
};

export default Index;
