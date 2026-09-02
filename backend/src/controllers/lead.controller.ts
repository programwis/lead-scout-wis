import type { FastifyReply, FastifyRequest } from "fastify";
import { searchWeb } from "../services/search.service.js";
import { crawlWebsite } from "../services/crawler.service.js";
import { generateLeads, listLeads } from "../services/lead.service.js";

interface SearchBody {
  keyword: string;
  location?: string;
}

interface GenerateBody extends SearchBody {
  limit?: number;
  refresh?: boolean;
}

interface CrawlBody {
  url: string;
}

export class LeadController {
  static async search(request: FastifyRequest<{ Body: SearchBody }>, reply: FastifyReply) {
    const { keyword, location } = request.body;

    if (!keyword?.trim()) {
      return reply.code(400).send({ success: false, message: "Keyword is required" });
    }

    return { success: true, results: await searchWeb(keyword, location) };
  }

  static async crawl(request: FastifyRequest<{ Body: CrawlBody }>, reply: FastifyReply) {
    const { url } = request.body;

    if (!url?.trim()) {
      return reply.code(400).send({ success: false, message: "URL is required" });
    }

    return { success: true, result: await crawlWebsite(url) };
  }

  static async generate(request: FastifyRequest<{ Body: GenerateBody }>, reply: FastifyReply) {
    if (!request.body.keyword?.trim()) {
      return reply.code(400).send({ success: false, message: "Keyword is required" });
    }

    const { leads, skipped, failed } = await generateLeads(request.body);

    return { success: true, leads, skipped, failed };
  }

  static async list(request: FastifyRequest<{ Querystring: { limit?: number } }>) {
    return { success: true, leads: await listLeads(request.query.limit) };
  }
}
