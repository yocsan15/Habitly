import Fastify from "fastify";
import cors from "@fastify/cors";
import { registerJwt } from "./auth/jwt.js";
import { authRoutes } from "./auth/routes.js";
import { healthRoutes } from "./routes/health.js";

const app = Fastify({ logger: true });

await registerJwt(app);
await app.register(cors, { origin: true });
await authRoutes(app);
await healthRoutes(app);

const port = Number(process.env.PORT ?? 3001);

try {
  await app.listen({ port, host: "0.0.0.0" });
  app.log.info(`Backend running on http://localhost:${port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
