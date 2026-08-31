import { getToken } from "./auth";
import type { AuthResponse, CreateHabitRequest, UpdateHabitRequest, Habit } from "shared-types";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001";

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = await getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error ?? `Error ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const apiClient = {
  register: (body: { email: string; password: string }) =>
    api<AuthResponse>("/auth/register", { method: "POST", body }),
  login: (body: { email: string; password: string }) =>
    api<AuthResponse>("/auth/login", { method: "POST", body }),
  health: () => api<{ status: string; userId: string }>("/health/protected"),

  listHabits: () => api<Habit[]>("/habits"),
  getHabit: (id: string) => api<Habit>(`/habits/${id}`),
  createHabit: (body: CreateHabitRequest) =>
    api<Habit>("/habits", { method: "POST", body }),
  updateHabit: (id: string, body: UpdateHabitRequest) =>
    api<Habit>(`/habits/${id}`, { method: "PUT", body }),
  deleteHabit: (id: string) =>
    api<void>(`/habits/${id}`, { method: "DELETE" }),
};

export { API_URL };
