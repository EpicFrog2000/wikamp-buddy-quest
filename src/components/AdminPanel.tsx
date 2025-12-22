import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingBag, ListTodo, Plus, Trash2, Edit2, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Reward {
  id: string;
  name: string;
  description: string;
  cost: number;
  type: "attendance" | "cosmetic" | "boost";
}

interface Task {
  id: string;
  title: string;
  description: string;
  points: number;
  category: "beginner" | "intermediate" | "advanced";
}

export const AdminPanel = () => {
  const { toast } = useToast();
  
  const [rewards, setRewards] = useState<Reward[]>([
    { id: "1", name: "Dodatkowa obecność", description: "Zapisz obecność za dowolne zajęcia", cost: 100, type: "attendance" },
    { id: "2", name: "Złote ucho wiewiórki", description: "Ekskluzywny dodatek do Twojego towarzysza", cost: 75, type: "cosmetic" },
    { id: "3", name: "Bonus czasowy", description: "2x punkty przez 24 godziny", cost: 50, type: "boost" },
  ]);

  const [tasks, setTasks] = useState<Task[]>([
    { id: "1", title: "Zaloguj się do Wikamp", description: "Pierwszy krok do nauki", points: 10, category: "beginner" },
    { id: "2", title: "Przejdź do podglądu przedmiotu", description: "Kliknij przycisk Podgląd", points: 15, category: "beginner" },
    { id: "3", title: "Ukończ pierwszą lekcję", description: "Obejrzyj materiał z wybranego kursu", points: 25, category: "intermediate" },
  ]);

  // Reward form state
  const [newReward, setNewReward] = useState<Omit<Reward, "id">>({
    name: "", description: "", cost: 0, type: "cosmetic"
  });
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [rewardDialogOpen, setRewardDialogOpen] = useState(false);

  // Task form state
  const [newTask, setNewTask] = useState<Omit<Task, "id">>({
    title: "", description: "", points: 0, category: "beginner"
  });
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);

  // Reward handlers
  const handleAddReward = () => {
    if (!newReward.name || !newReward.description || newReward.cost <= 0) {
      toast({ title: "Błąd", description: "Wypełnij wszystkie pola", variant: "destructive" });
      return;
    }
    const reward: Reward = { ...newReward, id: Date.now().toString() };
    setRewards([...rewards, reward]);
    setNewReward({ name: "", description: "", cost: 0, type: "cosmetic" });
    setRewardDialogOpen(false);
    toast({ title: "Sukces!", description: "Dodano nową nagrodę" });
  };

  const handleEditReward = () => {
    if (!editingReward) return;
    setRewards(rewards.map(r => r.id === editingReward.id ? editingReward : r));
    setEditingReward(null);
    toast({ title: "Sukces!", description: "Nagroda została zaktualizowana" });
  };

  const handleDeleteReward = (id: string) => {
    setRewards(rewards.filter(r => r.id !== id));
    toast({ title: "Usunięto", description: "Nagroda została usunięta" });
  };

  // Task handlers
  const handleAddTask = () => {
    if (!newTask.title || !newTask.description || newTask.points <= 0) {
      toast({ title: "Błąd", description: "Wypełnij wszystkie pola", variant: "destructive" });
      return;
    }
    const task: Task = { ...newTask, id: Date.now().toString() };
    setTasks([...tasks, task]);
    setNewTask({ title: "", description: "", points: 0, category: "beginner" });
    setTaskDialogOpen(false);
    toast({ title: "Sukces!", description: "Dodano nowe zadanie" });
  };

  const handleEditTask = () => {
    if (!editingTask) return;
    setTasks(tasks.map(t => t.id === editingTask.id ? editingTask : t));
    setEditingTask(null);
    toast({ title: "Sukces!", description: "Zadanie zostało zaktualizowane" });
  };

  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
    toast({ title: "Usunięto", description: "Zadanie zostało usunięte" });
  };

  const getTypeLabel = (type: Reward["type"]) => {
    switch (type) {
      case "attendance": return "Edukacja";
      case "cosmetic": return "Wygląd";
      case "boost": return "Wzmocnienie";
    }
  };

  const getCategoryLabel = (category: Task["category"]) => {
    switch (category) {
      case "beginner": return "Łatwe";
      case "intermediate": return "Średnie";
      case "advanced": return "Trudne";
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-b from-card to-background border-2 border-primary/10">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-primary/10 rounded-xl">
          <Settings className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Panel Administratora</h2>
      </div>

      <Tabs defaultValue="rewards" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="rewards" className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            Nagrody
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <ListTodo className="w-4 h-4" />
            Zadania
          </TabsTrigger>
        </TabsList>

        {/* Rewards Tab */}
        <TabsContent value="rewards" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Zarządzaj nagrodami</h3>
            <Dialog open={rewardDialogOpen} onOpenChange={setRewardDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" /> Dodaj nagrodę
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Dodaj nową nagrodę</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label>Nazwa</Label>
                    <Input 
                      value={newReward.name} 
                      onChange={e => setNewReward({...newReward, name: e.target.value})}
                      placeholder="Nazwa nagrody"
                    />
                  </div>
                  <div>
                    <Label>Opis</Label>
                    <Input 
                      value={newReward.description} 
                      onChange={e => setNewReward({...newReward, description: e.target.value})}
                      placeholder="Opis nagrody"
                    />
                  </div>
                  <div>
                    <Label>Koszt (punkty)</Label>
                    <Input 
                      type="number" 
                      value={newReward.cost} 
                      onChange={e => setNewReward({...newReward, cost: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <Label>Typ</Label>
                    <Select value={newReward.type} onValueChange={(v: Reward["type"]) => setNewReward({...newReward, type: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="attendance">Edukacja</SelectItem>
                        <SelectItem value="cosmetic">Wygląd</SelectItem>
                        <SelectItem value="boost">Wzmocnienie</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAddReward} className="w-full">Dodaj</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-3">
            {rewards.map(reward => (
              <Card key={reward.id} className="p-4 flex items-center justify-between">
                {editingReward?.id === reward.id ? (
                  <div className="flex-1 grid grid-cols-4 gap-2 mr-4">
                    <Input value={editingReward.name} onChange={e => setEditingReward({...editingReward, name: e.target.value})} />
                    <Input value={editingReward.description} onChange={e => setEditingReward({...editingReward, description: e.target.value})} />
                    <Input type="number" value={editingReward.cost} onChange={e => setEditingReward({...editingReward, cost: parseInt(e.target.value) || 0})} />
                    <Button onClick={handleEditReward} size="sm">Zapisz</Button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{reward.name}</span>
                        <Badge variant="outline">{getTypeLabel(reward.type)}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{reward.description}</p>
                      <span className="text-sm font-bold text-primary">{reward.cost} pkt</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" onClick={() => setEditingReward(reward)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDeleteReward(reward.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Zarządzaj zadaniami</h3>
            <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" /> Dodaj zadanie
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Dodaj nowe zadanie</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label>Tytuł</Label>
                    <Input 
                      value={newTask.title} 
                      onChange={e => setNewTask({...newTask, title: e.target.value})}
                      placeholder="Tytuł zadania"
                    />
                  </div>
                  <div>
                    <Label>Opis</Label>
                    <Input 
                      value={newTask.description} 
                      onChange={e => setNewTask({...newTask, description: e.target.value})}
                      placeholder="Opis zadania"
                    />
                  </div>
                  <div>
                    <Label>Punkty</Label>
                    <Input 
                      type="number" 
                      value={newTask.points} 
                      onChange={e => setNewTask({...newTask, points: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <Label>Kategoria</Label>
                    <Select value={newTask.category} onValueChange={(v: Task["category"]) => setNewTask({...newTask, category: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Łatwe</SelectItem>
                        <SelectItem value="intermediate">Średnie</SelectItem>
                        <SelectItem value="advanced">Trudne</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAddTask} className="w-full">Dodaj</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-3">
            {tasks.map(task => (
              <Card key={task.id} className="p-4 flex items-center justify-between">
                {editingTask?.id === task.id ? (
                  <div className="flex-1 grid grid-cols-4 gap-2 mr-4">
                    <Input value={editingTask.title} onChange={e => setEditingTask({...editingTask, title: e.target.value})} />
                    <Input value={editingTask.description} onChange={e => setEditingTask({...editingTask, description: e.target.value})} />
                    <Input type="number" value={editingTask.points} onChange={e => setEditingTask({...editingTask, points: parseInt(e.target.value) || 0})} />
                    <Button onClick={handleEditTask} size="sm">Zapisz</Button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{task.title}</span>
                        <Badge variant="outline">{getCategoryLabel(task.category)}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                      <span className="text-sm font-bold text-primary">+{task.points} pkt</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" onClick={() => setEditingTask(task)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDeleteTask(task.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};
