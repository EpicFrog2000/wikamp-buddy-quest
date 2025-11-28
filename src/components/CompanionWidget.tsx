import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Heart, Utensils, Battery, Trophy } from "lucide-react";
import squirrelImage from "@/assets/squirrel.png";

interface CompanionStats {
  happiness: number;
  hunger: number;
  energy: number;
  points: number;
}

export const CompanionWidget = () => {
  const [stats, setStats] = useState<CompanionStats>({
    happiness: 80,
    hunger: 60,
    energy: 70,
    points: 0,
  });

  const [mood, setMood] = useState<"happy" | "neutral" | "sad">("happy");

  useEffect(() => {
    // Determine mood based on stats
    const avgStat = (stats.happiness + stats.hunger + stats.energy) / 3;
    if (avgStat > 60) setMood("happy");
    else if (avgStat > 30) setMood("neutral");
    else setMood("sad");

    // Gradually decrease stats over time
    const interval = setInterval(() => {
      setStats((prev) => ({
        ...prev,
        happiness: Math.max(0, prev.happiness - 0.5),
        hunger: Math.max(0, prev.hunger - 0.8),
        energy: Math.max(0, prev.energy - 0.6),
      }));
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, [stats]);

  const feedCompanion = () => {
    if (stats.points >= 10) {
      setStats((prev) => ({
        ...prev,
        hunger: Math.min(100, prev.hunger + 20),
        happiness: Math.min(100, prev.happiness + 5),
        points: prev.points - 10,
      }));
    }
  };

  const playWithCompanion = () => {
    if (stats.points >= 15) {
      setStats((prev) => ({
        ...prev,
        happiness: Math.min(100, prev.happiness + 20),
        energy: Math.max(0, prev.energy - 10),
        points: prev.points - 15,
      }));
    }
  };

  const restCompanion = () => {
    if (stats.points >= 5) {
      setStats((prev) => ({
        ...prev,
        energy: Math.min(100, prev.energy + 25),
        points: prev.points - 5,
      }));
    }
  };

  return (
    <Card className="fixed bottom-6 right-6 w-80 bg-gradient-to-b from-card to-background border-2 border-primary/20 shadow-[var(--shadow-soft)] transition-all duration-300 hover:shadow-[var(--shadow-hover)]">
      <div className="p-6 space-y-4">
        {/* Companion Image */}
        <div className="relative">
          <div className="w-full h-48 flex items-center justify-center bg-gradient-to-br from-secondary/20 to-primary/10 rounded-2xl overflow-hidden">
            <img
              src={squirrelImage}
              alt="Wiewiórka - Twój wirtualny towarzysz"
              className={`w-36 h-36 object-contain transition-transform duration-500 ${
                mood === "happy"
                  ? "animate-bounce"
                  : mood === "neutral"
                  ? "scale-95"
                  : "scale-90 opacity-70"
              }`}
            />
          </div>
          <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground px-4 py-2 rounded-full font-bold shadow-lg flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            {stats.points}
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 font-medium">
                <Heart className="w-4 h-4 text-companion-happy" />
                Szczęście
              </span>
              <span className="font-bold text-foreground">{Math.round(stats.happiness)}%</span>
            </div>
            <Progress value={stats.happiness} className="h-2" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 font-medium">
                <Utensils className="w-4 h-4 text-companion-hungry" />
                Głód
              </span>
              <span className="font-bold text-foreground">{Math.round(stats.hunger)}%</span>
            </div>
            <Progress value={stats.hunger} className="h-2" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 font-medium">
                <Battery className="w-4 h-4 text-companion-tired" />
                Energia
              </span>
              <span className="font-bold text-foreground">{Math.round(stats.energy)}%</span>
            </div>
            <Progress value={stats.energy} className="h-2" />
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          <Button
            onClick={feedCompanion}
            disabled={stats.points < 10}
            size="sm"
            variant="secondary"
            className="flex flex-col h-auto py-3 gap-1"
          >
            <Utensils className="w-4 h-4" />
            <span className="text-xs">10 pkt</span>
          </Button>
          <Button
            onClick={playWithCompanion}
            disabled={stats.points < 15}
            size="sm"
            variant="secondary"
            className="flex flex-col h-auto py-3 gap-1"
          >
            <Heart className="w-4 h-4" />
            <span className="text-xs">15 pkt</span>
          </Button>
          <Button
            onClick={restCompanion}
            disabled={stats.points < 5}
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
  );
};
