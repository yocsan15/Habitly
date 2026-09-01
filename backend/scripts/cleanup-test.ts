import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { like, eq } from "drizzle-orm";
import { users } from "../src/db/schema/users.js";
import { habits } from "../src/db/schema/habits.js";
import { habitLogs } from "../src/db/schema/habitLogs.js";

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema: { users, habits, habitLogs } });

const testUsers = await db.select().from(users).where(like(users.email, "%@habitly.dev"));
console.log("usuarios de prueba firmados:", testUsers.length);
for (const u of testUsers) {
  const h = await db.select().from(habits).where(eq(habits.userId, u.id));
  for (const hb of h) {
    await db.delete(habitLogs).where(eq(habitLogs.habitId, hb.id));
  }
  await db.delete(habits).where(eq(habits.userId, u.id));
  await db.delete(users).where(eq(users.id, u.id));
}
console.log("limpieza completada");
await client.end();
