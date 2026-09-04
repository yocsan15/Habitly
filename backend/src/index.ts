import Fastify from "fastify";
import cors from "@fastify/cors";
import { registerJwt } from "./auth/jwt.js";
import { authRoutes } from "./auth/routes.js";
import { healthRoutes } from "./routes/health.js";
import { habitRoutes } from "./routes/habits.js";
import { env } from "./env.js";

const app = Fastify({ logger: true });

await registerJwt(app);
await app.register(cors, {
  origin: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
});
await authRoutes(app);
await healthRoutes(app);
await habitRoutes(app);

try {
  await app.listen({ port: env.port, host: "0.0.0.0" });
  app.log.info(`Backend running on http://localhost:${env.port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
