import type { Habit } from "shared-types";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  max: number;
}

const totalLogs = (habits: Habit[]) => habits.reduce((s, h) => s + h.logDates.length, 0);
const activeHabits = (habits: Habit[]) => habits.filter((h) => h.active).length;
const bestStreak = (habits: Habit[]) =>
  habits.reduce((m, h) => Math.max(m, h.longestStreak), 0);
const bestCompletion = (habits: Habit[]) =>
  habits.reduce((m, h) => Math.max(m, h.completionRate), 0);
const totalWeeksDone = (habits: Habit[]) =>
  habits.reduce((s, h) => s + (h.logDates.length > 0 ? 1 : 0), 0);

export function computeAchievements(habits: Habit[]): Achievement[] {
  const logs = totalLogs(habits);
  const active = activeHabits(habits);
  const streak = bestStreak(habits);
  const completion = bestCompletion(habits);

  const list: Achievement[] = [
    {
      id: "first",
      name: "Primer paso",
      description: "Registra un día de constancia",
      icon: "🌱",
      unlocked: logs >= 1,
      progress: Math.min(logs, 1),
      max: 1,
    },
    {
      id: "habit_count",
      name: "Coleccionista",
      description: "Ten 3 hábitos activos",
      icon: "🗂️",
      unlocked: active >= 3,
      progress: Math.min(active, 3),
      max: 3,
    },
    {
      id: "logs_10",
      name: "Tomando vuelo",
      description: "Acumula 10 registros",
      icon: "🛫",
      unlocked: logs >= 10,
      progress: Math.min(logs, 10),
      max: 10,
    },
    {
      id: "logs_50",
      name: "Constancia real",
      description: "Acumula 50 registros",
      icon: "🏅",
      unlocked: logs >= 50,
      progress: Math.min(logs, 50),
      max: 50,
    },
    {
      id: "logs_200",
      name: "Máquina de hábitos",
      description: "Acumula 200 registros",
      icon: "🤖",
      unlocked: logs >= 200,
      progress: Math.min(logs, 200),
      max: 200,
    },
    {
      id: "streak_7",
      name: "Semana impecable",
      description: "Alcanza 7 días de racha",
      icon: "🔥",
      unlocked: streak >= 7,
      progress: Math.min(streak, 7),
      max: 7,
    },
    {
      id: "streak_30",
      name: "Mes indestructible",
      description: "Alcanza 30 días de racha",
      icon: "🧱",
      unlocked: streak >= 30,
      progress: Math.min(streak, 30),
      max: 30,
    },
    {
      id: "streak_100",
      name: "Leyenda",
      description: "Alcanza 100 días de racha",
      icon: "👑",
      unlocked: streak >= 100,
      progress: Math.min(streak, 100),
      max: 100,
    },
    {
      id: "completion_80",
      name: "Cumplidor",
      description: "Llega al 80% de cumplimiento en un hábito",
      icon: "🎯",
      unlocked: completion >= 80,
      progress: Math.min(Math.round(completion), 100),
      max: 80,
    },
    {
      id: "completion_100",
      name: "Impecable",
      description: "Llega al 100% de cumplimiento en algún hábito",
      icon: "💎",
      unlocked: completion >= 100,
      progress: Math.min(Math.round(completion), 100),
      max: 100,
    },
    {
      id: "multi_habit",
      name: "Variedad",
      description: "Ten 5 hábitos activos a la vez",
      icon: "🎪",
      unlocked: active >= 5,
      progress: Math.min(active, 5),
      max: 5,
    },
    {
      id: "weekly_goal",
      name: "Meta semanal",
      description: "Cumple la meta semanal de un hábito",
      icon: "📅",
      unlocked: habits.some((h) => h.weeklyGoal && h.logDates.length >= 7 && h.completionRate >= 80),
      progress: 0,
      max: 1,
    },
    {
      id: "notes",
      name: "Reflexivo",
      description: "Escribe una nota en un hábito",
      icon: "📝",
      unlocked: habits.some((h) => h.allLogs.some((l) => l.note)),
      progress: 0,
      max: 1,
    },
  ];

  // logro de relleno: completar semana con plan semanal
  list.push({
    id: "weeks_done",
    name: "Semana completa",
    description: "Completa al menos 6 de 7 días en la semana actual",
    icon: "🗓️",
    unlocked: false,
    progress: totalWeeksDone(habits),
    max: 1,
  });

  return list;
}