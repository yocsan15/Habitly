import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { habits, habitLogs } from "../db/schema/index.js";
import type { Habit, HabitLog } from "shared-types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return toDateStr(date);
}

function completedDates(logs: { date: string }[]): string[] {
  return logs.map((l) => l.date);
}

function serializeLog(log: typeof habitLogs.$inferSelect): HabitLog {
  return {
    id: log.id,
    habitId: log.habitId,
    date: log.date,
    createdAt: log.createdAt.toISOString(),
  };
}

function computeStreak(
  habit: { frequency: string },
  dates: string[],
  today: string,
): number {
  const set = new Set(dates);

  if (habit.frequency === "daily") {
    let streak = 0;
    let cursor = today;
    if (!set.has(cursor)) {
      cursor = addDays(today, -1);
    }
    while (set.has(cursor)) {
      streak += 1;
      cursor = addDays(cursor, -1);
    }
    return streak;
  }

  // weekly / custom: racha se cuenta por semanas consecutivas completadas
  let streak = 0;
  let cursor = today;
  if (!set.has(cursor)) {
    cursor = addDays(today, -1);
  }
  while (set.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -7);
  }
  return streak;
}

function computeLongestStreak(
  habit: { frequency: string },
  dates: string[],
): number {
  const set = new Set(dates);
  if (set.size === 0) return 0;

  const sorted = [...set].sort();
  const step = habit.frequency === "daily" ? 1 : 7;

  let longest = 0;
  let current = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (addDays(sorted[i - 1], step) === sorted[i]) {
      current += 1;
    } else {
      longest = Math.max(longest, current);
      current = 1;
    }
  }
  return Math.max(longest, current);
}

function computeCompletionRate(
  row: typeof habits.$inferSelect,
  dates: string[],
  today: string,
): number {
  const created = toDateStr(row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt));
  if (created > today) return 0;

  let possible = 1;
  let cursor = created;
  while (cursor < today) {
    possible += 1;
    cursor = addDays(cursor, 1);
  }
  if (possible <= 0) return 0;
  return Math.min(100, Math.round((dates.length / possible) * 100));
}

async function logsFor(habitId: string): Promise<typeof habitLogs.$inferSelect[]> {
  return db
    .select()
    .from(habitLogs)
    .where(eq(habitLogs.habitId, habitId));
}

async function attachLogs(
  rows: typeof habits.$inferSelect[],
  today: string,
): Promise<Habit[]> {
  return Promise.all(
    rows.map(async (row) => {
      const logs = await logsFor(row.id);
      const dates = completedDates(logs);
      const todayDone = dates.includes(today);
      const lastLogDate = logs.length
        ? [...logs].sort((a, b) => (a.date < b.date ? 1 : -1))[0].date
        : null;
      const weekLogs = logs
        .filter((l) => l.date >= addDays(today, -6) && l.date <= today)
        .map(serializeLog);
      const streak = computeStreak(row, dates, today);
      const logDates = [...dates].sort();
      return {
        id: row.id,
        name: row.name,
        description: row.description,
        frequency: row.frequency,
        color: row.color,
        icon: row.icon,
        active: row.active,
        createdAt: row.createdAt.toISOString(),
        streak,
        todayDone,
        lastLogDate,
        weekLogs,
        logDates,
        weeklyGoal: row.weeklyGoal ?? null,
        streakGoal: row.streakGoal ?? null,
        longestStreak: computeLongestStreak(row, dates),
        completionRate: computeCompletionRate(row, dates, today),
      };
    }),
  );
}

export async function listHabitsWithLogs(
  userId: string,
  today: string,
): Promise<Habit[]> {
  const rows = await db
    .select()
    .from(habits)
    .where(and(eq(habits.userId, userId), eq(habits.active, true)))
    .orderBy(habits.createdAt);
  return attachLogs(rows, today);
}

export async function getHabitWithLogs(
  userId: string,
  habitId: string,
  today: string,
): Promise<Habit | null> {
  const rows = await db
    .select()
    .from(habits)
    .where(and(eq(habits.id, habitId), eq(habits.userId, userId)));
  if (!rows[0]) {
    return null;
  }
  const [result] = await attachLogs([rows[0]], today);
  return result;
}

export async function toggleLog(userId: string, habitId: string, date: string) {
  const habit = await db
    .select()
    .from(habits)
    .where(and(eq(habits.id, habitId), eq(habits.userId, userId)))
    .limit(1);
  if (!habit[0]) {
    return { ok: false as const, reason: "not_found" as const };
  }

  const existing = await db
    .select({ id: habitLogs.id })
    .from(habitLogs)
    .where(and(eq(habitLogs.habitId, habitId), eq(habitLogs.date, date)))
    .limit(1);

  if (existing[0]) {
    await db
      .delete(habitLogs)
      .where(and(eq(habitLogs.habitId, habitId), eq(habitLogs.date, date)));
    return { ok: true as const, action: "removed" as const };
  }

  await db.insert(habitLogs).values({ habitId, date });
  return { ok: true as const, action: "added" as const };
}

export function todayDateStr(offsetMinutes: number): string {
  const shifted = new Date(Date.now() + offsetMinutes * 60000);
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const d = String(shifted.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
