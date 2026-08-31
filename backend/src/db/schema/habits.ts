import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
  text,
  pgEnum,
  integer,
} from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const habitFrequency = pgEnum("habit_frequency", ["daily", "weekly", "custom"]);

export const habits = pgTable("habits", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 120 }).notNull(),
  description: text("description"),
  frequency: habitFrequency("frequency").notNull().default("daily"),
  color: varchar("color", { length: 20 }).notNull().default("#26519e"),
  icon: varchar("icon", { length: 4 }).notNull().default("✅"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
