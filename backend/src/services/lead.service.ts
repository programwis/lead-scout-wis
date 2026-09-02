import { searchWeb } from "./search.service.js";
import { crawlSite } from "./crawler.service.js";
import { extractLead } from "./ai.service.js";
import { LeadModel } from "../models/lead.model.js";
import { env } from "../config/env.js";
import { getDomain, normalizeUrl } from "../utils/url.utils.js";
import type { SearchResult } from "../types/search.type.js";
import type { ContactStatus, LeadCandidate } from "../types/lead.type.js";
import type { GenerateProgress, GenerateStep } from "../types/progress.type.js";
import type { AiModel } from "../config/env.js";

interface GenerateOptions {
  keyword: string;
  location?: string;
  limit?: number;
  /** true = ดึงใหม่แม้ domain จะมีใน DB แล้ว, false (default) = ข้ามไป */
  refresh?: boolean;
  /** โมเดล AI ที่ใช้รอบนี้ — ไม่ส่งมา = ใช้ค่า default จาก env */
  model?: AiModel;
  /** เรียกทุกครั้งที่ขยับขั้นตอน — ตอนนี้ยังไม่มีใครส่งมา เตรียมไว้ต่อ SSE ทีหลัง */
  onProgress?: (progress: GenerateProgress) => void;
}

/**
 * เพดานจำนวนหน้าที่ยอมไล่ขอจาก Serper ต่อการเรียก 1 ครั้ง (1 หน้า = 10 ผลลัพธ์ = 1 query)
 * เป็น hard limit กันวนไม่รู้จบตอน keyword ให้ผลน้อย หรือเว็บที่เจอไม่มีข้อมูลติดต่อเลย
 */
const maxSearchPages = 5;

/**
 * ขั้นตอน search -> crawl -> extract เท่านั้น **ไม่บันทึกลง DB**
 * ผลลัพธ์ที่ได้เอาไปให้หน้าบ้านตรวจ/แก้ แล้วส่งกลับมาที่ confirmLeads()
 *
 * `limit` = จำนวน lead ที่ **ติดต่อได้จริง** (มีเบอร์หรืออีเมลอย่างน้อย 1 ช่อง) ไม่ใช่จำนวนเว็บที่ค้นเจอ
 * เป้าหมายของระบบคือ contact ที่ Sales โทร/เมลได้ เว็บบริษัทที่หา contact ไม่เจอจึงไม่นับเข้าโควตา
 * แต่ยังคืนไปใน `noContact` ให้รู้ว่าเจอบริษัทแล้วแต่ใช้ไม่ได้
 *
 * ระหว่างทางเว็บหล่นได้ 4 ทาง (โดนกรองทิ้ง / domain มีใน DB แล้ว / crawl ไม่ผ่าน / ไม่มี contact)
 * จึงไล่ขอ Serper หน้าถัดไปมาเติมจนครบ `limit` หรือชน `maxSearchPages`
 */
export async function generateLeads({
  keyword,
  location,
  limit = 5,
  refresh = false,
  model,
  onProgress
}: GenerateOptions) {
  const industry = keyword.trim();
  // env.aiModel เป็น string อิสระ (AI_MODEL ใน .env) จึงยุบเป็น string ตรงนี้ ไม่ใช่ AiModel
  const aiModel: string = model ?? env.aiModel;

  const leads: LeadCandidate[] = [];
  const noContact: LeadCandidate[] = [];
  const skipped = [];
  const failed = [];
  // เก็บข้ามหน้า เพื่อไม่ให้ domain เดิมที่โผล่ซ้ำในหน้าถัด ๆ ไปถูก crawl อีกรอบ
  const seenDomains = new Set<string>();

  let searchedPages = 0;

  // ความคืบหน้าวัดจาก "ได้ lead ที่ติดต่อได้กี่ราย" เพราะนั่นคือสิ่งที่ limit นับ
  const report = (step: GenerateStep, message: string) =>
    onProgress?.({
      step,
      current: leads.length,
      total: limit,
      progress: Math.min(100, Math.round((leads.length / limit) * 100)),
      message
    });

  for (let searchPage = 1; searchPage <= maxSearchPages && leads.length < limit; searchPage++) {
    report("search", `ค้นหาผลลัพธ์หน้า ${searchPage}`);

    const { results, hasMore } = await searchWeb(keyword, location, searchPage);
    const targets = uniqueByDomain(results, seenDomains);
    searchedPages = searchPage;

    report("filter", `หน้า ${searchPage} เหลือเว็บที่น่าจะใช่ ${targets.length} เว็บ`);

    for (const { result, domain } of targets) {
      if (leads.length >= limit) break;

      try {
        // เช็คก่อน crawl เพื่อไม่ให้เสียค่า AI กับ domain ที่มีข้อมูลอยู่แล้ว
        if (!refresh) {
          const existing = await LeadModel.findOne({ domain });

          if (existing) {
            skipped.push(existing);
            continue;
          }
        }

        report("crawl", `กำลังอ่านเว็บ ${domain}`);

        const pages = await crawlSite(result.url);

        report("extract", `กำลังดึงข้อมูลติดต่อจาก ${domain}`);

        const text = pages.map((page) => page.text).join("\n\n");
        const links = pages.flatMap((page) => page.links);
        const extracted = await extractLead(text, result.url, links, aiModel);

        const phone = phoneOrNull(extracted.phone);
        const email = emailOrNull(extracted.email);
        const contactStatus = toContactStatus(phone, email);

        const candidate: LeadCandidate = {
          companyName: extracted.companyName ?? result.title,
          industry,
          industryDetail: extracted.industry,
          website: normalizeUrl(result.url),
          domain,
          phone,
          email,
          address: extracted.address,
          contactStatus
        };

        // ไม่มีทั้งเบอร์และอีเมล = Sales เอาไปติดต่อไม่ได้ จึงไม่นับเข้าโควตา limit
        (contactStatus === "no_contact" ? noContact : leads).push(candidate);
      } catch (error) {
        failed.push({ url: result.url, message: (error as Error).message });
      }
    }

    // ผลค้นหาหมดแล้วจริง ๆ ไล่หน้าต่อไปก็ได้ของว่าง
    if (!hasMore) break;
  }

  report("complete", `ได้ lead ที่ติดต่อได้ ${leads.length} จาก ${limit} ราย`);

  // คืน aiModel ไปด้วยเพื่อให้หน้าบ้านแสดงได้ว่าผลรอบนี้มาจากโมเดลไหน
  // requested/searchedPages/summary ไว้ให้หน้าบ้านบอกผู้ใช้ได้ว่าทำไมได้ไม่ครบตามที่ขอ
  return {
    model: aiModel,
    requested: limit,
    searchedPages,
    summary: summarize(leads, noContact),
    leads,
    noContact,
    skipped,
    failed
  };
}

/**
 * AI เผลอเอา `mailto:` / อีเมล มาใส่ช่อง phone ได้ (เจอจริง: phone = "mailto:pr@example.com")
 * ถ้าปล่อยไว้ lead จะถูกตีเป็น partial ทั้งที่ไม่มีเบอร์ให้โทรจริง — contactStatus ต้องไม่โกหก
 * AI คืนหลายเบอร์คั่นด้วย , ได้ จึงคัดทีละรายการแล้วเหลือเฉพาะอันที่มีตัวเลขและไม่ใช่อีเมล
 */
function phoneOrNull(value: string | null) {
  const numbers = (value ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter((part) => !part.includes("@") && /\d/.test(part));

  return numbers.length ? numbers.join(", ") : null;
}

/** ต้องมี `@` ถึงจะเป็นอีเมลที่ส่งถึงจริง (ตัด prefix `mailto:` ที่ AI ติดมาจาก href ออกด้วย) */
function emailOrNull(value: string | null) {
  const email = value?.trim().replace(/^mailto:/i, "").trim();

  return email?.includes("@") ? email : null;
}

/** เงื่อนไขตายตัวจาก phone/email ที่ได้มา — ไม่ให้ AI เป็นคนตัดสินสถานะนี้ */
function toContactStatus(phone: string | null, email: string | null): ContactStatus {
  if (phone && email) return "contactable";

  return phone || email ? "partial" : "no_contact";
}

/**
 * สรุปคุณภาพของรอบนี้ นับเฉพาะบริษัทที่ crawl + extract สำเร็จ
 * (`skipped` ไม่ผ่าน AI และ `failed` ไม่มีข้อมูล จึงไม่มีอะไรให้นับ)
 *
 * `withBoth` เท่ากับ `contactable` เสมอตามนิยาม เก็บไว้ทั้งคู่เพราะคนละมุมการอ่าน:
 * `contactable` คือสถานะของ lead ส่วน `withPhone`/`withEmail`/`withBoth` คือความครบของช่องทาง
 */
function summarize(leads: LeadCandidate[], noContact: LeadCandidate[]) {
  const companies = [...leads, ...noContact];
  const countBy = (status: ContactStatus) => companies.filter((c) => c.contactStatus === status).length;

  return {
    companiesFound: companies.length,
    contactable: countBy("contactable"),
    partial: countBy("partial"),
    noContact: noContact.length,
    withPhone: companies.filter((c) => c.phone).length,
    withEmail: companies.filter((c) => c.email).length,
    withBoth: companies.filter((c) => c.phone && c.email).length
  };
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

/** ตัด domain ซ้ำออก (1 บริษัท = 1 เว็บ) โดยนับรวม domain ที่เคยเจอจากหน้าก่อน ๆ ด้วย */
function uniqueByDomain(results: SearchResult[], seen: Set<string>) {
  const targets: { result: SearchResult; domain: string }[] = [];

  for (const result of results) {
    const domain = getDomain(result.url);

    if (!domain || seen.has(domain)) continue;

    seen.add(domain);
    targets.push({ result, domain });
  }

  return targets;
}
