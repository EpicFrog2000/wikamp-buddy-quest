import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { markTaskAsCompleted, getCompletedTasks, type Task } from "@/lib/taskManager";

export const TaskList = () => {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "1",
      title: "Zaloguj się do Wikamp",
      description: "Pierwszy krok do nauki - zaloguj się na platformę",
      points: 10,
      completed: false,
      category: "beginner",
    },
    {
      id: "2",
      title: "Przejdź do podglądu przedmiotu",
      description: "Kliknij przycisk 'Podgląd' przy dowolnym przedmiocie na stronie głównej",
      points: 15,
      completed: false,
      category: "beginner",
    },
    {
      id: "3",
      title: "Przeglądnij kursy",
      description: "Zobacz dostępne kursy i ich opisy",
      points: 15,
      completed: false,
      category: "beginner",
    },
    {
      id: "4",
      title: "Ukończ pierwszą lekcję",
      description: "Obejrzyj materiał z wybranego kursu",
      points: 25,
      completed: false,
      category: "intermediate",
    },
    {
      id: "5",
      title: "Zrób test wiedzy",
      description: "Sprawdź swoją wiedzę w quizie",
      points: 30,
      completed: false,
      category: "intermediate",
    },
    {
      id: "6",
      title: "Udostępnij materiał",
      description: "Podziel się interesującym materiałem ze znajomymi",
      points: 20,
      completed: false,
      category: "advanced",
    },
  ]);

  // Load completed tasks from localStorage on mount
  useEffect(() => {
    const completedTaskIds = getCompletedTasks();
    setTasks((prev) =>
      prev.map((task) => ({
        ...task,
        completed: completedTaskIds.includes(task.id),
      }))
    );
  }, []);

  // Listen for task completion events
  useEffect(() => {
    const handleTaskCompleted = (event: CustomEvent) => {
      const { taskId } = event.detail;
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, completed: true } : task
        )
      );

      const task = tasks.find((t) => t.id === taskId);
      if (task && !task.completed) {
        toast({
          title: "Gratulacje! 🎉",
          description: `Zdobyłeś ${task.points} punktów za: ${task.title}`,
        });
      }
    };

    window.addEventListener("taskCompleted", handleTaskCompleted as EventListener);
    return () => {
      window.removeEventListener("taskCompleted", handleTaskCompleted as EventListener);
    };
  }, [tasks, toast]);

  const completeTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task && !task.completed) {
      markTaskAsCompleted(taskId);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, completed: true } : t
        )
      );
      toast({
        title: "Gratulacje! 🎉",
        description: `Zdobyłeś ${task.points} punktów za: ${task.title}`,
      });
    }
  };

  const getCategoryColor = (category: Task["category"]) => {
    switch (category) {
      case "beginner":
        return "bg-game-success/20 text-game-success border-game-success/30";
      case "intermediate":
        return "bg-companion-hungry/20 text-companion-hungry border-companion-hungry/30";
      case "advanced":
        return "bg-companion-tired/20 text-companion-tired border-companion-tired/30";
    }
  };

  const getCategoryLabel = (category: Task["category"]) => {
    switch (category) {
      case "beginner":
        return "Łatwe";
      case "intermediate":
        return "Średnie";
      case "advanced":
        return "Trudne";
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-b from-card to-background border-2 border-primary/10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">Zadania do wykonania</h2>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
          <Trophy className="w-5 h-5 text-primary" />
          <span className="font-bold text-foreground">
            {tasks.filter((t) => t.completed).length}/{tasks.length}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => (
          <Card
            key={task.id}
            className={`p-4 transition-all duration-300 ${
              task.completed
                ? "bg-muted/50 border-game-success/30"
                : "bg-card hover:shadow-md border-border"
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="mt-1">
                {task.completed ? (
                  <CheckCircle2 className="w-6 h-6 text-game-success" />
                ) : (
                  <Circle className="w-6 h-6 text-muted-foreground" />
                )}
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h3
                      className={`font-semibold ${
                        task.completed
                          ? "text-muted-foreground line-through"
                          : "text-foreground"
                      }`}
                    >
                      {task.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {task.description}
                    </p>
                  </div>

                  <Badge className={getCategoryColor(task.category)}>
                    {getCategoryLabel(task.category)}
                  </Badge>
                </div>

                <div className="flex items-center">
                  <span className="text-sm font-bold text-primary">
                    +{task.points} punktów
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Card>
  );
};
