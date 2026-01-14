import usersData from "@/data/users.json";

export interface GameRecords {
  icyTower: number;
  cupGame: number;
}

export interface User {
  id: string;
  name: string;
  role: "user" | "moderator" | "admin";
  points: number;
  gameRecords: GameRecords;
  tasksCompleted: number;
}

export interface UsersDatabase {
  users: User[];
}

// Initialize from JSON and localStorage
const initializeUsers = (): User[] => {
  const storedData = localStorage.getItem("usersDatabase");
  if (storedData) {
    try {
      const parsed = JSON.parse(storedData);
      return parsed.users;
    } catch {
      return usersData.users as User[];
    }
  }
  return usersData.users as User[];
};

let users: User[] = initializeUsers();

const saveToStorage = () => {
  localStorage.setItem("usersDatabase", JSON.stringify({ users }));
};

export const getUsers = (): User[] => {
  return [...users];
};

export const getCurrentUser = (): User => {
  return users.find(u => u.id === "current") || users[users.length - 1];
};

export const updateCurrentUserPoints = (points: number): void => {
  const userIndex = users.findIndex(u => u.id === "current");
  if (userIndex !== -1) {
    users[userIndex].points = points;
    saveToStorage();
  }
};

export const updateCurrentUserGameRecord = (game: keyof GameRecords, score: number): void => {
  const userIndex = users.findIndex(u => u.id === "current");
  if (userIndex !== -1) {
    if (score > users[userIndex].gameRecords[game]) {
      users[userIndex].gameRecords[game] = score;
      saveToStorage();
    }
  }
};

export const incrementTasksCompleted = (): void => {
  const userIndex = users.findIndex(u => u.id === "current");
  if (userIndex !== -1) {
    users[userIndex].tasksCompleted += 1;
    saveToStorage();
  }
};

export const getLeaderboard = (): (User & { rank: number; totalScore: number })[] => {
  const sortedUsers = [...users]
    .map(user => ({
      ...user,
      totalScore: user.gameRecords.icyTower + (user.gameRecords.cupGame * 100),
      rank: 0
    }))
    .sort((a, b) => b.totalScore - a.totalScore);

  return sortedUsers.map((user, index) => ({
    ...user,
    rank: index + 1
  }));
};

export const resetDatabase = (): void => {
  users = usersData.users as User[];
  localStorage.removeItem("usersDatabase");
};
