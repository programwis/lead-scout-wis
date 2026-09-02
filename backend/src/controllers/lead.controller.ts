import type { FastifyReply, FastifyRequest } from "fastify";
import { searchWeb } from "../services/search.service.js";
import { crawlWebsite } from "../services/crawler.service.js";
import { confirmLeads, generateLeads, listLeads } from "../services/lead.service.js";
import { aiModels, env } from "../config/env.js";
import type { LeadCandidate } from "../types/lead.type.js";
import type { AiModel } from "../config/env.js";

const aiModelNames = Object.keys(aiModels);

interface SearchBody {
  keyword: string;
  location?: string;
}

interface GenerateBody extends SearchBody {
  limit?: number;
  refresh?: boolean;
  model?: AiModel;
}

interface CrawlBody {
  url: string;
}

interface ConfirmBody {
  leads: LeadCandidate[];
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
    const { model } = request.body;

    if (!request.body.keyword?.trim()) {
      return reply.code(400).send({ success: false, message: "Keyword is required" });
    }

    // กันพิมพ์ชื่อโมเดลผิดแล้วไปตาย 404 ที่ Anthropic ตอน crawl เสร็จไปครึ่งทางแล้ว
    if (model !== undefined && !aiModelNames.includes(model)) {
      return reply.code(400).send({
        success: false,
        message: `model ต้องเป็นค่าใดค่าหนึ่งใน: ${aiModelNames.join(", ")}`
      });
    }

    const { leads, skipped, failed, model: usedModel } = await generateLeads(request.body);

    return { success: true, model: usedModel, leads, skipped, failed };
  }

  /** ให้หน้าบ้านเอาไปทำ dropdown เลือกโมเดล — ไม่ต้อง hardcode ชื่อ/ราคาซ้ำอีกฝั่ง */
  static async models() {
    return {
      success: true,
      defaultModel: env.aiModel,
      models: Object.entries(aiModels).map(([name, info]) => ({ name, ...info }))
    };
  }

  static async confirm(request: FastifyRequest<{ Body: ConfirmBody }>, reply: FastifyReply) {
    const { leads } = request.body;

    if (!Array.isArray(leads) || leads.length === 0) {
      return reply.code(400).send({ success: false, message: "leads must be a non-empty array" });
    }

    const { saved, failed } = await confirmLeads(leads);

    return { success: true, saved, failed };
  }

  static async list(request: FastifyRequest<{ Querystring: { limit?: number; industry?: string } }>) {
    const { limit, industry } = request.query;

    return { success: true, leads: await listLeads(limit, industry) };
  }
}
