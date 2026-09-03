import type { SourceType } from "./lead.type.js";

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  /** จัดประเภทแทนการทิ้ง — ผู้เรียกตัดสินเองว่าจะใช้เป็นอะไร (ดู `SourceType`) */
  sourceType: SourceType;
}

/** ผลค้นหา 1 หน้าจาก Serper */
export interface SearchPage {
  results: SearchResult[];
  /**
   * Serper ยังคืนผลดิบอยู่ไหม (ยังไม่ถึงหน้าสุดท้าย)
   * แยกจาก `results.length` เพราะหน้าที่ไม่มีของที่ใช้ได้ก็ได้ `results` ว่างเหมือนกัน
   */
  hasMore: boolean;
}

/**
 * ธุรกิจ 1 รายจาก Google Places (ผ่าน Serper) — **นี่คือ "ตัวธุรกิจ" ของระบบ**
 * ต่างจากผลค้นหาเว็บตรงที่ชื่อ/ที่อยู่/เบอร์ มาจากข้อมูลธุรกิจจริง ไม่ใช่ title ของหน้าเว็บ
 * จึงเอามาตรวจ location และตั้งชื่อบริษัทได้โดยไม่ต้องให้ AI เดา
 */
export interface PlaceResult {
  /** id ของสถานที่ใน Google — ใช้กันธุรกิจซ้ำได้แม่นกว่า domain */
  cid: string | null;
  title: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  /** หมวดธุรกิจจาก Google เช่น "โรงเรียนมัธยมศึกษา" — ใช้เป็น industryDetail ได้เลย */
  category: string | null;
}

export interface PlacePage {
  places: PlaceResult[];
  hasMore: boolean;
  /**
   * ส่งค่านี้กลับเข้า `searchPlaces()` เพื่อขอหน้าถัดไป
   * Google Maps บังคับให้ระบุพิกัดเมื่อขอหน้า 2 ขึ้นไป (ไม่ส่ง = 400) ค่านี้จึงเป็นพิกัด
   * ที่คำนวณจากผลหน้าปัจจุบัน — รูปแบบข้างในเป็นเรื่องของ search.service ผู้เรียกแค่ส่งต่อ
   */
  cursor: string | null;
}
