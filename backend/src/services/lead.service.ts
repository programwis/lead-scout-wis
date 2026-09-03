import { searchPlaces } from "./search.service.js";
import { crawlSite } from "./crawler.service.js";
import { extractLead } from "./ai.service.js";
import { LeadModel } from "../models/lead.model.js";
import { env } from "../config/env.js";
import { classifySource, getDomain, normalizeUrl } from "../utils/url.utils.js";
import { verifyLocation } from "../utils/location.utils.js";
import type { PlaceResult } from "../types/search.type.js";
import type { ContactStatus, LeadCandidate, LeadReference } from "../types/lead.type.js";
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

/** เหตุที่ธุรกิจไม่ได้เป็น lead ทั้งที่ Google Places รู้จัก */
type ReviewReason = "unknown_location" | "no_website";
type RejectReason = "outside_location" | "duplicate_domain";

/** สิ่งที่ควรทำต่อเมื่อได้ไม่ครบ — บอกผู้ใช้ดีกว่าเอาผลคุณภาพต่ำมาถมให้ครบจำนวน */
type GenerateSuggestion = "expand_scope" | "try_other_keyword" | "search_again";

/**
 * เพดานจำนวนหน้าที่ยอมไล่ขอจาก Google Places ต่อการเรียก 1 ครั้ง (1 หน้า = 10 ธุรกิจ = 1 query)
 * เป็น hard limit กันวนไม่รู้จบตอน keyword ให้ผลน้อย
 */
const maxSearchPages = 5;

/** ไล่หน้าต่อได้อีกกี่หน้าเมื่อหน้านั้นไม่ได้ lead ใหม่เลย — เกินนี้ถือว่าคุณภาพตก หยุดดีกว่าถมขยะ */
const maxEmptyPages = 2;

/** จำนวน reference สูงสุดต่อ 1 lead — เว็บที่มีลิงก์ social เยอะ ๆ ไม่ควรทำให้ response บวม */
const maxReferences = 8;

/**
 * ขั้นตอน search -> validate -> crawl -> extract เท่านั้น **ไม่บันทึกลง DB**
 * ผลลัพธ์ที่ได้เอาไปให้หน้าบ้านตรวจ/แก้ แล้วส่งกลับมาที่ confirmLeads()
 *
 * **ตัวธุรกิจมาจาก Google Places ไม่ใช่ผลค้นหาเว็บ** — เดิมระบบเอาผลค้นหามาเป็น lead ตรง ๆ
 * ทำให้กระทู้ Pantip กลายเป็นชื่อบริษัท และธุรกิจกรุงเทพหลุดเข้ามาในผลของ "ขอนแก่น"
 * ตอนนี้ชื่อ/ที่อยู่/เบอร์/เว็บทางการ มาจากข้อมูลธุรกิจจริง ข่าวกับกระทู้จึงเข้ามาไม่ได้ตั้งแต่ต้นทาง
 *
 * `limit` = จำนวน lead ที่ **อยู่ในพื้นที่ที่ขอ และติดต่อได้จริง** ไม่ใช่จำนวนผลค้นหา
 * ธุรกิจที่นอกพื้นที่ / ไม่มีเว็บ / ยืนยันพื้นที่ไม่ได้ / ไม่มี contact ไม่นับเข้าโควตา
 * แต่คืนไปในถังของตัวเองทั้งหมดเพื่อให้เห็นว่าระบบเจออะไรบ้าง
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
  const needsReview: { reason: ReviewReason; lead: LeadCandidate }[] = [];
  const rejected: { reason: RejectReason; companyName: string; address: string | null }[] = [];
  const skipped = [];
  const failed = [];

  // cid = ตัวตนธุรกิจใน Google กันซ้ำได้แม่นกว่า domain (โรงเรียนหลายแห่งใช้เว็บโฮสต์ร่วมกัน)
  const seenPlaces = new Set<string>();
  // domain มี unique index ใน DB — สองธุรกิจที่ domain ชนกันจะทับกันตอน confirm จึงกันไว้ตั้งแต่ตรงนี้
  const seenDomains = new Set<string>();

  let searchedPages = 0;
  let emptyPages = 0;
  let exhausted = false;
  // Google Maps ขอหน้าถัดไปไม่ได้ถ้าไม่บอกพิกัด — เก็บค่าที่หน้าก่อนหน้าคืนมาแล้วส่งต่อ
  let cursor: string | null = null;

  // ความคืบหน้าวัดจาก "ได้ lead ที่ใช้ได้กี่ราย" เพราะนั่นคือสิ่งที่ limit นับ
  const report = (step: GenerateStep, message: string) =>
    onProgress?.({
      step,
      current: leads.length,
      total: limit,
      progress: Math.min(100, Math.round((leads.length / limit) * 100)),
      message
    });

  for (let page = 1; page <= maxSearchPages && leads.length < limit; page++) {
    report("search", `ค้นธุรกิจหน้า ${page}`);

    const { places, hasMore, cursor: nextCursor } = await searchPlaces(keyword, location, page, cursor);
    searchedPages = page;
    cursor = nextCursor;

    if (places.length === 0) {
      exhausted = true;
      break;
    }

    const before = leads.length;

    for (const place of places) {
      if (leads.length >= limit) break;

      // --- ธุรกิจซ้ำ ---
      if (place.cid) {
        if (seenPlaces.has(place.cid)) continue;
        seenPlaces.add(place.cid);
      }

      // --- location เป็นเงื่อนไขตายตัว ตรวจจากที่อยู่จริง ไม่ใช่จากคำค้น ---
      const locationStatus = verifyLocation(place.address, location);

      if (locationStatus === "outside_location") {
        rejected.push({ reason: "outside_location", companyName: place.title, address: place.address });
        continue;
      }

      const website = place.website ? normalizeUrl(place.website) : null;
      const domain = website ? getDomain(website) : null;

      // --- ไม่มีเว็บทางการ = ไม่มี domain ให้บันทึก (DB คีย์ด้วย domain) ---
      if (!website || !domain) {
        needsReview.push({ reason: "no_website", lead: buildLead(place, industry, null, null, locationStatus) });
        continue;
      }

      if (seenDomains.has(domain)) {
        rejected.push({ reason: "duplicate_domain", companyName: place.title, address: place.address });
        continue;
      }
      seenDomains.add(domain);

      try {
        // เช็คก่อน crawl เพื่อไม่ให้เสียค่า AI กับ domain ที่มีข้อมูลอยู่แล้ว
        if (!refresh) {
          const existing = await LeadModel.findOne({ domain });

          if (existing) {
            skipped.push(existing);
            continue;
          }
        }

        // Places ให้ชื่อ/ที่อยู่/เบอร์มาแล้ว เข้าเว็บเพื่อหา "อีเมล" กับลิงก์ social เป็นหลัก
        report("crawl", `กำลังอ่านเว็บ ${domain}`);

        const pages = await crawlSite(website);

        report("extract", `กำลังดึงข้อมูลติดต่อจาก ${domain}`);

        const text = pages.map((crawled) => crawled.text).join("\n\n");
        const links = pages.flatMap((crawled) => crawled.links);
        const extracted = await extractLead(text, website, links, aiModel);

        const lead = buildLead(place, industry, website, domain, locationStatus, {
          email: extracted.email,
          phone: extracted.phone,
          address: extracted.address,
          industryDetail: extracted.industry,
          links
        });

        // ยืนยันพื้นที่ไม่ได้ = ยังไม่ถือว่าใช่ ไม่นับเข้าโควตา แต่คืนไปให้คนตัดสินเอง
        if (locationStatus === "unknown") {
          needsReview.push({ reason: "unknown_location", lead });
          continue;
        }

        // ไม่มีทั้งเบอร์และอีเมล = Sales เอาไปติดต่อไม่ได้ จึงไม่นับเข้าโควตา limit
        (lead.contactStatus === "no_contact" ? noContact : leads).push(lead);
      } catch (error) {
        failed.push({ url: website, message: (error as Error).message });
      }
    }

    // หน้านี้ไม่ได้ lead ใหม่เลย — ไล่ต่อได้อีกไม่เกิน maxEmptyPages แล้วหยุด ดีกว่าถมของคุณภาพต่ำ
    emptyPages = leads.length > before ? 0 : emptyPages + 1;

    if (emptyPages >= maxEmptyPages) break;

    if (!hasMore) {
      exhausted = true;
      break;
    }
  }

  report("complete", `ได้ lead ที่ใช้ได้ ${leads.length} จาก ${limit} ราย`);

  const enough = leads.length >= limit;
  // ยิงซ้ำแล้วมีโอกาสได้เพิ่มไหม — ชนเพดานหน้าทั้งที่ผลยังไม่หมด = ยังมีของให้ไล่ต่อ
  const canContinue = !enough && !exhausted && emptyPages < maxEmptyPages && searchedPages >= maxSearchPages;

  return {
    model: aiModel,
    requested: limit,
    searchedPages,
    canContinue,
    suggestion: suggest({ enough, exhausted, canContinue, rejected: rejected.length }),
    summary: summarize(leads, noContact, needsReview, rejected.length),
    leads,
    noContact,
    needsReview,
    rejected,
    skipped,
    failed
  };
}

/**
 * ประกอบ lead 1 ราย โดย **เชื่อข้อมูลจาก Google Places ก่อนเสมอ** แล้วค่อยเติมจากเว็บ
 * (สเปก: prefer deterministic source data — ชื่อ/ที่อยู่/เบอร์ ของ Places มาจากข้อมูลธุรกิจจริง
 * ส่วนที่ AI อ่านจากหน้าเว็บใช้เฉพาะช่องที่ Places ไม่มี ซึ่งในทางปฏิบัติคืออีเมลเกือบทั้งหมด)
 *
 * `companyName` มาจาก Places เท่านั้น — เดิมใช้ title ของผลค้นหาเป็นตัวสำรอง
 * ทำให้กระทู้ "ช่วยแนะนำโรงเรียนในขอนแก่น" กลายเป็นชื่อบริษัท
 */
function buildLead(
  place: PlaceResult,
  industry: string,
  website: string | null,
  domain: string | null,
  locationStatus: LeadCandidate["locationStatus"],
  fromSite?: {
    email: string | null;
    phone: string | null;
    address: string | null;
    industryDetail: string | null;
    links: string[];
  }
): LeadCandidate {
  const mapsReference = place.cid
    ? { type: "directory" as const, url: `https://www.google.com/maps?cid=${place.cid}`, name: "Google Maps" }
    : null;
  const siteReference = website ? { type: "official_website" as const, url: website } : null;

  const placePhone = phoneOrNull(place.phone);
  const phone = placePhone ?? phoneOrNull(fromSite?.phone ?? null);
  const email = emailOrNull(fromSite?.email ?? null);
  const address = place.address ?? fromSite?.address ?? null;

  const references: LeadReference[] = [];

  if (siteReference) references.push(siteReference);
  if (mapsReference) references.push(mapsReference);
  references.push(...socialReferences(fromSite?.links ?? [], domain, references));

  // แหล่งของแต่ละช่อง — Sales จะได้รู้ว่าเบอร์นี้มาจาก Google Maps หรือจากเว็บบริษัท
  const phoneSource = placePhone ? mapsReference : siteReference;
  const contactSources: LeadCandidate["contactSources"] = {};

  if (phone && phoneSource) contactSources.phone = phoneSource;
  if (email && siteReference) contactSources.email = siteReference;
  if (address && mapsReference) contactSources.address = mapsReference;

  return {
    companyName: place.title,
    industry,
    // หมวดจาก Google เป็นข้อมูลจริง ส่วนของ AI เป็นการตีความ จึงเอาของ Google ก่อน
    industryDetail: place.category ?? fromSite?.industryDetail ?? null,
    website: website ?? "",
    domain: domain ?? "",
    phone,
    email,
    address,
    contactStatus: toContactStatus(phone, email),
    locationStatus,
    references: references.slice(0, maxReferences),
    contactSources
  };
}

/**
 * ลิงก์ social/directory ที่กิจการวางไว้บนเว็บตัวเอง = แหล่งอ้างอิงที่เชื่อได้ว่าเป็นของกิจการนั้นจริง
 * (ได้มาฟรีจากการ crawl ที่ทำอยู่แล้ว ไม่ต้องเปิดหน้า social เพิ่ม)
 */
function socialReferences(links: string[], domain: string | null, existing: LeadReference[]) {
  const seen = new Set(existing.map((reference) => reference.url));
  const references: LeadReference[] = [];

  for (const link of links) {
    const linkDomain = getDomain(link);

    // ลิงก์ในเว็บตัวเองไม่ใช่ "แหล่งอ้างอิง" และปุ่มแชร์ก็ไม่ได้ชี้ไปที่เพจของกิจการ
    if (!linkDomain || linkDomain === domain) continue;
    if (/sharer|\/share|intent\/|plugins\//i.test(link)) continue;

    const type = classifySource(link);

    if (type === "official_website" || type === "other") continue;

    const url = normalizeUrl(link);

    if (seen.has(url)) continue;

    seen.add(url);
    references.push({ type, url });
  }

  return references;
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

/** ได้ไม่ครบแล้วควรบอกผู้ใช้ว่าอะไร — ดีกว่าเงียบ ๆ แล้วคืนผลคุณภาพต่ำมาถมให้ครบ */
function suggest(state: {
  enough: boolean;
  exhausted: boolean;
  canContinue: boolean;
  rejected: number;
}): GenerateSuggestion | null {
  if (state.enough) return null;
  if (state.canContinue) return "search_again";

  // ผลหมดทั้งที่ตัดออกไปเยอะ = พื้นที่นี้มีธุรกิจตรงคำค้นน้อย ให้ขยายพื้นที่
  return state.exhausted || state.rejected > 0 ? "expand_scope" : "try_other_keyword";
}

/**
 * สรุปคุณภาพของรอบนี้ นับเฉพาะธุรกิจที่ผ่านการตรวจแล้ว (`skipped` ไม่ผ่าน AI และ `failed` ไม่มีข้อมูล)
 *
 * `withBoth` เท่ากับ `contactable` เสมอตามนิยาม เก็บไว้ทั้งคู่เพราะคนละมุมการอ่าน:
 * `contactable` คือสถานะของ lead ส่วน `withPhone`/`withEmail`/`withBoth` คือความครบของช่องทาง
 */
function summarize(
  leads: LeadCandidate[],
  noContact: LeadCandidate[],
  needsReview: { lead: LeadCandidate }[],
  rejected: number
) {
  const companies = [...leads, ...noContact];
  const countBy = (status: ContactStatus) => companies.filter((c) => c.contactStatus === status).length;

  return {
    companiesFound: companies.length,
    contactable: countBy("contactable"),
    partial: countBy("partial"),
    noContact: noContact.length,
    withPhone: companies.filter((c) => c.phone).length,
    withEmail: companies.filter((c) => c.email).length,
    withBoth: companies.filter((c) => c.phone && c.email).length,
    /** ธุรกิจที่เจอแต่ยังไม่ผ่าน — ยืนยันพื้นที่ไม่ได้ หรือไม่มีเว็บทางการ */
    needsReview: needsReview.length,
    /** ตัดทิ้งเพราะอยู่นอกพื้นที่ที่ขอ หรือ domain ซ้ำกับรายที่รับไปแล้ว */
    rejected
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
