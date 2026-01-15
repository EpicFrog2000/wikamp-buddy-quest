import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTasks } from "@/hooks/useTasks";

interface TaskListProps {
  onPointsChange: (change: number) => Promise<void>;
  onTaskComplete: () => Promise<void>;
}

export const TaskList = ({ onPointsChange, onTaskComplete }: TaskListProps) => {
  const { toast } = useToast();
  const { tasks, completedTaskIds, loading, completeTask, isTaskCompleted } = useTasks();

  const handleCompleteTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || isTaskCompleted(taskId)) return;

    const result = await completeTask(taskId);
    if (result.success) {
      await onPointsChange(result.points);
      await onTaskComplete();
      
      toast({
        title: "Gratulacje! 🎉",
        description: `Zdobyłeś ${result.points} punktów za: ${task.title}`,
      });
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "beginner":
        return "bg-game-success/20 text-game-success border-game-success/30";
      case "intermediate":
        return "bg-companion-hungry/20 text-companion-hungry border-companion-hungry/30";
      case "advanced":
        return "bg-companion-tired/20 text-companion-tired border-companion-tired/30";
      default:
        return "bg-muted/20 text-muted-foreground border-muted/30";
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "beginner":
        return "Łatwe";
      case "intermediate":
        return "Średnie";
      case "advanced":
        return "Trudne";
      default:
        return category;
    }
  };

  if (loading) {
    return (
      <Card className="p-6 bg-gradient-to-b from-card to-background border-2 border-primary/10">
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Card>
    );
  }

  const completedCount = tasks.filter(t => isTaskCompleted(t.id)).length;

  return (
    <Card className="p-6 bg-gradient-to-b from-card to-background border-2 border-primary/10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">Zadania do wykonania</h2>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
          <Trophy className="w-5 h-5 text-primary" />
          <span className="font-bold text-foreground">
            {completedCount}/{tasks.length}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => {
          const completed = isTaskCompleted(task.id);
          
          return (
            <Card
              key={task.id}
              className={`p-4 transition-all duration-300 ${
                completed
                  ? "bg-muted/50 border-game-success/30"
                  : "bg-card hover:shadow-md border-border"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  {completed ? (
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
                          completed
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

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-primary">
                      +{task.points} punktów
                    </span>
                    {!completed && (
                      <Button 
                        size="sm" 
                        onClick={() => handleCompleteTask(task.id)}
                        className="bg-primary hover:bg-primary/90"
                      >
                        Wykonaj
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </Card>
  );
};
