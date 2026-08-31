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

export interface Habit {
  id: string;
  name: string;
  description: string | null;
  frequency: HabitFrequency;
  color: string;
  icon: string;
  active: boolean;
  createdAt: string;
}

export interface CreateHabitRequest {
  name: string;
  description?: string;
  frequency?: HabitFrequency;
  color?: string;
  icon?: string;
}

export interface UpdateHabitRequest {
  name?: string;
  description?: string | null;
  frequency?: HabitFrequency;
  color?: string;
  icon?: string;
  active?: boolean;
}
