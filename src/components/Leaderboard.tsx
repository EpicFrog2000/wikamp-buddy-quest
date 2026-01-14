import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, Crown, Shield, User, Loader2 } from "lucide-react";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useAuth } from "@/hooks/useAuth";

export const Leaderboard = () => {
  const { leaderboard, loading } = useLeaderboard();
  const { user } = useAuth();

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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Crown className="w-4 h-4 text-companion-hungry" />;
      case "moderator":
        return <Shield className="w-4 h-4 text-primary" />;
      default:
        return <User className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge variant="outline" className="text-xs bg-companion-hungry/10 text-companion-hungry border-companion-hungry/30">Admin</Badge>;
      case "moderator":
        return <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">Mod</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card className="p-6 bg-gradient-to-b from-card to-background border-2 border-primary/10 flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-to-b from-card to-background border-2 border-primary/10">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-primary/10 rounded-xl">
          <Trophy className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Tabela Wyników</h2>
      </div>

      {leaderboard.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Brak użytkowników w rankingu. Bądź pierwszy!
        </div>
      ) : (
        <div className="space-y-2">
          {leaderboard.map((entry) => {
            const isCurrentUser = entry.user_id === user?.id;
            
            return (
              <Card
                key={entry.id}
                className={`p-4 transition-all duration-300 ${
                  isCurrentUser
                    ? "bg-gradient-to-r from-accent/20 to-primary/10 border-accent/40 ring-2 ring-accent/20"
                    : entry.rank <= 3
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
                        {getRoleIcon(entry.role)}
                        <span className="font-semibold text-foreground">
                          {entry.name}
                          {isCurrentUser && " (Ty)"}
                        </span>
                        {entry.rank <= 3 && (
                          <Badge className={getRankBadge(entry.rank)}>
                            TOP {entry.rank}
                          </Badge>
                        )}
                        {getRoleBadge(entry.role)}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>{entry.points} pkt</span>
                        <span>•</span>
                        <span>🐿️ {entry.icyTowerScore}</span>
                        <span>•</span>
                        <span>🎯 {entry.cupGameScore} wygranych</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      {entry.totalScore}
                    </div>
                    <p className="text-xs text-muted-foreground">łączny wynik</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <div className="mt-6 p-4 bg-accent/10 rounded-xl border border-accent/20">
        <p className="text-sm text-center text-muted-foreground">
          <span className="font-semibold text-foreground">Wskazówka:</span> Zdobywaj punkty
          wykonując zadania, a następnie baw się w Mini Grę, aby wspiąć się na szczyt rankingu!
        </p>
      </div>
    </Card>
  );
};
