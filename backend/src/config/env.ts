import "dotenv/config";

/**
 * โมเดล AI ที่ใช้ดึงข้อมูลติดต่อ — เปลี่ยนได้ที่บรรทัดเดียวตรงนี้
 * หรือ override ด้วย AI_MODEL ใน .env โดยไม่ต้องแก้โค้ด
 *
 * ราคาต่อ 1 ล้าน token (input / output):
 *   claude-haiku-4-5   $1  / $5    ← default ถูกสุด เพียงพอกับงานดึงข้อมูลติดต่อ
 *   claude-sonnet-5    $2  / $10   ← กลาง ๆ ถ้าเจอเว็บที่ข้อมูลกระจัดกระจาย
 *   claude-opus-5      $5  / $25   ← ฉลาดสุด แพงสุด
 */
const defaultAiModel = "claude-haiku-4-5";

export const env = {
  port: Number(process.env.PORT) || 4000,
  mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/leadscout",
  serperApiKey: process.env.SERPER_API_KEY!,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY!,
  aiModel: process.env.AI_MODEL || defaultAiModel
};
