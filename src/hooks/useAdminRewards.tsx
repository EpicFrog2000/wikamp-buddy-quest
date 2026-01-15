import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AdminReward {
  id: string;
  name: string;
  description: string;
  cost: number;
  type: "attendance" | "cosmetic" | "boost";
  effect_type: string | null;
  effect_value: number | null;
}

export const useAdminRewards = () => {
  const [rewards, setRewards] = useState<AdminReward[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRewards = useCallback(async () => {
    const { data, error } = await supabase
      .from("rewards")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setRewards(data as AdminReward[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRewards();
  }, [fetchRewards]);

  const addReward = useCallback(async (reward: Omit<AdminReward, "id">) => {
    const { data, error } = await supabase
      .from("rewards")
      .insert(reward)
      .select()
      .single();

    if (error) {
      console.error("Error adding reward:", error);
      return { success: false, data: null };
    }

    setRewards(prev => [data as AdminReward, ...prev]);
    return { success: true, data };
  }, []);

  const updateReward = useCallback(async (id: string, updates: Partial<AdminReward>) => {
    const { error } = await supabase
      .from("rewards")
      .update(updates)
      .eq("id", id);

    if (error) {
      console.error("Error updating reward:", error);
      return false;
    }

    setRewards(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    return true;
  }, []);

  const deleteReward = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("rewards")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting reward:", error);
      return false;
    }

    setRewards(prev => prev.filter(r => r.id !== id));
    return true;
  }, []);

  return {
    rewards,
    loading,
    addReward,
    updateReward,
    deleteReward,
    refetch: fetchRewards
  };
};
