import type { FastifyRequest } from "fastify";

export async function requireAuth(request: FastifyRequest): Promise<void> {
  await request.jwtVerify();
}
