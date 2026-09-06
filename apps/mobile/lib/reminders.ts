import { Platform } from "react-native";
import type { Habit } from "shared-types";

const isWeb = Platform.OS === "web";
const KEY = "habitly_reminders_dismissed";
const NOTIF_ICON_DATE = "habitly_reminder_notified";

type ReminderMap = Record<string, string | null>;

function getDismissed(): ReminderMap {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "{}");
  } catch {
    return {};
  }
}

function setDismissed(map: ReminderMap) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    // ignorar
  }
}

export async function requestNotificationPermission(): Promise<
  "granted" | "denied" | "default"
> {
  if (!isWeb || typeof window === "undefined" || !("Notification" in window)) {
    return "default";
  }
  const permission = await Notification.requestPermission();
  return permission;
}

export function notificationsSupported(): boolean {
  return isWeb && typeof window !== "undefined" && "Notification" in window;
}

export async function sendReminder(habit: Habit): Promise<boolean> {
  if (!notificationsSupported()) return false;
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;

  const today = new Date().toISOString().slice(0, 10);
  const notifiedKey = `${habit.id}_${today}`;

  if (typeof window !== "undefined") {
    try {
      const map = JSON.parse(window.localStorage.getItem(NOTIF_ICON_DATE) ?? "{}");
      if (map[notifiedKey]) return false;
      map[notifiedKey] = true;
      window.localStorage.setItem(NOTIF_ICON_DATE, JSON.stringify(map));
    } catch {
      // ignorar
    }
  }

  const title = `⏰ ${habit.icon} ${habit.name}`;
  const body = habit.todayDone
    ? "Ya lo marcaste hoy. ¡Buen trabajo!"
    : habit.description
      ? `Anímate: ${habit.description}`
      : "Es hora de registrar tu constancia de hoy.";
  if (typeof window === "undefined") return false;
  const notif = new Notification(title, { body });
  notif.onclick = () => window.focus();
  return true;
}

let intervalId: ReturnType<typeof setInterval> | null = null;
let runningHabits: Map<string, string | null> = new Map();

function matchesTime(hour: number, minute: number, reminderTime: string | null): boolean {
  if (!reminderTime) return false;
  const [h, m] = reminderTime.split(":").map(Number);
  return hour === h && minute === m;
}

export function startReminderScheduler(habits: Habit[]) {
  const nextMap = new Map(habits.map((h) => [h.id, h.reminderTime]));
  const changed =
    nextMap.size !== runningHabits.size ||
    habits.some((h) => runningHabits.get(h.id) !== h.reminderTime);
  runningHabits = nextMap;

  if (!changed && intervalId) {
    return intervalId;
  }

  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }

  if (habits.some((h) => h.reminderTime)) {
    intervalId = setInterval(() => {
      const now = new Date();
      for (const h of habits) {
        if (h.reminderTime && matchesTime(now.getHours(), now.getMinutes(), h.reminderTime)) {
          sendReminder(h).catch(() => {
            // ignorar errores de notificación
          });
        }
      }
    }, 30000);
  }

  return intervalId;
}

export function stopReminderScheduler() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

export function dismissReminder(habitId: string): void {
  const map = getDismissed();
  map[habitId] = null;
  setDismissed(map);
}

export async function ensurePermission(): Promise<void> {
  if (typeof window !== "undefined" && "Notification" in window) {
    await requestNotificationPermission();
  }
}