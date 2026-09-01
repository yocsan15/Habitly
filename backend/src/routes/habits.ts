import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import {
  listHabitsWithLogs,
  getHabitWithLogs,
  toggleLog,
  todayDateStr,
} from "../services/habitLogs.js";
import {
  createHabit,
  updateHabit,
  deleteHabit,
} from "../services/habits.js";
import { requireAuth } from "../auth/guard.js";
import type { CreateHabitRequest, UpdateHabitRequest } from "shared-types";

const createSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  frequency: z.enum(["daily", "weekly", "custom"]).optional(),
  color: z.string().max(20).optional(),
  icon: z.string().max(4).optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(500).nullable().optional(),
  frequency: z.enum(["daily", "weekly", "custom"]).optional(),
  color: z.string().max(20).optional(),
  icon: z.string().max(4).optional(),
  active: z.boolean().optional(),
});

const logSchema = z.object({
  date: z.string(),
  timezoneOffset: z.number(),
});

function userId(request: FastifyRequest): string {
  return request.user.userId;
}

function idParams(request: FastifyRequest): string {
  return (request.params as { id: string }).id;
}

function clientToday(request: FastifyRequest): string {
  const body = (request.body ?? {}) as { date?: string; timezoneOffset?: number };
  if (body.date) {
    return body.date;
  }
  const offset = typeof body.timezoneOffset === "number" ? body.timezoneOffset : 0;
  return todayDateStr(offset);
}

export async function habitRoutes(app: FastifyInstance): Promise<void> {
  app.get("/habits", { onRequest: [requireAuth] }, async (request) => {
    return listHabitsWithLogs(userId(request), clientToday(request));
  });

  app.get(
    "/habits/:id",
    { onRequest: [requireAuth] },
    async (request, reply) => {
      const habit = await getHabitWithLogs(
        userId(request),
        idParams(request),
        clientToday(request),
      );
      if (!habit) {
        return reply.code(404).send({ error: "Hábito no encontrado" });
      }
      return habit;
    },
  );

  app.post(
    "/habits/:id/log",
    { onRequest: [requireAuth] },
    async (request, reply) => {
      const parsed = logSchema.safeParse(request.body ?? {});
      const result = await toggleLog(
        userId(request),
        idParams(request),
        parsed.success && parsed.data.date
          ? parsed.data.date
          : todayDateStr(parsed.success ? parsed.data.timezoneOffset : 0),
      );
      if (!result.ok) {
        return reply.code(404).send({ error: "Hábito no encontrado" });
      }
      return { action: result.action };
    },
  );

  app.post<{ Body: CreateHabitRequest }>(
    "/habits",
    { onRequest: [requireAuth] },
    async (request, reply) => {
      const parsed = createSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: "Datos inválidos" });
      }
      const created = await createHabit(userId(request), parsed.data);
      const full = await getHabitWithLogs(
        userId(request),
        created.id,
        clientToday(request),
      );
      return full;
    },
  );

  app.put<{ Body: UpdateHabitRequest }>(
    "/habits/:id",
    { onRequest: [requireAuth] },
    async (request, reply) => {
      const parsed = updateSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: "Datos inválidos" });
      }
      const updated = await updateHabit(userId(request), idParams(request), parsed.data);
      if (!updated) {
        return reply.code(404).send({ error: "Hábito no encontrado" });
      }
      const full = await getHabitWithLogs(
        userId(request),
        updated.id,
        clientToday(request),
      );
      return full;
    },
  );

  app.delete(
    "/habits/:id",
    { onRequest: [requireAuth] },
    async (request, reply) => {
      const deleted = await deleteHabit(userId(request), idParams(request));
      if (!deleted) {
        return reply.code(404).send({ error: "Hábito no encontrado" });
      }
      return reply.code(204).send();
    },
  );
}
