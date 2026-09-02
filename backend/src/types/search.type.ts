export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

/** ผลค้นหา 1 หน้าจาก Serper */
export interface SearchPage {
  /** ผลลัพธ์ที่ผ่านการกรองเว็บ social/directory แล้ว — อาจว่างทั้งที่ยังมีหน้าถัดไป */
  results: SearchResult[];
  /**
   * Serper ยังคืนผลดิบอยู่ไหม (ยังไม่ถึงหน้าสุดท้าย)
   * แยกจาก `results.length` เพราะหน้าที่โดนกรองทิ้งหมดก็ได้ `results` ว่างเหมือนกัน
   * ถ้าใช้ `results.length` ตัดสิน จะหยุดไล่หน้าทั้งที่หน้าถัดไปยังมีเว็บบริษัทอยู่
   */
  hasMore: boolean;
}
