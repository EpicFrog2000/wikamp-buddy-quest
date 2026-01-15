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

  const purchaseReward = useCallback(async (rewardId: string) => {
    if (!user) return { success: false, reward: null };

    const reward = rewards.find(r => r.id === rewardId);
    if (!reward || purchasedRewardIds.includes(rewardId)) {
      return { success: false, reward: null };
    }

    const { error } = await supabase
      .from("user_rewards")
      .insert({ user_id: user.id, reward_id: rewardId });

    if (error) {
      console.error("Error purchasing reward:", error);
      return { success: false, reward: null };
    }

    setPurchasedRewardIds(prev => [...prev, rewardId]);
    return { success: true, reward };
  }, [user, rewards, purchasedRewardIds]);

  const isRewardPurchased = useCallback((rewardId: string) => {
    return purchasedRewardIds.includes(rewardId);
  }, [purchasedRewardIds]);

  return {
    rewards,
    purchasedRewardIds,
    loading,
    purchaseReward,
    isRewardPurchased,
    refetch: () => {
      fetchRewards();
      fetchPurchasedRewards();
    }
  };
};
