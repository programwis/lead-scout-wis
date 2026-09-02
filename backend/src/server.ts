import Fastify from "fastify";
import cors from "@fastify/cors";
import mongoose from "mongoose";
import { env } from "./config/env.js";
import { leadRoutes } from "./routes/lead.routes.js";

const app = Fastify({ logger: false });

await app.register(cors, { origin: true });
await app.register(leadRoutes, { prefix: "/api/leads" });

app.get("/health", async () => ({ status: "ok" }));

try {
  await mongoose.connect(env.mongoUri);
  console.log("MongoDB connected");

  await app.listen({ port: env.port, host: "0.0.0.0" });
  console.log(`Server running on http://localhost:${env.port}`);
} catch (error) {
  console.error("Failed to start server:", error instanceof Error ? error.message : error);
  process.exit(1);
}