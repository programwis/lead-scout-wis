import { getDomain } from "tldts";

export { getDomain };

const excludedDomains = new Set([
  // social
  "facebook.com",
  "instagram.com",
  "youtube.com",
  "linkedin.com",
  "tiktok.com",
  "x.com",
  "twitter.com",
  "line.me",
  "pinterest.com",
  // สารานุกรม / directory / เว็บรีวิว / ฐานข้อมูลบริษัท — เป็นหน้ารวมข้อมูลคนอื่น ไม่ใช่เว็บของบริษัทเอง
  "wikipedia.org",
  "trustpilot.com",
  "dataforthai.com",
  "companieshouse.gov.uk",
  "crunchbase.com",
  "zoominfo.com",
  "dnb.com",
  "opencorporates.com",
  "kompass.com",
  "thailandbusinessdirectory.com",
  "yellowpages.co.th",
  "yellowgreenthailand.com",
  "wongnai.com",
  "กรมพัฒนาธุรกิจการค้า.com",
  // เว็บหางาน — โผล่บ่อยมากกับคำค้นแนว "โรงงาน/บริษัท" แต่ไม่ใช่เว็บบริษัท
  "jobsdb.com",
  "jobthai.com",
  "jobbkk.com",
  "jobtopgun.com",
  "indeed.com",
  "glassdoor.com",
  // บล็อกสำเร็จรูป — ข้อมูลติดต่อที่เจอมักเป็น placeholder ของเทมเพลต (เช่น your@email.com)
  "blogspot.com",
  "wordpress.com",
  "blogger.com",
  "medium.com",
  // marketplace — หน้าร้านไม่ใช่เว็บบริษัท
  "shopee.co.th",
  "lazada.co.th",
  "alibaba.com",
  "made-in-china.com"
]);

/**
 * โดเมนราชการ/สถาบันการศึกษา — ไล่ใส่ทีละชื่อไม่มีวันครบ (เจอมาแล้วทั้ง mod.go.th, opsmoac.go.th, ...)
 * จึงตัดทั้ง suffix แทน
 */
const excludedSuffixes = [".go.th", ".ac.th", ".gov", ".edu"];

export function isBusinessWebsite(url: string) {
  try {
    const domain = getDomain(url);

    if (!domain || excludedDomains.has(domain)) return false;

    return !excludedSuffixes.some((suffix) => domain.endsWith(suffix));
  } catch {
    return false;
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