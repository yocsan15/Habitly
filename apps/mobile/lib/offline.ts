import { Platform } from "react-native";
import { apiClient } from "./api";

const isWeb = Platform.OS === "web";
const QUEUE_KEY = "habitly_offline_queue";

export interface QueuedOp {
  id: string;
  type: "toggleLog" | "patchLog";
  habitId: string;
  date?: string;
  timezoneOffset?: number;
  patch?: { note?: string | null; quantity?: number | null };
  ts: number;
}

function loadQueue(): QueuedOp[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(QUEUE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveQueue(queue: QueuedOp[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // ignorar
  }
}

export function isOnline(): boolean {
  if (isWeb && typeof navigator !== "undefined") {
    return navigator.onLine;
  }
  return true;
}

async function flushQueue(): Promise<void> {
  const queue = loadQueue();
  if (queue.length === 0) return;

  const remaining: QueuedOp[] = [];
  for (const op of queue) {
    try {
      if (op.type === "toggleLog") {
        await apiClient.toggleLog(
          op.habitId,
          op.date ?? "",
          op.timezoneOffset ?? 0,
        );
      } else if (op.type === "patchLog") {
        await apiClient.patchLog(op.habitId, op.date ?? "", op.patch ?? {});
      }
    } catch {
      remaining.push(op);
    }
  }
  saveQueue(remaining);
}

async function enqueue(op: Omit<QueuedOp, "id" | "ts">): Promise<void> {
  if (isOnline()) {
    try {
      await flushQueue();
      if (op.type === "toggleLog") {
        await apiClient.toggleLog(
          op.habitId,
          op.date ?? "",
          op.timezoneOffset ?? 0,
          op.patch,
        );
      } else {
        await apiClient.patchLog(op.habitId, op.date ?? "", op.patch ?? {});
      }
      return;
    } catch (e) {
      // offline: cae en la cola
    }
  }
  const queue = loadQueue();
  // evitar duplicados por misma fecha en toggle
  const filtered = queue.filter(
    (q) => !(q.type === "toggleLog" && q.habitId === op.habitId && q.date === op.date),
  );
  filtered.push({ ...op, id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, ts: Date.now() });
  saveQueue(filtered);
}

export async function toggleLogOffline(
  habitId: string,
  date: string,
  timezoneOffset: number,
): Promise<{ action: string } | { queued: true }> {
  const online = isOnline();
  await enqueue({ type: "toggleLog", habitId, date, timezoneOffset });
  if (online) {
    return { action: "synced" };
  }
  return { queued: true };
}

export async function patchLogOffline(
  habitId: string,
  date: string,
  patch: { note?: string | null; quantity?: number | null },
): Promise<void> {
  await enqueue({ type: "patchLog", habitId, date, patch });
}

export function pendingCount(): number {
  return loadQueue().length;
}

export function initSyncOnReconnect(onSynced: () => void): void {
  if (!isWeb || typeof window === "undefined") return;
  const handle = () => {
    flushQueue().then(() => {
      onSynced();
    });
  };
  window.addEventListener("online", handle);
  window.addEventListener("offline", () => onSynced());
}

export async function syncNow(): Promise<number> {
  const pending = pendingCount();
  await flushQueue();
  return pending;
}