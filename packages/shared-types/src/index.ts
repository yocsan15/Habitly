export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiError {
  error: string;
}

export type HabitFrequency = "daily" | "weekly" | "custom";

export interface HabitLog {
  id: string;
  habitId: string;
  date: string;
  createdAt: string;
  note?: string | null;
  quantity?: number | null;
}

export interface Habit {
  id: string;
  name: string;
  description: string | null;
  frequency: HabitFrequency;
  color: string;
  icon: string;
  active: boolean;
  createdAt: string;
  streak: number;
  todayDone: boolean;
  lastLogDate: string | null;
  weekLogs: HabitLog[];
  logDates: string[];
  weeklyGoal: number | null;
  streakGoal: number | null;
  monthlyGoal: number | null;
  volumeGoal: number | null;
  volumeUnit: string | null;
  reminderTime: string | null;
  longestStreak: number;
  completionRate: number;
  monthlyCount: number;
  monthlyVolume: number;
  allLogs: HabitLog[];
}

export interface CreateHabitRequest {
  name: string;
  description?: string;
  frequency?: HabitFrequency;
  color?: string;
  icon?: string;
  weeklyGoal?: number | null;
  streakGoal?: number | null;
  monthlyGoal?: number | null;
  volumeGoal?: number | null;
  volumeUnit?: string | null;
  reminderTime?: string | null;
}

export interface UpdateHabitRequest {
  name?: string;
  description?: string | null;
  frequency?: HabitFrequency;
  color?: string;
  icon?: string;
  active?: boolean;
  weeklyGoal?: number | null;
  streakGoal?: number | null;
  monthlyGoal?: number | null;
  volumeGoal?: number | null;
  volumeUnit?: string | null;
  reminderTime?: string | null;
}
