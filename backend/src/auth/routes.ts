import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { users } from "../db/schema/index.js";
import { hashPassword, verifyPassword } from "./password.js";
import { requireAuth } from "./guard.js";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: z.infer<typeof registerSchema> }>("/auth/register", async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const message =
        issue?.path[0] === "password"
          ? "La contraseña debe tener al menos 8 caracteres"
          : "Email o contraseña inválidos";
      return reply.code(400).send({ error: message });
    }

    const { email, password } = parsed.data;

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email));

    if (existing.length > 0) {
      return reply.code(409).send({ error: "El email ya está registrado" });
    }

    const passwordHash = await hashPassword(password);
    const [created] = await db
      .insert(users)
      .values({ email, passwordHash })
      .returning();

    const token = app.jwt.sign({ userId: created.id }, { expiresIn: "7d" });

    return {
      token,
      user: { id: created.id, email: created.email, createdAt: created.createdAt.toISOString() },
    };
  });

  app.post<{ Body: z.infer<typeof loginSchema> }>("/auth/login", async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Datos inválidos" });
    }

    const { email, password } = parsed.data;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (!user) {
      return reply.code(401).send({ error: "Credenciales inválidas" });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return reply.code(401).send({ error: "Credenciales inválidas" });
    }

    const token = app.jwt.sign({ userId: user.id });

    return {
      token,
      user: { id: user.id, email: user.email, createdAt: user.createdAt.toISOString() },
    };
  });

  app.post<{ Body: z.infer<typeof changePasswordSchema> }>(
    "/auth/change-password",
    { onRequest: [requireAuth] },
    async (request: FastifyRequest, reply) => {
      const parsed = changePasswordSchema.safeParse(request.body);
      if (!parsed.success) {
        const issue = parsed.error.issues[0];
        const message =
          issue?.path[0] === "newPassword"
            ? "La nueva contraseña debe tener al menos 8 caracteres"
            : "Datos inválidos";
        return reply.code(400).send({ error: message });
      }

      const { currentPassword, newPassword } = parsed.data;

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, request.user.userId));

      if (!user) {
        return reply.code(404).send({ error: "Usuario no encontrado" });
      }

      const valid = await verifyPassword(currentPassword, user.passwordHash);
      if (!valid) {
        return reply.code(401).send({ error: "La contraseña actual es incorrecta" });
      }

      const passwordHash = await hashPassword(newPassword);
      await db
        .update(users)
        .set({ passwordHash })
        .where(and(eq(users.id, user.id)));

      return { ok: true };
    },
  );
}
