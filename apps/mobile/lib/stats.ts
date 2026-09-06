import type { Habit } from "shared-types";

export interface ReportEntry {
  habit: Habit;
  done: number;
  total: number;
  pct: number;
}

export interface Report {
  days: number;
  entries: ReportEntry[];
  overallPct: number;
  bestHabit: ReportEntry | null;
  totalDone: number;
}

function dateOffsetIso(daysAgo: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function monthStartIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function monthDays(today: Date): number {
  return new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
}

export function buildReport(habits: Habit[], period: "week" | "month"): Report {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = period === "week" ? 7 : monthDays(today);
  const startIso = period === "week" ? dateOffsetIso(6) : monthStartIso();

  const entries: ReportEntry[] = habits.map((h) => {
    const inPeriod = h.logDates.filter((d) => d >= startIso);
    const done = inPeriod.length;
    const total = period === "week" ? 7 : days;
    const pct = Math.min(100, Math.round((done / total) * 100));
    return { habit: h, done, total, pct };
  });

  const totalDone = entries.reduce((s, e) => s + e.done, 0);
  const totalPossible = entries.reduce((s, e) => s + e.total, 0);
  const overallPct = totalPossible === 0 ? 0 : Math.min(100, Math.round((totalDone / totalPossible) * 100));
  const bestHabit = entries.reduce<ReportEntry | null>(
    (best, e) => (!best || e.pct > best.pct ? e : best),
    null,
  );

  return { days, entries, overallPct, bestHabit, totalDone };
}

export function isDateInCurrentWeek(date: string): boolean {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay();
  return date >= dateOffsetIso(dow) && date <= dateOffsetIso(-(6 - dow));
}

export function isDateInCurrentMonth(date: string): boolean {
  return date >= monthStartIso() && date <= dateOffsetIso(0);
}

export interface TrendPoint {
  date: string;
  done: boolean;
}

export function weekTrend(habit: Habit, weeks: number): TrendPoint[][] {
  const doneSet = new Set(habit.logDates);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const dow = now.getDay();
  const end = now.getTime() - dow * 86400000; // domingo de esta semana
  const result: TrendPoint[][] = [];
  // ordenamos de la semana más antigua a la más nueva
  for (let w = weeks - 1; w >= 0; w--) {
    const weekStart = end - w * 7 * 86400000;
    const points: TrendPoint[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart + i * 86400000);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      points.push({ date: iso, done: doneSet.has(iso) });
    }
    result.push(points);
  }
  return result;
}

export function globalHeatmapDates(habits: Habit[]): string[] {
  const set = new Set<string>();
  for (const h of habits) {
    for (const d of h.logDates) set.add(d);
  }
  return [...set].sort();
}

export function mergedVolume(habits: Habit[]): string[] {
  const set = new Set<string>();
  return [...set].length ? [] : [];
}