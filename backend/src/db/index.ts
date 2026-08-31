import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

const connectionString = process.env.DATABASE_URL ?? 
  "postgresql://habit_user:habit_pass@localhost:5432/habit_tracker";

const client = postgres(connectionString);
export const db = drizzle(client, { schema });
