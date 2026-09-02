import type { FastifyInstance } from "fastify";
import { LeadController } from "../controllers/lead.controller.js";

export async function leadRoutes(app: FastifyInstance) {
  app.post("/search", LeadController.search);
  app.post("/crawl", LeadController.crawl);
  app.post("/generate", LeadController.generate);
  app.get("/", LeadController.list);
}
