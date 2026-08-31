import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { habits } from "../db/schema/index.js";
import type { CreateHabitRequest, UpdateHabitRequest, Habit } from "shared-types";

function serialize(habit: typeof habits.$inferSelect): Habit {
  return {
    id: habit.id,
    name: habit.name,
    description: habit.description,
    frequency: habit.frequency,
    color: habit.color,
    icon: habit.icon,
    active: habit.active,
    createdAt: habit.createdAt.toISOString(),
  };
}

export async function listHabits(userId: string): Promise<Habit[]> {
  const rows = await db
    .select()
    .from(habits)
    .where(and(eq(habits.userId, userId), eq(habits.active, true)))
    .orderBy(habits.createdAt);

  return rows.map(serialize);
}

export async function getHabit(userId: string, habitId: string): Promise<Habit | null> {
  const rows = await db
    .select()
    .from(habits)
    .where(and(eq(habits.id, habitId), eq(habits.userId, userId)));

  return rows[0] ? serialize(rows[0]) : null;
}

export async function createHabit(
  userId: string,
  input: CreateHabitRequest,
): Promise<Habit> {
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

  return serialize(row);
}

export async function updateHabit(
  userId: string,
  habitId: string,
  input: UpdateHabitRequest,
): Promise<Habit | null> {
  const existing = await getHabit(userId, habitId);
  if (!existing) {
    return null;
  }

  const [row] = await db
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

  return serialize(row);
}

export async function deleteHabit(userId: string, habitId: string): Promise<boolean> {
  const result = await db
    .delete(habits)
    .where(and(eq(habits.id, habitId), eq(habits.userId, userId)))
    .returning({ id: habits.id });

  return result.length > 0;
}
