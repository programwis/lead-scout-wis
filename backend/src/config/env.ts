import "dotenv/config";

/**
 * โมเดลที่หน้าบ้านเลือกได้ตอนเรียก /generate (ส่งมาที่ฟิลด์ `model`)
 * ไม่ส่งมา = ใช้ `env.aiModel` ข้างล่าง
 *
 * ราคาต่อ 1 ล้าน token — แก้ตรงนี้แล้วต้องแก้ตาราง "เลือกโมเดลไหนดี" ใน README ให้ตรงกันด้วย
 */
export const aiModels = {
  "claude-haiku-4-5": {
    label: "Haiku 4.5",
    inputPricePerMTok: 1,
    outputPricePerMTok: 5,
    note: "ถูกสุด เพียงพอกับงานดึงข้อมูลติดต่อทั่วไป"
  },
  "claude-sonnet-5": {
    label: "Sonnet 5",
    inputPricePerMTok: 2,
    outputPricePerMTok: 10,
    note: "เว็บที่ข้อมูลกระจัดกระจาย ต้องตีความมากขึ้น"
  },
  "claude-opus-5": {
    label: "Opus 5",
    inputPricePerMTok: 5,
    outputPricePerMTok: 25,
    note: "เว็บซับซ้อนมาก หรือต้องการความแม่นสูงสุด"
  }
} as const;

/** ชื่อโมเดลที่ /generate ยอมรับ — มาจาก key ของ aiModels */
export type AiModel = keyof typeof aiModels;

/**
 * ใช้เมื่อ request ไม่ได้ส่ง model มา — เปลี่ยนได้ที่บรรทัดเดียวตรงนี้
 * หรือ override ด้วย AI_MODEL ใน .env โดยไม่ต้องแก้โค้ด (ใส่ชื่อโมเดลอะไรก็ได้
 * ไม่จำกัดแค่ 3 ตัวข้างบน — ลิสต์ข้างบนคุมเฉพาะค่าที่รับจาก request)
 */
const defaultAiModel: AiModel = "claude-haiku-4-5";

export const env = {
  port: Number(process.env.PORT) || 4000,
  mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/leadscout",
  serperApiKey: process.env.SERPER_API_KEY!,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY!,
  aiModel: process.env.AI_MODEL || defaultAiModel
};
