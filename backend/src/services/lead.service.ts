import { searchWeb } from "./search.service.js";
import { crawlSite } from "./crawler.service.js";
import { extractLead } from "./ai.service.js";
import { LeadModel } from "../models/lead.model.js";
import { getDomain, normalizeUrl } from "../utils/url.utils.js";
import type { SearchResult } from "../types/search.type.js";
import type { ExtractedLead } from "../types/lead.type.js";

interface GenerateOptions {
  keyword: string;
  location?: string;
  limit?: number;
  /** true = crawl ใหม่ทับของเดิม, false (default) = ข้าม domain ที่มีใน DB แล้ว */
  refresh?: boolean;
}

/** Search -> crawl -> extract -> save. One lead per website. */
export async function generateLeads({ keyword, location, limit = 5, refresh = false }: GenerateOptions) {
  const targets = uniqueByDomain(await searchWeb(keyword, location)).slice(0, limit);

  const leads = [];
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

      leads.push(await saveLead(result, domain, extracted));
    } catch (error) {
      failed.push({ url: result.url, message: (error as Error).message });
    }
  }

  return { leads, skipped, failed };
}

export async function listLeads(limit = 50) {
  return LeadModel.find().sort({ createdAt: -1 }).limit(limit);
}

async function saveLead(result: SearchResult, domain: string, extracted: ExtractedLead) {
  // Upsert on the domain so a refresh updates instead of duplicating.
  return LeadModel.findOneAndUpdate(
    { domain },
    {
      $set: {
        domain,
        website: normalizeUrl(result.url),
        companyName: extracted.companyName ?? result.title,
        industry: extracted.industry ?? undefined,
        phone: extracted.phone ?? undefined,
        email: extracted.email ?? undefined,
        address: extracted.address ?? undefined
      }
    },
    { upsert: true, new: true }
  );
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
