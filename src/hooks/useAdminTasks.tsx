import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AdminTask {
  id: string;
  title: string;
  description: string;
  points: number;
  category: "beginner" | "intermediate" | "advanced";
  is_active: boolean;
}

export const useAdminTasks = () => {
  const [tasks, setTasks] = useState<AdminTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setTasks(data as AdminTask[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const addTask = useCallback(async (task: Omit<AdminTask, "id" | "is_active">) => {
    const { data, error } = await supabase
      .from("tasks")
      .insert({ ...task, is_active: true })
      .select()
      .single();

    if (error) {
      console.error("Error adding task:", error);
      return { success: false, data: null };
    }

    setTasks(prev => [data as AdminTask, ...prev]);
    return { success: true, data };
  }, []);

  const updateTask = useCallback(async (id: string, updates: Partial<AdminTask>) => {
    const { error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", id);

    if (error) {
      console.error("Error updating task:", error);
      return false;
    }

    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    return true;
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from("tasks")
      .update({ is_active: false })
      .eq("id", id);

    if (error) {
      console.error("Error deleting task:", error);
      return false;
    }

    setTasks(prev => prev.filter(t => t.id !== id));
    return true;
  }, []);

  return {
    tasks,
    loading,
    addTask,
    updateTask,
    deleteTask,
    refetch: fetchTasks
  };
};
