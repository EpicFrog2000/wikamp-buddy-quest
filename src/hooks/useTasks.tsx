import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Task {
  id: string;
  title: string;
  description: string;
  points: number;
  category: "beginner" | "intermediate" | "advanced";
  is_active: boolean;
}

export interface UserTask {
  id: string;
  user_id: string;
  task_id: string;
  completed_at: string;
}

export const useTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("is_active", true)
      .order("category", { ascending: true });

    if (!error && data) {
      setTasks(data as Task[]);
    }
  }, []);

  const fetchCompletedTasks = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("user_tasks")
      .select("task_id")
      .eq("user_id", user.id);

    if (!error && data) {
      setCompletedTaskIds(data.map(ut => ut.task_id));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    if (user) {
      fetchCompletedTasks();
    } else {
      setCompletedTaskIds([]);
      setLoading(false);
    }
  }, [user, fetchCompletedTasks]);

  const completeTask = useCallback(async (taskId: string) => {
    if (!user) return { success: false, points: 0 };

    const task = tasks.find(t => t.id === taskId);
    if (!task || completedTaskIds.includes(taskId)) {
      return { success: false, points: 0 };
    }

    const { error } = await supabase
      .from("user_tasks")
      .insert({ user_id: user.id, task_id: taskId });

    if (error) {
      console.error("Error completing task:", error);
      return { success: false, points: 0 };
    }

    setCompletedTaskIds(prev => [...prev, taskId]);
    return { success: true, points: task.points };
  }, [user, tasks, completedTaskIds]);

  const isTaskCompleted = useCallback((taskId: string) => {
    return completedTaskIds.includes(taskId);
  }, [completedTaskIds]);

  return {
    tasks,
    completedTaskIds,
    loading,
    completeTask,
    isTaskCompleted,
    refetch: () => {
      fetchTasks();
      fetchCompletedTasks();
    }
  };
};
