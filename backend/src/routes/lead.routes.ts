import type { FastifyInstance } from "fastify";
import { LeadController } from "../controllers/lead.controller.js";

export async function leadRoutes(app: FastifyInstance) {
  app.post("/search", LeadController.search);
  app.post("/crawl", LeadController.crawl);
  app.post("/generate", LeadController.generate);
  app.post("/confirm", LeadController.confirm);
  app.get("/", LeadController.list);
}
