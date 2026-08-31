import type { FastifyInstance, FastifyRequest } from "fastify";
import { requireAuth } from "../auth/guard.js";

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/health/protected", { onRequest: [requireAuth] }, async (request: FastifyRequest) => {
    return {
      status: "ok",
      userId: request.user.userId,
      timestamp: new Date().toISOString(),
    };
  });

  app.get("/health", async () => {
    return { status: "ok", timestamp: new Date().toISOString() };
  });
}
