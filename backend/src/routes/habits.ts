import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import {
  listHabits,
  getHabit,
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

function userId(request: FastifyRequest): string {
  return request.user.userId;
}

function idParams(request: FastifyRequest): string {
  return (request.params as { id: string }).id;
}

export async function habitRoutes(app: FastifyInstance): Promise<void> {
  app.get("/habits", { onRequest: [requireAuth] }, async (request) => {
    return listHabits(userId(request));
  });

  app.get(
    "/habits/:id",
    { onRequest: [requireAuth] },
    async (request, reply) => {
      const habit = await getHabit(userId(request), idParams(request));
      if (!habit) {
        return reply.code(404).send({ error: "Hábito no encontrado" });
      }
      return habit;
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
      return createHabit(userId(request), parsed.data);
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
      const habit = await updateHabit(userId(request), idParams(request), parsed.data);
      if (!habit) {
        return reply.code(404).send({ error: "Hábito no encontrado" });
      }
      return habit;
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
