import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface CompanionStats {
  id: string;
  user_id: string;
  happiness: number;
  hunger: number;
  energy: number;
  last_decay_at: string;
}

const DECAY_INTERVAL_MS = 60 * 1000; // Check every minute
const DECAY_RATE_PER_HOUR = 2; // Stats decay by 2 per hour

interface CompanionActionResult {
  success: boolean;
  new_balance: number;
  error_message: string;
}

export const useCompanionStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<CompanionStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("companion_stats")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching companion stats:", error);
      return;
    }

    if (data) {
      // Apply time-based decay
      const lastDecay = new Date(data.last_decay_at);
      const now = new Date();
      const hoursPassed = (now.getTime() - lastDecay.getTime()) / (1000 * 60 * 60);
      
      if (hoursPassed >= 1) {
        const decay = Math.floor(hoursPassed * DECAY_RATE_PER_HOUR);
        const newHappiness = Math.max(0, data.happiness - decay);
        const newHunger = Math.max(0, data.hunger - decay);
        const newEnergy = Math.max(0, data.energy - decay);
        
        // Update in database
        const { error: updateError } = await supabase
          .from("companion_stats")
          .update({
            happiness: newHappiness,
            hunger: newHunger,
            energy: newEnergy,
            last_decay_at: now.toISOString()
          })
          .eq("user_id", user.id);

        if (!updateError) {
          setStats({
            ...data,
            happiness: newHappiness,
            hunger: newHunger,
            energy: newEnergy,
            last_decay_at: now.toISOString()
          });
        } else {
          setStats(data);
        }
      } else {
        setStats(data);
      }
    } else {
      // Create stats for existing user
      const { data: newData, error: insertError } = await supabase
        .from("companion_stats")
        .insert({ user_id: user.id })
        .select()
        .single();

      if (!insertError && newData) {
        setStats(newData);
      }
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Periodic decay check
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      fetchStats();
    }, DECAY_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [user, fetchStats]);

  const updateStats = useCallback(async (updates: Partial<Pick<CompanionStats, 'happiness' | 'hunger' | 'energy'>>) => {
    if (!user || !stats) return;

    const newStats = {
      happiness: Math.min(100, Math.max(0, updates.happiness ?? stats.happiness)),
      hunger: Math.min(100, Math.max(0, updates.hunger ?? stats.hunger)),
      energy: Math.min(100, Math.max(0, updates.energy ?? stats.energy)),
    };

    const { error } = await supabase
      .from("companion_stats")
      .update(newStats)
      .eq("user_id", user.id);

    if (!error) {
      setStats({ ...stats, ...newStats });
    }

    return !error;
  }, [user, stats]);

  // Atomic companion action using database function to prevent race conditions
  const performCompanionActionAtomic = useCallback(async (
    action: 'feed' | 'play' | 'rest',
    cost: number
  ): Promise<{ success: boolean; newBalance: number; errorMessage: string | null }> => {
    if (!user) {
      return { success: false, newBalance: 0, errorMessage: "Not authenticated" };
    }

    const { data, error } = await supabase.rpc('companion_action_atomic', {
      _user_id: user.id,
      _action: action,
      _cost: cost
    });

    if (error) {
      console.error("Error performing companion action:", error);
      return { success: false, newBalance: 0, errorMessage: error.message };
    }

    const result = data as CompanionActionResult[] | null;
    if (!result || result.length === 0) {
      return { success: false, newBalance: 0, errorMessage: "Unknown error" };
    }

    const actionResult = result[0];
    
    if (actionResult.success) {
      // Refresh stats after successful action
      await fetchStats();
    }

    return {
      success: actionResult.success,
      newBalance: actionResult.new_balance,
      errorMessage: actionResult.success ? null : actionResult.error_message
    };
  }, [user, fetchStats]);

  const applyRewardEffect = useCallback(async (effectType: string, effectValue: number) => {
    if (!stats) return false;
    
    switch (effectType) {
      case 'companion_happiness':
        return updateStats({ happiness: stats.happiness + effectValue });
      case 'companion_hunger':
        return updateStats({ hunger: stats.hunger + effectValue });
      case 'companion_energy':
        return updateStats({ energy: stats.energy + effectValue });
      default:
        return false;
    }
  }, [stats, updateStats]);

  return {
    stats,
    loading,
    updateStats,
    performCompanionActionAtomic,
    applyRewardEffect,
    refetch: fetchStats
  };
};
