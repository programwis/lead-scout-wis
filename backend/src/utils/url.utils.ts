import { getDomain } from "tldts";
import type { SourceType } from "../types/lead.type.js";

export { getDomain };

/**
 * ตารางจัดประเภทแหล่งข้อมูล — **ไม่ใช่ blacklist**
 *
 * เดิมไฟล์นี้เก็บ `excludedDomains` ไว้ทิ้งเว็บที่ "ไม่ใช่บริษัท" ซึ่งใช้ไม่ได้จริง 2 ทาง:
 * ไล่เติมชื่อไม่มีวันครบ (pantip / dek-d / wikiwand หลุดมาตลอด) และเผลอตัดเป้าหมายทิ้ง
 * (suffix `.ac.th` ตัดโรงเรียนไทยทุกโรงเรียน ทั้งที่ keyword คือ "โรงเรียน")
 *
 * ตอนนี้ตัวธุรกิจมาจาก Google Places อย่างเดียว ตารางนี้จึงเหลือหน้าที่เดียวคือบอกว่า
 * "หน้านี้เอาไปใช้เป็นอะไรได้" — เว็บข่าว/กระทู้ไม่ได้ถูกทิ้ง แค่ไม่ใช่ตัวธุรกิจ
 */
const domainTypes: [SourceType, string[]][] = [
  ["social", [
    "facebook.com", "instagram.com", "youtube.com", "linkedin.com", "tiktok.com",
    "x.com", "twitter.com", "line.me", "pinterest.com", "lin.ee"
  ]],
  ["directory", [
    "yellowpages.co.th", "yellowgreenthailand.com", "thailandbusinessdirectory.com",
    "dataforthai.com", "kompass.com", "crunchbase.com", "zoominfo.com", "dnb.com",
    "opencorporates.com", "companieshouse.gov.uk", "trustpilot.com", "wongnai.com",
    "google.com", "shopee.co.th", "lazada.co.th", "alibaba.com", "made-in-china.com",
    "jobsdb.com", "jobthai.com", "jobbkk.com", "jobtopgun.com", "indeed.com", "glassdoor.com",
    "thaischool.in.th"
  ]],
  ["reference", [
    "wikipedia.org", "wikiwand.com", "unionpedia.org", "dbpedia.org",
    "blogspot.com", "wordpress.com", "blogger.com", "medium.com"
  ]],
  ["news", [
    "mgronline.com", "thairath.co.th", "matichon.co.th", "dailynews.co.th", "khaosod.co.th",
    "posttoday.com", "bangkokpost.com", "nationthailand.com", "prachachat.net",
    "thansettakij.com", "komchadluek.net", "sanook.com", "kapook.com", "thaipbs.or.th"
  ]],
  // ฟอรัม/เว็บบอร์ด — สเปกไม่มีชนิด "forum" แยก จึงลงเป็น other (อ้างอิงได้อ่อนที่สุด)
  ["other", ["pantip.com", "reddit.com", "dek-d.com", "quora.com"]]
];

/** เว็บราชการ/หน่วยงานรัฐ — ไล่ใส่ทีละชื่อไม่มีวันครบ จึงดูจาก suffix */
const governmentSuffixes = [".go.th", ".gov", ".mi.th"];

/**
 * บอกว่าหน้าเว็บนี้ทำหน้าที่อะไรได้ ไม่ได้บอกว่า "ดี" หรือ "แย่"
 * domain ที่ไม่รู้จัก = ถือว่าเป็นเว็บของกิจการเอง (`official_website`) ซึ่งเป็นค่าที่พบบ่อยที่สุด
 */
export function classifySource(url: string): SourceType {
  try {
    const domain = getDomain(url);

    if (!domain) return "other";

    for (const [type, domains] of domainTypes) {
      if (domains.includes(domain)) return type;
    }

    if (governmentSuffixes.some((suffix) => domain.endsWith(suffix))) return "government";

    return "official_website";
  } catch {
    return "other";
  }
}

/** Lowercase host + path without trailing slash, used as the stored website. */
export function normalizeUrl(url: string) {
  try {
    const { protocol, hostname, pathname } = new URL(url);
    const path = pathname.replace(/\/+$/, "");

    return `${protocol}//${hostname.toLowerCase()}${path}`;
  } catch {
    return url;
  }
}
