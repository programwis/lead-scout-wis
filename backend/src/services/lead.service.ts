import { searchWeb } from "./search.service.js";
import { crawlSite } from "./crawler.service.js";
import { extractLead } from "./ai.service.js";
import { LeadModel } from "../models/lead.model.js";
import { getDomain, normalizeUrl } from "../utils/url.utils.js";
import type { SearchResult } from "../types/search.type.js";
import type { LeadCandidate } from "../types/lead.type.js";

interface GenerateOptions {
  keyword: string;
  location?: string;
  limit?: number;
  /** true = ดึงใหม่แม้ domain จะมีใน DB แล้ว, false (default) = ข้ามไป */
  refresh?: boolean;
}

/**
 * ขั้นตอน search -> crawl -> extract เท่านั้น **ไม่บันทึกลง DB**
 * ผลลัพธ์ที่ได้เอาไปให้หน้าบ้านตรวจ/แก้ แล้วส่งกลับมาที่ confirmLeads()
 */
export async function generateLeads({ keyword, location, limit = 5, refresh = false }: GenerateOptions) {
  const targets = uniqueByDomain(await searchWeb(keyword, location)).slice(0, limit);
  const industry = keyword.trim();

  const leads: LeadCandidate[] = [];
  const skipped = [];
  const failed = [];

  for (const { result, domain } of targets) {
    try {
      // เช็คก่อน crawl เพื่อไม่ให้เสียค่า AI กับ domain ที่มีข้อมูลอยู่แล้ว
      if (!refresh) {
        const existing = await LeadModel.findOne({ domain });

        if (existing) {
          skipped.push(existing);
          continue;
        }
      }

      const pages = await crawlSite(result.url);
      const text = pages.map((page) => page.text).join("\n\n");
      const links = pages.flatMap((page) => page.links);
      const extracted = await extractLead(text, result.url, links);

      leads.push({
        companyName: extracted.companyName ?? result.title,
        industry,
        industryDetail: extracted.industry,
        website: normalizeUrl(result.url),
        domain,
        phone: extracted.phone,
        email: extracted.email,
        address: extracted.address
      });
    } catch (error) {
      failed.push({ url: result.url, message: (error as Error).message });
    }
  }

  return { leads, skipped, failed };
}

/** บันทึกผลที่หน้าบ้านตรวจ/แก้แล้วลง DB ทีเดียว — upsert ตาม domain */
export async function confirmLeads(candidates: LeadCandidate[]) {
  const saved = [];
  const failed = [];

  for (const candidate of candidates) {
    const domain = optional(candidate.domain) ?? getDomain(candidate.website ?? "");
    const companyName = optional(candidate.companyName);

    if (!domain || !companyName) {
      failed.push({
        domain: candidate.domain ?? null,
        message: "ต้องมี companyName และ domain (หรือ website ที่หา domain ได้)"
      });
      continue;
    }

    try {
      saved.push(await saveLead(domain, companyName, candidate));
    } catch (error) {
      failed.push({ domain, message: (error as Error).message });
    }
  }

  return { saved, failed };
}

export async function listLeads(limit = 50, industry?: string) {
  const filter = industry ? { industry } : {};

  return LeadModel.find(filter).sort({ createdAt: -1 }).limit(limit);
}

async function saveLead(domain: string, companyName: string, candidate: LeadCandidate) {
  return LeadModel.findOneAndUpdate(
    { domain },
    {
      // ช่องที่ส่งมาว่างจะถูกตัดออกจาก $set (mongoose ตัด undefined ให้)
      // แปลว่าเว้นว่าง = ไม่แก้ของเดิม ไม่ใช่ลบทิ้ง
      $set: {
        domain,
        companyName,
        website: optional(candidate.website) ?? normalizeUrl(`https://${domain}`),
        industry: optional(candidate.industry),
        industryDetail: optional(candidate.industryDetail),
        phone: optional(candidate.phone),
        email: optional(candidate.email),
        address: optional(candidate.address)
      }
    },
    { upsert: true, new: true }
  );
}

/** ค่าว่าง/null -> undefined เพื่อให้ mongoose ตัดออกจาก $set ไม่เขียนค่าว่างทับของเดิม */
function optional(value: string | null | undefined) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : undefined;
}

function uniqueByDomain(results: SearchResult[]) {
  const seen = new Set<string>();
  const targets: { result: SearchResult; domain: string }[] = [];

  for (const result of results) {
    const domain = getDomain(result.url);

    if (!domain || seen.has(domain)) continue;

    seen.add(domain);
    targets.push({ result, domain });
  }

  return targets;
}
