export interface Lead {
  companyName: string;
  /** ค้นพบธุรกิจนี้มาจากแหล่งไหน */
  sourceType?: LeadSourceType;
  /** ชื่อหมวดที่อิง keyword ที่ค้น — เหมือนกันทุกแถวที่มาจาก keyword เดียวกัน ใช้ filter */
  industry?: string;
  /** ประเภทธุรกิจตามที่ AI อ่านได้จากเว็บจริง — ข้อมูลดิบ ไม่ได้ใช้ filter */
  industryDetail?: string;
  website?: string;
  domain?: string;
  phone?: string;
  email?: string;
  address?: string;
}

/**
 * ระบบค้นพบธุรกิจนี้มาจากแหล่งไหน — **คนละเรื่องกับ `SourceType` ข้างล่าง**
 * ตัวนี้อยู่ระดับ lead (ค้นเจอจากไหน) ส่วน `SourceType` อยู่ระดับ URL (หน้านั้นเป็นแหล่งชนิดไหน)
 * ตอนนี้มีทางเดียวคือ Google Maps ผ่าน Serper
 */
export type LeadSourceType = "google_maps";

/**
 * บทบาทของหน้าเว็บหนึ่ง ๆ ต่อ lead — **ไม่ใช่ blacklist**
 * เว็บข่าว/กระทู้/wiki ไม่ได้ "ไร้ค่า" มันแค่ไม่ใช่ตัวธุรกิจ ใช้เป็นแหล่งอ้างอิงได้
 * ตัวธุรกิจมาจาก Google Places เท่านั้น ตัวนี้จึงมีไว้จัดประเภท `references` และผลของ `/search`
 */
export type SourceType =
  | "official_website"
  | "social"
  | "directory"
  | "search"
  | "government"
  | "reference"
  | "news"
  | "other";

/** แหล่งที่ใช้ยืนยัน/เสริมข้อมูลของ lead — เก็บ URL ไว้ให้ Sales ตามกลับไปดูได้ */
export interface LeadReference {
  type: SourceType;
  url: string;
  name?: string;
}

/**
 * ผลการตรวจว่าธุรกิจอยู่ในพื้นที่ที่ขอจริงไหม — **backend ตรวจเอง ไม่ให้ AI เดา**
 * ตรวจจากที่อยู่จริงของธุรกิจ (Google Places) ไม่ใช่จากการที่หน้าเว็บพูดถึงจังหวัดนั้น
 *
 * - `verified` — ที่อยู่ระบุพื้นที่ที่ขอ
 * - `outside_location` — ที่อยู่ระบุจังหวัดอื่นชัดเจน → ตัดทิ้ง
 * - `unknown` — หลักฐานไม่พอ → ไม่นับเป็น lead แต่คืนไปให้ตรวจเอง
 */
export type LocationStatus = "verified" | "outside_location" | "unknown";

/**
 * คุณภาพของข้อมูลติดต่อ — **backend คำนวณเองหลัง AI extract เสร็จ ห้ามให้ AI เป็นคนตัดสิน**
 * เพราะ AI จะ "ตีความ" ไม่คงเส้นคงวา ทั้งที่กติกาเป็นเงื่อนไขตายตัวจาก phone/email ที่ได้มา
 *
 * - `contactable` — มีทั้งเบอร์และอีเมล
 * - `partial` — มีอย่างใดอย่างหนึ่ง
 * - `no_contact` — ไม่มีเลย ติดต่อไม่ได้ Sales เอาไปใช้ไม่ได้
 */
export type ContactStatus = "contactable" | "partial" | "no_contact";

/**
 * ผลลัพธ์จาก /generate ที่ยัง "ไม่ได้บันทึก" — รอหน้าบ้านตรวจ/แก้ แล้วส่งกลับมาที่ /confirm
 * ฟิลด์ที่หาไม่เจอเป็น null (ไม่ใช่หายไป) เพื่อให้ฟอร์มฝั่งหน้าบ้านรู้ว่ามีช่องนี้แต่ยังว่าง
 */
export interface LeadCandidate {
  companyName: string;
  /** ค้นพบมาจากไหน — ให้หน้าบ้าน/analytics รู้ที่มาโดยไม่ต้องเดาจาก references */
  sourceType: LeadSourceType;
  industry: string;
  industryDetail: string | null;
  /**
   * เว็บทางการของกิจการ — `null` ได้ ธุรกิจจำนวนมากใน Google Maps ไม่มีเว็บแต่มีเบอร์ให้โทร
   * **ห้ามใช้การมีเว็บเป็นเงื่อนไขของการเป็น lead** ตัวตนธุรกิจมาจาก Google Maps อยู่แล้ว
   * เว็บมีไว้ใช้ enrich (หาอีเมล/ลิงก์ social) เท่านั้น
   */
  website: string | null;
  domain: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  /** คำนวณจาก phone/email ข้างบน ไม่ได้มาจาก AI */
  contactStatus: ContactStatus;
  /** ตรวจจากที่อยู่จริงเทียบกับ `location` ที่ขอมา */
  locationStatus: LocationStatus;
  /** เว็บทางการ + social/directory ที่ใช้ยืนยัน — `website` ข้างบนต้องเป็นเว็บทางการเสมอ ห้ามเอา reference มาแทน */
  references: LeadReference[];
  /** ฟิลด์ไหนมาจากแหล่งไหน — ไว้ให้ Sales รู้ว่าเบอร์นี้เอามาจาก Google Maps หรือจากเว็บบริษัท */
  contactSources: {
    phone?: LeadReference;
    email?: LeadReference;
    address?: LeadReference;
  };
}

/** What the AI returns. Missing information is null, never invented. */
export interface ExtractedLead {
  companyName: string | null;
  industry: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
}
