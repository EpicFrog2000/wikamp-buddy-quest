import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Reward {
  id: string;
  name: string;
  description: string;
  cost: number;
  type: "attendance" | "cosmetic" | "boost";
  effect_type: string | null;
  effect_value: number | null;
}

export interface UserReward {
  id: string;
  user_id: string;
  reward_id: string;
  purchased_at: string;
  used_at: string | null;
  expires_at: string | null;
  is_active: boolean;
}

interface PurchaseResult {
  success: boolean;
  new_balance: number;
  error_message: string;
  reward_effect_type: string | null;
  reward_effect_value: number;
}

export const useRewards = () => {
  const { user } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [purchasedRewardIds, setPurchasedRewardIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRewards = useCallback(async () => {
    const { data, error } = await supabase
      .from("rewards")
      .select("*")
      .order("cost", { ascending: true });

    if (!error && data) {
      setRewards(data as Reward[]);
    }
  }, []);

  const fetchPurchasedRewards = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("user_rewards")
      .select("reward_id")
      .eq("user_id", user.id);

    if (!error && data) {
      setPurchasedRewardIds(data.map(ur => ur.reward_id));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchRewards();
  }, [fetchRewards]);

  useEffect(() => {
    if (user) {
      fetchPurchasedRewards();
    } else {
      setPurchasedRewardIds([]);
      setLoading(false);
    }
  }, [user, fetchPurchasedRewards]);

  const purchaseRewardAtomic = useCallback(async (rewardId: string): Promise<{
    success: boolean;
    newBalance: number;
    errorMessage: string | null;
    effectType: string | null;
    effectValue: number;
  }> => {
    if (!user) {
      return { success: false, newBalance: 0, errorMessage: "Not authenticated", effectType: null, effectValue: 0 };
    }

    const reward = rewards.find(r => r.id === rewardId);
    if (!reward) {
      return { success: false, newBalance: 0, errorMessage: "Reward not found", effectType: null, effectValue: 0 };
    }

    if (purchasedRewardIds.includes(rewardId)) {
      return { success: false, newBalance: 0, errorMessage: "Already purchased", effectType: null, effectValue: 0 };
    }

    const { data, error } = await supabase.rpc('purchase_reward_atomic', {
      _user_id: user.id,
      _reward_id: rewardId
    });

    if (error) {
      console.error("Error purchasing reward:", error);
      return { success: false, newBalance: 0, errorMessage: error.message, effectType: null, effectValue: 0 };
    }

    const result = data as PurchaseResult[] | null;
    if (!result || result.length === 0) {
      return { success: false, newBalance: 0, errorMessage: "Unknown error", effectType: null, effectValue: 0 };
    }

    const purchaseResult = result[0];
    
    if (purchaseResult.success) {
      setPurchasedRewardIds(prev => [...prev, rewardId]);
    }

    return {
      success: purchaseResult.success,
      newBalance: purchaseResult.new_balance,
      errorMessage: purchaseResult.success ? null : purchaseResult.error_message,
      effectType: purchaseResult.reward_effect_type,
      effectValue: purchaseResult.reward_effect_value
    };
  }, [user, rewards, purchasedRewardIds]);

  const isRewardPurchased = useCallback((rewardId: string) => {
    return purchasedRewardIds.includes(rewardId);
  }, [purchasedRewardIds]);

  return {
    rewards,
    purchasedRewardIds,
    loading,
    purchaseRewardAtomic,
    isRewardPurchased,
    refetch: () => {
      fetchRewards();
      fetchPurchasedRewards();
    }
  };
};
