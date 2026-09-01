import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { habits } from "../db/schema/index.js";
import type { CreateHabitRequest, UpdateHabitRequest } from "shared-types";

export type HabitRow = typeof habits.$inferSelect;

export async function createHabit(
  userId: string,
  input: CreateHabitRequest,
): Promise<HabitRow> {
  const [row] = await db
    .insert(habits)
    .values({
      userId,
      name: input.name,
      description: input.description ?? null,
      frequency: input.frequency ?? "daily",
      color: input.color ?? "#26519e",
      icon: input.icon ?? "✅",
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