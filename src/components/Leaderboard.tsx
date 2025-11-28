import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award } from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  points: number;
}

export const Leaderboard = () => {
  const leaderboard: LeaderboardEntry[] = [
    { rank: 1, name: "Ania K.", score: 2850, points: 450 },
    { rank: 2, name: "Marcin W.", score: 2640, points: 425 },
    { rank: 3, name: "Kasia P.", score: 2410, points: 390 },
    { rank: 4, name: "Tomek S.", score: 2180, points: 360 },
    { rank: 5, name: "Ola N.", score: 1950, points: 330 },
    { rank: 6, name: "Paweł M.", score: 1720, points: 310 },
    { rank: 7, name: "Zosia B.", score: 1560, points: 285 },
    { rank: 8, name: "Jakub R.", score: 1340, points: 260 },
  ];

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-companion-hungry" />;
      case 2:
        return <Medal className="w-5 h-5 text-muted-foreground" />;
      case 3:
        return <Award className="w-5 h-5 text-companion-tired" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center font-bold text-muted-foreground">{rank}</span>;
    }
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-companion-hungry/20 text-companion-hungry border-companion-hungry/30";
      case 2:
        return "bg-muted/30 text-foreground border-muted";
      case 3:
        return "bg-companion-tired/20 text-companion-tired border-companion-tired/30";
      default:
        return "bg-muted/20 text-muted-foreground border-muted/30";
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-b from-card to-background border-2 border-primary/10">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-primary/10 rounded-xl">
          <Trophy className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Tabela Wyników</h2>
      </div>

      <div className="space-y-2">
        {leaderboard.map((entry) => (
          <Card
            key={entry.rank}
            className={`p-4 transition-all duration-300 ${
              entry.rank <= 3
                ? "bg-gradient-to-r from-primary/5 to-transparent border-primary/20 hover:shadow-md"
                : "bg-card hover:bg-muted/30 border-border"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-10">
                  {getRankIcon(entry.rank)}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">
                      {entry.name}
                    </span>
                    {entry.rank <= 3 && (
                      <Badge className={getRankBadge(entry.rank)}>
                        TOP {entry.rank}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {entry.points} punktów zdobytych
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  {entry.score}
                </div>
                <p className="text-xs text-muted-foreground">wynik w grze</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 p-4 bg-accent/10 rounded-xl border border-accent/20">
        <p className="text-sm text-center text-muted-foreground">
          <span className="font-semibold text-foreground">Wskazówka:</span> Zdobywaj punkty
          wykonując zadania, a następnie baw się w Mini Grę, aby wspiąć się na szczyt rankingu!
        </p>
      </div>
    </Card>
  );
};
