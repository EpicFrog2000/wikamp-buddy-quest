import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Star, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Reward {
  id: string;
  name: string;
  description: string;
  cost: number;
  type: "attendance" | "cosmetic" | "boost";
  purchased: boolean;
}

export const RewardShop = () => {
  const { toast } = useToast();
  const [userPoints] = useState(150); // Mock user points
  
  const [rewards, setRewards] = useState<Reward[]>([
    {
      id: "1",
      name: "Dodatkowa obecność",
      description: "Zapisz obecność za dowolne zajęcia",
      cost: 100,
      type: "attendance",
      purchased: false,
    },
    {
      id: "2",
      name: "Złote ucho wiewiórki",
      description: "Ekskluzywny dodatek do Twojego towarzysza",
      cost: 75,
      type: "cosmetic",
      purchased: false,
    },
    {
      id: "3",
      name: "Bonus czasowy",
      description: "2x punkty przez 24 godziny",
      cost: 50,
      type: "boost",
      purchased: false,
    },
    {
      id: "4",
      name: "Przedłużenie terminu",
      description: "Dodatkowy tydzień na oddanie projektu",
      cost: 120,
      type: "attendance",
      purchased: false,
    },
    {
      id: "5",
      name: "Kolorowa czapka",
      description: "Stylowy dodatek dla Twojej wiewiórki",
      cost: 60,
      type: "cosmetic",
      purchased: false,
    },
    {
      id: "6",
      name: "Super boost",
      description: "3x punkty przez 12 godzin",
      cost: 80,
      type: "boost",
      purchased: false,
    },
  ]);

  const getTypeColor = (type: Reward["type"]) => {
    switch (type) {
      case "attendance":
        return "bg-companion-happy/20 text-companion-happy border-companion-happy/30";
      case "cosmetic":
        return "bg-companion-hungry/20 text-companion-hungry border-companion-hungry/30";
      case "boost":
        return "bg-companion-tired/20 text-companion-tired border-companion-tired/30";
    }
  };

  const getTypeLabel = (type: Reward["type"]) => {
    switch (type) {
      case "attendance":
        return "Edukacja";
      case "cosmetic":
        return "Wygląd";
      case "boost":
        return "Wzmocnienie";
    }
  };

  const purchaseReward = (rewardId: string) => {
    const reward = rewards.find((r) => r.id === rewardId);
    if (!reward) return;

    if (userPoints < reward.cost) {
      toast({
        title: "Za mało punktów! 😔",
        description: `Potrzebujesz ${reward.cost - userPoints} punktów więcej.`,
        variant: "destructive",
      });
      return;
    }

    setRewards((prev) =>
      prev.map((r) =>
        r.id === rewardId ? { ...r, purchased: true } : r
      )
    );

    toast({
      title: "Zakup udany! 🎉",
      description: `Kupiłeś: ${reward.name}`,
    });
  };

  return (
    <Card className="p-6 bg-gradient-to-b from-card to-background border-2 border-primary/10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl">
            <ShoppingBag className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Sklep z Nagrodami</h2>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-full">
          <Star className="w-5 h-5" />
          <span className="font-bold">{userPoints} pkt</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rewards.map((reward) => (
          <Card
            key={reward.id}
            className={`p-4 transition-all duration-300 ${
              reward.purchased
                ? "bg-muted/50 border-game-success/30"
                : "bg-card hover:shadow-md border-border"
            }`}
          >
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3
                    className={`font-semibold ${
                      reward.purchased
                        ? "text-muted-foreground line-through"
                        : "text-foreground"
                    }`}
                  >
                    {reward.name}
                  </h3>
                  <Badge className={getTypeColor(reward.type)}>
                    {getTypeLabel(reward.type)}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {reward.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-primary" />
                  <span className="font-bold text-primary">{reward.cost} pkt</span>
                </div>

                {reward.purchased ? (
                  <Badge className="bg-game-success/20 text-game-success border-game-success/30">
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Kupione
                  </Badge>
                ) : (
                  <Button
                    onClick={() => purchaseReward(reward.id)}
                    disabled={userPoints < reward.cost}
                    size="sm"
                    className="bg-primary hover:bg-primary/90"
                  >
                    Kup
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Card>
  );
};
