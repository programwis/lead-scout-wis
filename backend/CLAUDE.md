# LeadScout — คู่มือสำหรับ AI agent

ไฟล์นี้ครอบคลุม **backend เท่านั้น** (โฟลเดอร์นี้) — path ทั้งหมดข้างล่างอ้างอิงจากโฟลเดอร์นี้

ระบบหา lead ธุรกิจ: keyword → Serper → กรองเว็บ → Playwright crawl → Claude ดึงข้อมูลติดต่อ → MongoDB
**เป้าหมายคือ contact ที่ Sales ติดต่อได้จริง ไม่ใช่แค่หาเว็บบริษัทเจอ** — บริษัทที่ไม่มีเบอร์และอีเมลไม่นับเป็นผลงาน
คู่มือฉบับคนอ่าน (โฟลว์/ราคา/ตัวอย่าง API) อยู่ที่ `README.md` ข้าง ๆ กัน
ผู้ใช้สื่อสารภาษาไทย — ตอบภาษาไทย

## คำสั่ง

รันทุกคำสั่งจากโฟลเดอร์นี้ (`backend/`) ไม่ใช่ root ของ repo

```bash
npm run dev           # tsx watch
npm run build         # tsc -> dist/
npx tsc --noEmit      # ★ ใช้ตรวจงานหลังแก้โค้ดทุกครั้ง (โปรเจกต์นี้ไม่มี test framework)
npx playwright install chromium   # ครั้งเดียวต่อเครื่อง
```

## กฎสถาปัตยกรรม (ข้อสำคัญที่สุด)

```
route → controller → service → model / external API
```

**ห้ามเพิ่ม**: repository, use case, DTO, DI container, factory, abstract class, interface ต่อทุก class,
layer ที่ทำหน้าที่ forward call เฉย ๆ, โฟลเดอร์ที่ไม่มีหน้าที่จริง

- **service = ฟังก์ชัน export ธรรมดา ไม่ใช่ class** — `LeadController` เป็น class เดียวในโปรเจกต์
- controller ห้ามเรียก Serper / Playwright / mongoose ตรง ๆ ให้เรียกผ่าน service
- ฟังก์ชันสั้นที่ใช้ที่เดียว เก็บไว้ในไฟล์นั้น อย่าย้ายไป `utils/`
- `utils/` = ฟังก์ชันเล็ก ไม่มี state ห้ามแตะ DB / API / browser

## ไฟล์และหน้าที่

| ไฟล์ | หน้าที่ | ห้ามมีอะไร |
|---|---|---|
| `config/env.ts` | รวม `process.env` + ค่า default ของโมเดล AI + `aiModels` (ลิสต์โมเดลที่ `/generate` เลือกได้) | logic อื่น |
| `routes/lead.routes.ts` | ผูก path กับ controller | logic |
| `controllers/lead.controller.ts` | อ่าน body/query, validate, เรียก service | business logic |
| `services/lead.service.ts` | คุมโฟลว์ generate / confirm / list | รายละเอียดของ Serper, Playwright, Claude |
| `services/search.service.ts` | Serper เท่านั้น (รวมการแบ่งหน้า — รับ `page`, คืน `{ results, hasMore }`) | อย่างอื่น |
| `services/crawler.service.ts` | Playwright เท่านั้น | DB, AI |
| `services/ai.service.ts` | Claude เท่านั้น (structured output ด้วย Zod) | Fastify, DB |
| `models/lead.model.ts` | Mongoose schema + index | crawl, AI, HTTP |
| `types/*.type.ts` | type ที่ใช้ร่วมกัน (`progress.type.ts` = โครง progress ที่เตรียมไว้ ยังไม่มีใครใช้) | - |
| `utils/{url,text}.utils.ts` | helper เล็ก ๆ | ทุกอย่างข้างบน |

## โฟลว์ที่ต้องเข้าใจก่อนแก้ lead.service.ts

- `generateLeads()` = **อ่าน DB อย่างเดียว** (เช็คว่า domain มีแล้วไหมเพื่อข้าม ไม่ให้เปลืองค่า AI) แล้วคืน `LeadCandidate[]` ที่ยังไม่บันทึก
- **`limit` = จำนวน lead ที่ *ติดต่อได้* ไม่ใช่จำนวนเว็บที่หยิบจากผลค้นหา** — ระหว่างทางเว็บหล่นได้ 4 ทาง
  (โดนกรองทิ้ง / domain มีใน DB แล้ว / crawl ไม่ผ่าน / หา contact ไม่เจอ) `generateLeads()` จึงวนขอ
  Serper หน้าถัดไปมาเติมจนครบ `limit` หรือชน `maxSearchPages` (5 หน้า — hard limit ห้ามถอด)
  `seenDomains` ต้องอยู่นอกลูปหน้า ไม่งั้น domain ที่โผล่ซ้ำในหน้าถัด ๆ ไปจะโดน crawl ซ้ำ
- **`contactStatus` backend คำนวณเอง ห้ามให้ AI ตอบ** — `contactable` (มีทั้งเบอร์และอีเมล) /
  `partial` (มีอย่างเดียว) / `no_contact` (ไม่มีเลย) เป็นเงื่อนไขตายตัว ถ้าให้ AI ตัดสินจะไม่คงเส้นคงวา
  เข้าโควตา `limit` เฉพาะ `contactable` + `partial` ส่วน `no_contact` ไปกอง `noContact` แยก
- คืน `requested` / `searchedPages` / `summary` ไปด้วยให้หน้าบ้านรู้ว่าทำไมได้ไม่ครบ
  `summary` นับเฉพาะบริษัทที่ crawl + extract สำเร็จ (`leads` + `noContact`) — `skipped` ไม่ผ่าน AI
  และ `failed` ไม่มีข้อมูล จึงไม่มีอะไรให้นับ · `summary.withBoth` เท่ากับ `summary.contactable` เสมอ
  ตามนิยาม เก็บทั้งคู่ตามที่ผู้ใช้กำหนดสเปกไว้ ไม่ใช่ของหลงเหลือ
- **progress ยังไม่ได้ต่อกับอะไร** — `generateLeads()` รับ `onProgress?` แล้วยิง `GenerateProgress`
  (`types/progress.type.ts`) ทุกครั้งที่ขยับ step ตอนนี้ controller ไม่ส่งมา จึงไม่มีอะไรทำงานเพิ่ม
  **อย่าเพิ่ง**ทำ SSE/WebSocket หรือแปลง `/generate` เป็น job queue จนกว่าจะมีหน้าบ้านและผู้ใช้สั่ง
- **โมเดล AI เลือกได้เป็นราย request** — `model` ใน body ของ `/generate` > `AI_MODEL` ใน `.env` > `defaultAiModel`
  controller validate ว่าอยู่ใน `aiModels` ก่อน (ผิด = 400 ทันที ไม่ปล่อยไปพังที่ Anthropic กลางทาง)
  แล้ว `generateLeads()` ส่งต่อให้ `extractLead(..., model)` และคืนชื่อโมเดลที่ใช้จริงกลับไปในผลลัพธ์ด้วย
  `GET /api/leads/models` คืนลิสต์นี้ให้หน้าบ้านทำ dropdown
- `confirmLeads()` = **เขียน DB อย่างเดียว** upsert ตาม `domain` ไม่ crawl ไม่เรียก AI
- ระหว่าง 2 ขั้นนี้ หน้าบ้านถือข้อมูลไว้เอง backend ไม่เก็บ draft

## กติกาการเขียนโค้ด

- **ESM**: `import` ต้องลงท้าย `.js` เสมอ แม้ไฟล์จริงจะเป็น `.ts`
- `verbatimModuleSyntax` เปิด → import ที่เป็น type ต้องใช้ `import type`
- `exactOptionalPropertyTypes` เปิด → **ห้าม assign `undefined` ให้ฟิลด์ที่ประกาศว่า `x?: string`**
  ถ้าจำเป็นให้สร้าง object โดยไม่ใส่ key นั้น หรือใช้ type ที่เป็น `string | null` แทน
- tsconfig **ไม่มี lib `dom`** → ใน `page.locator(...).evaluateAll()` ห้ามใช้ `HTMLAnchorElement`
  ให้ cast เป็น `(element as { href: string })`
- อ่าน env จาก `config/env.ts` เท่านั้น ห้ามใช้ `process.env` กระจายในไฟล์อื่น
- คอมเมนต์: ภาษาไทยสำหรับเหตุผลเชิงธุรกิจ/กับดัก, อังกฤษสั้น ๆ สำหรับเรื่องเทคนิค (ทำตามที่มีอยู่)

## กับดักที่เคยทำให้พังมาแล้ว — อย่าทำซ้ำ

1. **`output_config.effort`** — `claude-haiku-4-5` และ `claude-sonnet-4-5` ไม่รองรับ ส่งไปจะได้
   `400 This model does not support the effort parameter.` `ai.service.ts` มีฟังก์ชัน `supportsEffort()`
   เช็คให้ทุกครั้งที่เรียก (ไม่ใช่ครั้งเดียวตอน import — เพราะโมเดลเปลี่ยนได้ทุก request)
   ถ้าเพิ่มโมเดลใหม่ที่ไม่รองรับ ให้เติมชื่อในลิสต์ `modelsWithoutEffort`
   **ลิสต์นี้แยกจาก `aiModels` ใน `config/env.ts` โดยตั้งใจ** เพราะ `AI_MODEL` ใน `.env` ใส่ชื่ออะไรก็ได้
   ที่ไม่อยู่ใน `aiModels` — `supportsEffort()` จึงต้องรับ string อิสระได้
2. **mongoose ตัด key ที่เป็น `undefined` ออกจาก `$set` อัตโนมัติ** — โปรเจกต์นี้**ตั้งใจ**ใช้พฤติกรรมนี้
   ผ่านฟังก์ชัน `optional()` (ค่าว่าง → `undefined`) เพื่อให้ "เว้นว่าง = ไม่ทับของเดิม"
   **ห้ามเปลี่ยนไปส่ง `null`** เพราะ `null` จะเขียนทับข้อมูลเดิมให้หาย
3. **`innerText` ไม่เห็นอีเมลใน `mailto:`** — อีเมลส่วนใหญ่ซ่อนใน href ไม่ใช่ข้อความ
   `lead.service.ts` จึงส่ง `pages.flatMap(p => p.links)` เข้า `extractLead()` ด้วย อย่าตัดออก
4. **`domain` มี unique index** — ห้ามบันทึก lead ที่ `domain` เป็น `null`/ว่าง จะชนกันเอง
5. **AI ต้องไม่เดาข้อมูล** — system prompt สั่งให้คืน `null` เมื่อหาไม่เจอ อย่าแก้ให้ "เดาจากชื่อโดเมน"
   เพราะจะได้อีเมลที่ส่งไม่ถึงจริง
6. **`hasMore` ของ `searchWeb()` ห้ามคิดจาก `results.length`** — หน้าที่โดนกรองทิ้งหมดก็ได้ `results` ว่าง
   เหมือนหน้าที่ Serper ไม่มีผลแล้ว ถ้าใช้ `results.length` ตัดสิน ลูปจะหยุดไล่หน้าทั้งที่หน้าถัดไป
   ยังมีเว็บบริษัทอยู่ (เจอจริง: หน้า 1 ของคำค้นไทยกรองเหลือ 6 จาก 10)
7. **AI เอา `mailto:` มาใส่ช่อง `phone`** — เจอจริง: `phone = "mailto:pr@example.com, ..."` ทำให้ lead
   ถูกตีเป็น `partial` ทั้งที่ไม่มีเบอร์ให้โทร `lead.service.ts` จึงล้างค่าก่อนคิด `contactStatus` ด้วย
   `phoneOrNull()` (ต้องมีตัวเลขและห้ามมี `@`) กับ `emailOrNull()` (ต้องมี `@` ตัด `mailto:` ทิ้ง)
   **อย่าเอาออก** ไม่งั้น `contactStatus` จะโกหก ซึ่งทำให้ `limit` นับผิดตามไปด้วย
8. **ตัวกรอง `isBusinessWebsite()` กันขยะที่มากับการไล่หน้า** — พอบังคับให้ได้ครบ `limit` ระบบจะไล่ลงไป
   หน้าลึก ๆ ที่มีแต่เว็บหางาน / บล็อกสำเร็จรูป / ราชการ ถ้าไม่กรองจะได้ครบจำนวนแต่เป็นขยะและเสียค่า AI ฟรี
   (Blogspot คืน `your@email.com` ที่เป็น placeholder ของเทมเพลตมาแล้ว) เจอโดเมนขยะใหม่ให้เติมที่
   `excludedDomains` / `excludedSuffixes` ใน `utils/url.utils.ts`

## วิธีตรวจงานเมื่อเครื่องไม่มี MongoDB

เครื่อง dev มักไม่มี mongod รันอยู่ ใช้วิธีเหล่านี้แทนการรันจริง:

```bash
npx tsc --noEmit                       # ตรวจ type ทั้งโปรเจกต์
```
- **ทดสอบ route/validation**: เขียนไฟล์ `.mts` ชั่วคราวในโฟลเดอร์นี้ แล้วใช้ `app.inject()` ของ Fastify
  (ไม่ต้องต่อ DB) แล้วลบไฟล์ทิ้ง — ต้องเป็น `.mts` เพราะ tsx จะมองไฟล์ `.ts` นอก package เป็น CJS แล้ว top-level await พัง
- **ตรวจว่า update ที่จะส่งเข้า Mongo หน้าตาเป็นยังไง**: `query._castUpdate(query.getUpdate(), false)`
- **ทดสอบ AI จริง**: `curl` ไป `api.anthropic.com` หรือ import `extractLead` จาก `dist/`
  โดยอ่าน key จาก `.env` — โมเดล default ราคาถูกมาก การยิงทดสอบไม่กี่ครั้งไม่ถึงสตางค์

## อย่าทำ

- อย่าเปลี่ยนโมเดล AI เองโดยไม่บอกผู้ใช้ (ตั้งที่ `aiModels` / `defaultAiModel` ใน `config/env.ts` หรือ `AI_MODEL` ใน `.env`)
- อย่า commit / push ถ้าผู้ใช้ไม่ได้สั่ง
- อย่าเอาค่าใน `.env` ไป log, hardcode, หรือส่งออกนอกโปรเจกต์
- อย่าแก้ README แล้วปล่อยให้ตัวเลขราคา/ชื่อโมเดลไม่ตรงกับโค้ด — สองไฟล์นี้ต้องตรงกันเสมอ
