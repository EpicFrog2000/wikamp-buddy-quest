import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface LeaderboardEntry {
  id: string;
  user_id: string;
  name: string;
  points: number;
  tasks_completed: number;
  role: "admin" | "moderator" | "user";
  icyTowerScore: number;
  cupGameScore: number;
  totalScore: number;
  rank: number;
}

export const useLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    setLoading(true);
    
    // Fetch profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*");

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      setLoading(false);
      return;
    }

    // Fetch all game records
    const { data: gameRecords, error: gameRecordsError } = await supabase
      .from("game_records")
      .select("*");

    if (gameRecordsError) {
      console.error("Error fetching game records:", gameRecordsError);
    }

    // Fetch all user roles
    const { data: userRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("*");

    if (rolesError) {
      console.error("Error fetching user roles:", rolesError);
    }

    // Combine data
    const entries: LeaderboardEntry[] = profiles.map((profile) => {
      const userGameRecords = gameRecords?.filter(r => r.user_id === profile.user_id) || [];
      const icyTowerRecord = userGameRecords.find(r => r.game_name === "icyTower");
      const cupGameRecord = userGameRecords.find(r => r.game_name === "cupGame");
      const userRole = userRoles?.find(r => r.user_id === profile.user_id);

      const icyTowerScore = icyTowerRecord?.high_score || 0;
      const cupGameScore = cupGameRecord?.high_score || 0;
      const totalScore = icyTowerScore + (cupGameScore * 100);

      return {
        id: profile.id,
        user_id: profile.user_id,
        name: profile.name,
        points: profile.points,
        tasks_completed: profile.tasks_completed,
        role: (userRole?.role || "user") as "admin" | "moderator" | "user",
        icyTowerScore,
        cupGameScore,
        totalScore,
        rank: 0,
      };
    });

    // Sort by total score and assign ranks
    entries.sort((a, b) => b.totalScore - a.totalScore);
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    setLeaderboard(entries);
    setLoading(false);
  };

  useEffect(() => {
    fetchLeaderboard();
    
    // Refresh every 5 seconds
    const interval = setInterval(fetchLeaderboard, 5000);
    return () => clearInterval(interval);
  }, []);

  return { leaderboard, loading, refetch: fetchLeaderboard };
};
