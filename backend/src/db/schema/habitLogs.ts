import { pgTable, uuid, timestamp, date, unique } from "drizzle-orm/pg-core";
import { habits } from "./habits.js";

export const habitLogs = pgTable("habit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  habitId: uuid("habit_id")
    .notNull()
    .references(() => habits.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  uniqHabitDate: unique("habit_logs_habit_id_date_unique").on(t.habitId, t.date),
}));
