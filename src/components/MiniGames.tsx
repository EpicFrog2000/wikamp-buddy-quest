import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IcyTowerGame } from "./IcyTowerGame";
import { CupGame } from "./CupGame";
import { ArrowLeft, Gamepad2 } from "lucide-react";

interface MiniGamesProps {
  points: number;
  onPointsChange: (change: number) => void;
}

export const MiniGames = ({ points, onPointsChange }: MiniGamesProps) => {
  const [selectedGame, setSelectedGame] = useState<"menu" | "squirrel" | "cups">("menu");

  if (selectedGame === "squirrel") {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => setSelectedGame("menu")}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Powrót do wyboru gier
        </Button>
        <IcyTowerGame onPointsChange={onPointsChange} />
      </div>
    );
  }

  if (selectedGame === "cups") {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => setSelectedGame("menu")}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Powrót do wyboru gier
        </Button>
        <CupGame points={points} onPointsChange={onPointsChange} />
      </div>
    );
  }

  return (
    <Card className="p-8 bg-gradient-to-b from-card to-background border-2 border-primary/10">
      <div className="space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Gamepad2 className="w-8 h-8 text-primary" />
            <h2 className="text-3xl font-bold text-foreground">Mini Gry</h2>
          </div>
          <p className="text-muted-foreground">Wybierz grę i zdobywaj punkty!</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card
            className="p-6 cursor-pointer hover:scale-[1.02] transition-all hover:shadow-xl border-2 border-transparent hover:border-primary/30 bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-950/30 dark:to-amber-900/20"
            onClick={() => setSelectedGame("squirrel")}
          >
            <div className="text-center space-y-4">
              <h3 className="text-2xl font-bold">Wiewiórka w Górę</h3>
              <p className="text-muted-foreground">
                Skacz po platformach i wspinaj się jak najwyżej! Sterowanie strzałkami lub WASD.
              </p>
              <p className="text-sm text-muted-foreground">
                Platformówka, zręcznościowa
              </p>
              <Button className="w-full mt-4">
                Zagraj
              </Button>
            </div>
          </Card>

          <Card
            className="p-6 cursor-pointer hover:scale-[1.02] transition-all border-2 bg-orange-50 dark:bg-orange-950"
            onClick={() => setSelectedGame("cups")}
          >
            <div className="text-center space-y-4">
              <h3 className="text-2xl font-bold">Gra w Kubki</h3>
              <p className="text-muted-foreground">
                Obstawiaj punkty i zgaduj pod którym kubkiem jest piłka. Wygraj x2!
              </p>
              <div className="flex justify-center gap-2">
                <span className="px-3 py-1 bg-primary/10 rounded-full text-sm font-medium text-primary">
                  Hazard
                </span>
                <span className="px-3 py-1 bg-secondary rounded-full text-sm font-medium text-secondary-foreground">
                  Szczęście
                </span>
              </div>
              <Button className="w-full mt-4">
                Zagraj
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </Card>
  );
};
