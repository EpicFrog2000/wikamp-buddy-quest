import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { TaskList } from "@/components/TaskList";
import { MiniGames } from "@/components/MiniGames";
import { Leaderboard } from "@/components/Leaderboard";
import { RewardShop } from "@/components/RewardShop";
import { AdminPanel } from "@/components/AdminPanel";
import { ArrowLeft, Heart, Utensils, Battery, Trophy, Star, Settings, LogOut, Loader2 } from "lucide-react";
import squirrelImage from "@/assets/squirrel.png";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

const Companion = () => {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const { profile, isAdmin, updatePoints, loading: profileLoading } = useProfile();
  
  const [stats, setStats] = useState({
    happiness: 80,
    hunger: 60,
    energy: 70,
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  // Sync points with profile
  const points = profile?.points || 0;

  const handlePointsChange = async (change: number) => {
    const newPoints = Math.max(0, points + change);
    await updatePoints(newPoints);
  };

  const feedCompanion = async () => {
    if (points >= 10) {
      setStats((prev) => ({
        ...prev,
        hunger: Math.min(100, prev.hunger + 20),
        happiness: Math.min(100, prev.happiness + 5),
      }));
      await handlePointsChange(-10);
    }
  };

  const playWithCompanion = async () => {
    if (points >= 15) {
      setStats((prev) => ({
        ...prev,
        happiness: Math.min(100, prev.happiness + 20),
        energy: Math.max(0, prev.energy - 10),
      }));
      await handlePointsChange(-15);
    }
  };

  const restCompanion = async () => {
    if (points >= 5) {
      setStats((prev) => ({
        ...prev,
        energy: Math.min(100, prev.energy + 25),
      }));
      await handlePointsChange(-5);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar with Companion */}
      <aside className="fixed left-0 top-0 w-80 h-screen bg-sidebar text-sidebar-foreground p-6 overflow-y-auto">
        {/* Back Button */}
        <Link to="/dashboard">
          <Button variant="ghost" className="mb-4 text-sidebar-foreground hover:bg-white/10 w-full justify-start">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Powrót do Wikamp
          </Button>
        </Link>

        {/* Sign Out Button */}
        <Button 
          variant="ghost" 
          className="mb-6 text-sidebar-foreground hover:bg-white/10 w-full justify-start"
          onClick={handleSignOut}
        >
          <LogOut className="w-5 h-5 mr-2" />
          Wyloguj się
        </Button>

        {/* Header */}
        <h2 className="text-2xl font-bold mb-2">Twój Towarzysz</h2>
        <p className="text-sm text-sidebar-foreground/70 mb-6">
          Witaj, {profile?.name || user.email}!
        </p>

        {/* Points Display */}
        <div className="mb-6 p-4 bg-primary rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="w-6 h-6 text-primary-foreground" />
            <span className="text-primary-foreground font-bold text-xl">Punkty</span>
          </div>
          <span className="text-primary-foreground font-bold text-2xl">{points}</span>
        </div>

        {/* Companion Display */}
        <Card className="mb-6 bg-gradient-to-b from-card to-background border-2 border-primary/20">
          <div className="p-6 space-y-4">
            <div className="relative">
              <div className="w-full h-56 flex items-center justify-center bg-gradient-to-br from-secondary/20 to-primary/10 rounded-2xl overflow-hidden">
                <img
                  src={squirrelImage}
                  alt="Wiewiórka"
                  className="w-44 h-44 object-contain"
                />
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-medium text-card-foreground">
                    <Heart className="w-4 h-4 text-companion-happy" />
                    Szczęście
                  </span>
                  <span className="font-bold text-card-foreground">{Math.round(stats.happiness)}%</span>
                </div>
                <Progress value={stats.happiness} className="h-2" />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-medium text-card-foreground">
                    <Utensils className="w-4 h-4 text-companion-hungry" />
                    Głód
                  </span>
                  <span className="font-bold text-card-foreground">{Math.round(stats.hunger)}%</span>
                </div>
                <Progress value={stats.hunger} className="h-2" />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-medium text-card-foreground">
                    <Battery className="w-4 h-4 text-companion-tired" />
                    Energia
                  </span>
                  <span className="font-bold text-card-foreground">{Math.round(stats.energy)}%</span>
                </div>
                <Progress value={stats.energy} className="h-2" />
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              <Button
                onClick={feedCompanion}
                disabled={points < 10}
                size="sm"
                variant="secondary"
                className="flex flex-col h-auto py-3 gap-1"
              >
                <Utensils className="w-4 h-4" />
                <span className="text-xs">10 pkt</span>
              </Button>
              <Button
                onClick={playWithCompanion}
                disabled={points < 15}
                size="sm"
                variant="secondary"
                className="flex flex-col h-auto py-3 gap-1"
              >
                <Heart className="w-4 h-4" />
                <span className="text-xs">15 pkt</span>
              </Button>
              <Button
                onClick={restCompanion}
                disabled={points < 5}
                size="sm"
                variant="secondary"
                className="flex flex-col h-auto py-3 gap-1"
              >
                <Battery className="w-4 h-4" />
                <span className="text-xs">5 pkt</span>
              </Button>
            </div>
          </div>
        </Card>

        {/* Info */}
        <div className="p-4 bg-accent/10 rounded-xl border border-accent/20">
          <p className="text-sm text-center text-sidebar-foreground/80">
            Wykonuj zadania, graj w mini grę i zdobywaj punkty!
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-80 p-8">
        <Tabs defaultValue="tasks" className="space-y-6">
          <TabsList className={`grid w-full h-auto p-2 bg-card border-2 border-primary/10 ${isAdmin ? 'grid-cols-5' : 'grid-cols-4'}`}>
            <TabsTrigger
              value="tasks"
              className="flex flex-col gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Trophy className="w-5 h-5" />
              <span className="text-sm font-semibold">Zadania</span>
            </TabsTrigger>
            <TabsTrigger
              value="game"
              className="flex flex-col gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
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
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span className="text-sm font-semibold">Sklep</span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger
                value="admin"
                className="flex flex-col gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Settings className="w-5 h-5" />
                <span className="text-sm font-semibold">Admin</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="tasks">
            <TaskList />
          </TabsContent>

          <TabsContent value="game">
            <MiniGames 
              points={points} 
              onPointsChange={handlePointsChange} 
            />
          </TabsContent>

          <TabsContent value="leaderboard">
            <Leaderboard />
          </TabsContent>

          <TabsContent value="shop">
            <RewardShop />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="admin">
              <AdminPanel />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default Companion;
