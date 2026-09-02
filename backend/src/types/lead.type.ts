export interface Lead {
  companyName: string;
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
 * ผลลัพธ์จาก /generate ที่ยัง "ไม่ได้บันทึก" — รอหน้าบ้านตรวจ/แก้ แล้วส่งกลับมาที่ /confirm
 * ฟิลด์ที่หาไม่เจอเป็น null (ไม่ใช่หายไป) เพื่อให้ฟอร์มฝั่งหน้าบ้านรู้ว่ามีช่องนี้แต่ยังว่าง
 */
export interface LeadCandidate {
  companyName: string;
  industry: string;
  industryDetail: string | null;
  website: string;
  domain: string;
  phone: string | null;
  email: string | null;
  address: string | null;
}

/** What the AI returns. Missing information is null, never invented. */
export interface ExtractedLead {
  companyName: string | null;
  industry: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
}
