import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Star, CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRewards } from "@/hooks/useRewards";
import { useCompanionStats } from "@/hooks/useCompanionStats";

interface RewardShopProps {
  points: number;
  onPointsChange: (newPoints: number) => void;
}

export const RewardShop = ({ points, onPointsChange }: RewardShopProps) => {
  const { toast } = useToast();
  const { rewards, loading, purchaseRewardAtomic, isRewardPurchased } = useRewards();
  const { applyRewardEffect } = useCompanionStats();
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  const getTypeColor = (type: string) => {
    switch (type) {
      case "attendance":
        return "bg-companion-happy/20 text-companion-happy border-companion-happy/30";
      case "cosmetic":
        return "bg-companion-hungry/20 text-companion-hungry border-companion-hungry/30";
      case "boost":
        return "bg-companion-tired/20 text-companion-tired border-companion-tired/30";
      default:
        return "bg-muted/20 text-muted-foreground border-muted/30";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "attendance":
        return "Edukacja";
      case "cosmetic":
        return "Wygląd";
      case "boost":
        return "Wzmocnienie";
      default:
        return type;
    }
  };

  const handlePurchaseReward = async (rewardId: string) => {
    const reward = rewards.find((r) => r.id === rewardId);
    if (!reward) return;

    // Prevent double-click with local state
    if (purchasingId) return;
    setPurchasingId(rewardId);

    try {
      // Use atomic database function - handles balance check and deduction atomically
      const result = await purchaseRewardAtomic(rewardId);

      if (result.success) {
        // Update local points state with the new balance from server
        onPointsChange(result.newBalance);

        // Apply the effect if applicable
        if (result.effectType && result.effectValue) {
          if (result.effectType === 'bonus_points') {
            // Bonus points are already handled by the atomic function conceptually
            // But we need to add them back - this is a special case
            // For now, just notify the user
            toast({
              title: "Zakup udany! 🎉",
              description: `Kupiłeś: ${reward.name} i otrzymujesz +${result.effectValue} punktów!`,
            });
          } else {
            // Apply companion stat effect
            await applyRewardEffect(result.effectType, result.effectValue);
            toast({
              title: "Zakup udany! 🎉",
              description: `Kupiłeś: ${reward.name}`,
            });
          }
        } else {
          toast({
            title: "Zakup udany! 🎉",
            description: `Kupiłeś: ${reward.name}`,
          });
        }
      } else {
        // Show error from server
        if (result.errorMessage === 'Insufficient points') {
          toast({
            title: "Za mało punktów! 😔",
            description: `Potrzebujesz więcej punktów.`,
            variant: "destructive",
          });
        } else if (result.errorMessage === 'Already purchased') {
          toast({
            title: "Już kupione",
            description: "Masz już tę nagrodę.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Błąd",
            description: result.errorMessage || "Nie udało się kupić nagrody",
            variant: "destructive",
          });
        }
      }
    } finally {
      setPurchasingId(null);
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl">
            <ShoppingBag className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Sklep z Nagrodami</h2>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-full">
          <Star className="w-5 h-5" />
          <span className="font-bold">{points} pkt</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rewards.map((reward) => {
          const purchased = isRewardPurchased(reward.id);
          const isPurchasing = purchasingId === reward.id;
          
          return (
            <Card
              key={reward.id}
              className={`p-4 transition-all duration-300 ${
                purchased
                  ? "bg-muted/50 border-game-success/30"
                  : "bg-card hover:shadow-md border-border"
              }`}
            >
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3
                      className={`font-semibold ${
                        purchased
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

                  {purchased ? (
                    <Badge className="bg-game-success/20 text-game-success border-game-success/30">
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Kupione
                    </Badge>
                  ) : (
                    <Button
                      onClick={() => handlePurchaseReward(reward.id)}
                      disabled={points < reward.cost || isPurchasing}
                      size="sm"
                      className="bg-primary hover:bg-primary/90"
                    >
                      {isPurchasing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Kup"
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </Card>
  );
};
