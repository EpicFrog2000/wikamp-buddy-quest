import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  avatar_url: string | null;
  points: number;
  tasks_completed: number;
  created_at: string;
  updated_at: string;
}

export interface GameRecord {
  id: string;
  user_id: string;
  game_name: string;
  high_score: number;
  games_played: number;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: "admin" | "moderator" | "user";
}

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [gameRecords, setGameRecords] = useState<GameRecord[]>([]);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchGameRecords();
      fetchUserRole();
    } else {
      setProfile(null);
      setGameRecords([]);
      setUserRole(null);
      setLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!error && data) {
      setProfile(data);
    }
    setLoading(false);
  };

  const fetchGameRecords = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("game_records")
      .select("*")
      .eq("user_id", user.id);

    if (!error && data) {
      setGameRecords(data);
    }
  };

  const fetchUserRole = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!error && data) {
      setUserRole(data);
    }
  };

  const updatePoints = async (newPoints: number) => {
    if (!user || !profile) return;
    
    const { error } = await supabase
      .from("profiles")
      .update({ points: newPoints })
      .eq("user_id", user.id);

    if (!error) {
      setProfile({ ...profile, points: newPoints });
    }
  };

  const updateGameRecord = async (gameName: string, score: number) => {
    if (!user) return;
    
    const existingRecord = gameRecords.find(r => r.game_name === gameName);
    
    if (existingRecord) {
      if (score > existingRecord.high_score) {
        const { error } = await supabase
          .from("game_records")
          .update({ 
            high_score: score, 
            games_played: existingRecord.games_played + 1 
          })
          .eq("id", existingRecord.id);

        if (!error) {
          fetchGameRecords();
        }
      } else {
        // Just increment games_played
        await supabase
          .from("game_records")
          .update({ games_played: existingRecord.games_played + 1 })
          .eq("id", existingRecord.id);
        
        fetchGameRecords();
      }
    }
  };

  const incrementTasksCompleted = async () => {
    if (!user || !profile) return;
    
    const { error } = await supabase
      .from("profiles")
      .update({ tasks_completed: profile.tasks_completed + 1 })
      .eq("user_id", user.id);

    if (!error) {
      setProfile({ ...profile, tasks_completed: profile.tasks_completed + 1 });
    }
  };

  const isAdmin = userRole?.role === "admin";
  const isModerator = userRole?.role === "moderator" || userRole?.role === "admin";

  return {
    profile,
    gameRecords,
    userRole,
    loading,
    updatePoints,
    updateGameRecord,
    incrementTasksCompleted,
    isAdmin,
    isModerator,
    refetchProfile: fetchProfile,
    refetchGameRecords: fetchGameRecords,
  };
};
