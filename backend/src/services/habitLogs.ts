import { eq, and, desc } from "drizzle-orm";
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

function toNum(value: string | null): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function serializeLog(log: typeof habitLogs.$inferSelect): HabitLog {
  return {
    id: log.id,
    habitId: log.habitId,
    date: log.date,
    createdAt: log.createdAt.toISOString(),
    note: log.note ?? null,
    quantity: toNum(log.quantity),
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

function monthPrefix(dateStr: string): string {
  return dateStr.slice(0, 7);
}

function computeMonthlyMetrics(
  logs: typeof habitLogs.$inferSelect[],
  today: string,
  monthlyGoal: number | null,
  volumeGoal: number | null,
): { monthlyCount: number; monthlyVolume: number } {
  const prefix = monthPrefix(today);
  const inMonth = logs.filter((l) => l.date.startsWith(prefix));
  const monthlyCount = inMonth.length;
  const monthlyVolume = inMonth.reduce((sum, l) => {
    const v = toNum(l.quantity);
    return sum + (v ?? 1);
  }, 0);
  // si no hay meta de volumen, el volumen mensual solo suma cantidades explícitas
  if (!volumeGoal) {
    return { monthlyCount, monthlyVolume: inMonth.reduce((sum, l) => sum + (toNum(l.quantity) ?? 0), 0) };
  }
  return { monthlyCount, monthlyVolume };
}

async function logsFor(habitId: string): Promise<typeof habitLogs.$inferSelect[]> {
  return db
    .select()
    .from(habitLogs)
    .where(eq(habitLogs.habitId, habitId))
    .orderBy(desc(habitLogs.date));
}

async function attachLogs(
  rows: typeof habits.$inferSelect[],
  today: string,
): Promise<Habit[]> {
  return Promise.all(
    rows.map(async (row) => {
      const logs = await logsFor(row.id);
      const dates = logs.map((l) => l.date);
      const todayDone = dates.includes(today);
      const lastLog = logs[0];
      const weekLogs = logs
        .filter((l) => l.date >= addDays(today, -6) && l.date <= today)
        .map(serializeLog);
      const streak = computeStreak(row, dates, today);
      const logDates = [...dates].sort();
      const { monthlyCount, monthlyVolume } = computeMonthlyMetrics(
        logs,
        today,
        row.monthlyGoal,
        row.volumeGoal !== null ? toNum(row.volumeGoal) : null,
      );
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
        lastLogDate: lastLog?.date ?? null,
        weekLogs,
        logDates,
        allLogs: logs.map(serializeLog),
        weeklyGoal: row.weeklyGoal ?? null,
        streakGoal: row.streakGoal ?? null,
        monthlyGoal: row.monthlyGoal ?? null,
        volumeGoal: row.volumeGoal !== null ? toNum(row.volumeGoal) : null,
        volumeUnit: row.volumeUnit ?? null,
        reminderTime: row.reminderTime ?? null,
        longestStreak: computeLongestStreak(row, dates),
        completionRate: computeCompletionRate(row, dates, today),
        monthlyCount,
        monthlyVolume,
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
    .orderBy(habits.position, habits.createdAt);
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

export async function toggleLog(
  userId: string,
  habitId: string,
  date: string,
  note?: string | null,
  quantity?: number | null,
) {
  const habit = await db
    .select()
    .from(habits)
    .where(and(eq(habits.id, habitId), eq(habits.userId, userId)))
    .limit(1);
  if (!habit[0]) {
    return { ok: false as const, reason: "not_found" as const };
  }

  const existing = await db
    .select()
    .from(habitLogs)
    .where(and(eq(habitLogs.habitId, habitId), eq(habitLogs.date, date)))
    .limit(1);

  if (existing[0]) {
    await db
      .delete(habitLogs)
      .where(and(eq(habitLogs.habitId, habitId), eq(habitLogs.date, date)));
    return { ok: true as const, action: "removed" as const };
  }

  await db.insert(habitLogs).values({
    habitId,
    date,
    note: note ?? null,
    quantity: quantity !== null && quantity !== undefined ? String(quantity) : null,
  });
  return { ok: true as const, action: "added" as const };
}

export async function updateLog(
  userId: string,
  habitId: string,
  date: string,
  patch: { note?: string | null; quantity?: number | null },
): Promise<{ ok: boolean; reason?: string }> {
  const habit = await db
    .select({ id: habits.id })
    .from(habits)
    .where(and(eq(habits.id, habitId), eq(habits.userId, userId)))
    .limit(1);
  if (!habit[0]) {
    return { ok: false, reason: "not_found" };
  }

  const existing = await db
    .select()
    .from(habitLogs)
    .where(and(eq(habitLogs.habitId, habitId), eq(habitLogs.date, date)))
    .limit(1);

  if (!existing[0]) {
    // crear el log si aún no existe (nota sin marcar el hábito como hecho)
    await db.insert(habitLogs).values({
      habitId,
      date,
      note: patch.note ?? null,
      quantity:
        patch.quantity !== null && patch.quantity !== undefined
          ? String(patch.quantity)
          : null,
    });
    return { ok: true };
  }

  await db
    .update(habitLogs)
    .set({
      ...(patch.note !== undefined ? { note: patch.note } : {}),
      ...(patch.quantity !== undefined
        ? { quantity: patch.quantity !== null ? String(patch.quantity) : null }
        : {}),
    })
    .where(eq(habitLogs.id, existing[0].id));

  return { ok: true };
}

export async function reorderHabits(
  userId: string,
  orderedIds: string[],
): Promise<boolean> {
  const rows = await db
    .select({ id: habits.id })
    .from(habits)
    .where(and(eq(habits.userId, userId), eq(habits.active, true)));

  const owned = new Set(rows.map((r) => r.id));
  const valid = orderedIds.filter((id) => owned.has(id));
  // añadir al final los que no vinieron
  for (const row of rows) {
    if (!valid.includes(row.id)) valid.push(row.id);
  }

  await Promise.all(
    valid.map((id, index) =>
      db
        .update(habits)
        .set({ position: index })
        .where(eq(habits.id, id)),
    ),
  );
  return true;
}

export function todayDateStr(offsetMinutes: number): string {
  const shifted = new Date(Date.now() + offsetMinutes * 60000);
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const d = String(shifted.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}