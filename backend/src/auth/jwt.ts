import type { FastifyInstance } from "fastify";
import fastifyJwt from "@fastify/jwt";
import type { User } from "shared-types";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { userId: string };
    user: { userId: string };
  }
}

export async function registerJwt(app: FastifyInstance): Promise<void> {
  const secret = process.env.JWT_SECRET ?? "dev-secret-change-me";
  await app.register(fastifyJwt, { secret });
}

export type { User };
