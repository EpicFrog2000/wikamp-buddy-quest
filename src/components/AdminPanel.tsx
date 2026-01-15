import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingBag, ListTodo, Plus, Trash2, Edit2, Settings, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdminRewards, AdminReward } from "@/hooks/useAdminRewards";
import { useAdminTasks, AdminTask } from "@/hooks/useAdminTasks";

export const AdminPanel = () => {
  const { toast } = useToast();
  
  const { rewards, loading: rewardsLoading, addReward, updateReward, deleteReward } = useAdminRewards();
  const { tasks, loading: tasksLoading, addTask, updateTask, deleteTask } = useAdminTasks();

  // Reward form state
  const [newReward, setNewReward] = useState<Omit<AdminReward, "id">>({
    name: "", description: "", cost: 0, type: "cosmetic", effect_type: null, effect_value: null
  });
  const [editingReward, setEditingReward] = useState<AdminReward | null>(null);
  const [rewardDialogOpen, setRewardDialogOpen] = useState(false);

  // Task form state
  const [newTask, setNewTask] = useState<Omit<AdminTask, "id" | "is_active">>({
    title: "", description: "", points: 0, category: "beginner"
  });
  const [editingTask, setEditingTask] = useState<AdminTask | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);

  // Reward handlers
  const handleAddReward = async () => {
    if (!newReward.name || !newReward.description || newReward.cost <= 0) {
      toast({ title: "Błąd", description: "Wypełnij wszystkie pola", variant: "destructive" });
      return;
    }
    const result = await addReward(newReward);
    if (result.success) {
      setNewReward({ name: "", description: "", cost: 0, type: "cosmetic", effect_type: null, effect_value: null });
      setRewardDialogOpen(false);
      toast({ title: "Sukces!", description: "Dodano nową nagrodę" });
    } else {
      toast({ title: "Błąd", description: "Nie udało się dodać nagrody", variant: "destructive" });
    }
  };

  const handleEditReward = async () => {
    if (!editingReward) return;
    const success = await updateReward(editingReward.id, editingReward);
    if (success) {
      setEditingReward(null);
      toast({ title: "Sukces!", description: "Nagroda została zaktualizowana" });
    } else {
      toast({ title: "Błąd", description: "Nie udało się zaktualizować nagrody", variant: "destructive" });
    }
  };

  const handleDeleteReward = async (id: string) => {
    const success = await deleteReward(id);
    if (success) {
      toast({ title: "Usunięto", description: "Nagroda została usunięta" });
    } else {
      toast({ title: "Błąd", description: "Nie udało się usunąć nagrody", variant: "destructive" });
    }
  };

  // Task handlers
  const handleAddTask = async () => {
    if (!newTask.title || !newTask.description || newTask.points <= 0) {
      toast({ title: "Błąd", description: "Wypełnij wszystkie pola", variant: "destructive" });
      return;
    }
    const result = await addTask(newTask);
    if (result.success) {
      setNewTask({ title: "", description: "", points: 0, category: "beginner" });
      setTaskDialogOpen(false);
      toast({ title: "Sukces!", description: "Dodano nowe zadanie" });
    } else {
      toast({ title: "Błąd", description: "Nie udało się dodać zadania", variant: "destructive" });
    }
  };

  const handleEditTask = async () => {
    if (!editingTask) return;
    const success = await updateTask(editingTask.id, editingTask);
    if (success) {
      setEditingTask(null);
      toast({ title: "Sukces!", description: "Zadanie zostało zaktualizowane" });
    } else {
      toast({ title: "Błąd", description: "Nie udało się zaktualizować zadania", variant: "destructive" });
    }
  };

  const handleDeleteTask = async (id: string) => {
    const success = await deleteTask(id);
    if (success) {
      toast({ title: "Usunięto", description: "Zadanie zostało usunięte" });
    } else {
      toast({ title: "Błąd", description: "Nie udało się usunąć zadania", variant: "destructive" });
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "attendance": return "Edukacja";
      case "cosmetic": return "Wygląd";
      case "boost": return "Wzmocnienie";
      default: return type;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "beginner": return "Łatwe";
      case "intermediate": return "Średnie";
      case "advanced": return "Trudne";
      default: return category;
    }
  };

  const isLoading = rewardsLoading || tasksLoading;

  if (isLoading) {
    return (
      <Card className="p-6 bg-gradient-to-b from-card to-background border-2 border-primary/10 flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </Card>
    );
  }

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
                    <Select value={newReward.type} onValueChange={(v: "attendance" | "cosmetic" | "boost") => setNewReward({...newReward, type: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="attendance">Edukacja</SelectItem>
                        <SelectItem value="cosmetic">Wygląd</SelectItem>
                        <SelectItem value="boost">Wzmocnienie</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Efekt</Label>
                    <Select 
                      value={newReward.effect_type || "none"} 
                      onValueChange={(v) => setNewReward({...newReward, effect_type: v === "none" ? null : v})}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Brak efektu</SelectItem>
                        <SelectItem value="bonus_points">Bonus punktów</SelectItem>
                        <SelectItem value="companion_happiness">Szczęście wiewiórki</SelectItem>
                        <SelectItem value="companion_hunger">Głód wiewiórki</SelectItem>
                        <SelectItem value="companion_energy">Energia wiewiórki</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {newReward.effect_type && (
                    <div>
                      <Label>Wartość efektu</Label>
                      <Input 
                        type="number" 
                        value={newReward.effect_value || 0} 
                        onChange={e => setNewReward({...newReward, effect_value: parseInt(e.target.value) || 0})}
                      />
                    </div>
                  )}
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
                        {reward.effect_type && (
                          <Badge variant="secondary" className="text-xs">
                            {reward.effect_type === 'bonus_points' ? `+${reward.effect_value} pkt` : `+${reward.effect_value}`}
                          </Badge>
                        )}
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
                    <Select value={newTask.category} onValueChange={(v: "beginner" | "intermediate" | "advanced") => setNewTask({...newTask, category: v})}>
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
