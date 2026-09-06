import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { habits } from "../db/schema/index.js";
import type { CreateHabitRequest, UpdateHabitRequest } from "shared-types";

export type HabitRow = typeof habits.$inferSelect;

async function nextPosition(userId: string): Promise<number> {
  const rows = await db
    .select({ position: habits.position })
    .from(habits)
    .where(eq(habits.userId, userId))
    .orderBy(habits.position);
  return rows.length ? (rows[rows.length - 1].position ?? 0) + 1 : 0;
}

export async function createHabit(
  userId: string,
  input: CreateHabitRequest,
): Promise<HabitRow> {
  const position = await nextPosition(userId);
  const [row] = await db
    .insert(habits)
    .values({
      userId,
      name: input.name,
      description: input.description ?? null,
      frequency: input.frequency ?? "daily",
      color: input.color ?? "#26519e",
      icon: input.icon ?? "✅",
      weeklyGoal: input.weeklyGoal ?? null,
      streakGoal: input.streakGoal ?? null,
      monthlyGoal: input.monthlyGoal ?? null,
      volumeGoal:
        input.volumeGoal !== undefined && input.volumeGoal !== null
          ? String(input.volumeGoal)
          : null,
      volumeUnit: input.volumeUnit ?? null,
      reminderTime: input.reminderTime ?? null,
      position,
    })
    .returning();

  return row;
}

export async function updateHabit(
  userId: string,
  habitId: string,
  input: UpdateHabitRequest,
): Promise<HabitRow | null> {
  const rows = await db
    .update(habits)
    .set({
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.frequency !== undefined ? { frequency: input.frequency } : {}),
      ...(input.color !== undefined ? { color: input.color } : {}),
      ...(input.icon !== undefined ? { icon: input.icon } : {}),
      ...(input.active !== undefined ? { active: input.active } : {}),
      ...(input.weeklyGoal !== undefined ? { weeklyGoal: input.weeklyGoal } : {}),
      ...(input.streakGoal !== undefined ? { streakGoal: input.streakGoal } : {}),
      ...(input.monthlyGoal !== undefined ? { monthlyGoal: input.monthlyGoal } : {}),
      ...(input.volumeGoal !== undefined
        ? { volumeGoal: input.volumeGoal !== null ? String(input.volumeGoal) : null }
        : {}),
      ...(input.volumeUnit !== undefined ? { volumeUnit: input.volumeUnit } : {}),
      ...(input.reminderTime !== undefined ? { reminderTime: input.reminderTime } : {}),
    })
    .where(and(eq(habits.id, habitId), eq(habits.userId, userId)))
    .returning();

  return rows[0] ?? null;
}

export async function deleteHabit(userId: string, habitId: string): Promise<boolean> {
  const result = await db
    .delete(habits)
    .where(and(eq(habits.id, habitId), eq(habits.userId, userId)))
    .returning({ id: habits.id });

  return result.length > 0;
}