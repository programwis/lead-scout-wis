/** ขั้นตอนของ `/generate` 1 ครั้ง เรียงตามลำดับที่เกิดจริง */
export type GenerateStep = "search" | "filter" | "crawl" | "extract" | "complete";

/**
 * ความคืบหน้าของ `/generate`
 *
 * ตอนนี้ยังไม่มีหน้าบ้าน จึงยัง **ไม่มี** SSE/WebSocket — `generateLeads()` แค่รับ callback
 * `onProgress` ไว้เฉย ๆ ไม่ส่งมาก็ไม่มีอะไรเกิดขึ้น วันที่ทำ streaming จริงค่อยเอา callback
 * ไปต่อกับ transport ได้เลยโดยไม่ต้องรื้อโฟลว์ข้างใน (และไม่ต้องแปลง `/generate` เป็น job queue)
 */
export interface GenerateProgress {
  step: GenerateStep;
  /** ได้ lead ที่ติดต่อได้มาแล้วกี่ราย */
  current: number;
  /** เป้าหมาย = `limit` ที่ขอมา */
  total: number;
  /** 0–100 คิดจาก current/total */
  progress: number;
  message: string;
}
