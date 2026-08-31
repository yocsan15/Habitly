import type { FastifyInstance } from "fastify";
import fastifyJwt from "@fastify/jwt";
import type { User } from "shared-types";
import { env } from "../env.js";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { userId: string };
    user: { userId: string };
  }
}

export async function registerJwt(app: FastifyInstance): Promise<void> {
  await app.register(fastifyJwt, { secret: env.jwtSecret });
}

export type { User };
