import { getToken, clearToken } from "./auth";
import type { AuthResponse, CreateHabitRequest, UpdateHabitRequest, Habit } from "shared-types";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001";

export const AUTH_UNAUTHORIZED_EVENT = "auth:unauthorized";

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = await getToken();

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 401) {
    await clearToken();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
    }
  }

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message =
      data?.message ?? data?.error ?? `Error ${response.status}`;
    if (response.status === 401) {
      throw new Error("Sesión expirada. Inicia sesión de nuevo.");
    }
    throw new Error(message);
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
  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    api<{ ok: boolean }>("/auth/change-password", { method: "POST", body }),
  health: () => api<{ status: string; userId: string }>("/health/protected"),

  listHabits: () => api<Habit[]>("/habits"),
  getHabit: (id: string) => api<Habit>(`/habits/${id}`),
  createHabit: (body: CreateHabitRequest) =>
    api<Habit>("/habits", { method: "POST", body }),
  updateHabit: (id: string, body: UpdateHabitRequest) =>
    api<Habit>(`/habits/${id}`, { method: "PUT", body }),
  deleteHabit: (id: string) =>
    api<void>(`/habits/${id}`, { method: "DELETE" }),
  toggleLog: (
    id: string,
    date: string,
    timezoneOffset: number,
    extra?: { note?: string | null; quantity?: number | null },
  ) =>
    api<{ action: string }>(`/habits/${id}/log`, {
      method: "POST",
      body: { date, timezoneOffset, ...extra },
    }),
  patchLog: (
    id: string,
    date: string,
    patch: { note?: string | null; quantity?: number | null },
  ) => api<{ ok: boolean }>(`/habits/${id}/log`, {
    method: "PATCH",
    body: { date, ...patch },
  }),
  reorderHabits: (ids: string[]) =>
    api<{ ok: boolean }>("/habits/reorder", {
      method: "POST",
      body: { ids },
    }),
};

export { API_URL };
