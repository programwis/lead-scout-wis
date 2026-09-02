# LeadScout Backend

ระบบหา lead ธุรกิจอัตโนมัติ — พิมพ์ keyword เข้าไป ระบบจะไปหาเว็บบริษัทจาก Google, เข้าไปอ่านเว็บจริง, ให้ AI ดึงเบอร์/อีเมล/ที่อยู่ออกมา แล้วเก็บลงฐานข้อมูลให้

---

## โฟลว์การทำงาน

สมมติยิง `keyword: "โรงงานผลิตอาหาร"`, `location: "สมุทรปราการ"`, `limit: 5`

**1. ค้นหา** — ส่งคำค้นไปที่ Serper (Google Search API) ได้ผลลัพธ์กลับมา 10 อันดับแรก
→ `src/services/search.service.ts`

**2. คัดกรอง** — ทิ้งพวก Facebook / Instagram / YouTube / LinkedIn / TikTok / Wikipedia เพราะไม่ใช่เว็บบริษัท เหลือแต่เว็บไซต์จริง แล้วตัด domain ที่ซ้ำกันออก (1 บริษัท = 1 เว็บ) สุดท้ายหยิบมา 5 อันตาม `limit`
→ `src/utils/url.utils.ts`

**3. เข้าไปอ่านเว็บ** — เปิด browser จริง (Chromium) เข้าหน้าแรก ดูดข้อความทั้งหน้าออกมา แล้วมองหาลิงก์ที่มีคำว่า *contact / about / ติดต่อ / เกี่ยวกับ* ตามเข้าไปอ่านอีกไม่เกิน 2 หน้า เพราะข้อมูลติดต่อมักอยู่ตรงนั้น
→ `src/services/crawler.service.ts`

**4. ให้ AI ดึงข้อมูล** — ส่งให้ Claude 2 อย่าง คือ **ข้อความที่มองเห็นบนหน้าเว็บ** กับ **ลิงก์ `mailto:` / `tel:` ที่อยู่ในโค้ดหน้าเว็บ** (สำคัญ เพราะเว็บส่วนใหญ่ทำปุ่มเขียนว่า "ติดต่อเรา" แล้วซ่อนอีเมลจริงไว้ในลิงก์ ถ้าดูแต่ข้อความจะไม่มีทางเจอ) แล้วให้ AI อ่าน แล้วสั่งให้ตอบกลับเป็นข้อมูลที่มีโครงสร้างตายตัว: ชื่อบริษัท, ประเภทธุรกิจ, เบอร์โทร, อีเมล, ที่อยู่ — อะไรที่ไม่มีในหน้าเว็บจะได้ `null` กลับมา ไม่มีการเดาหรือมั่ว
→ `src/services/ai.service.ts`

**5. บันทึก** — เก็บลง MongoDB โดยใช้ `domain` เป็นกุญแจ

> ก่อนถึงขั้น 3 ระบบจะเช็คก่อนว่า domain นี้มีใน DB แล้วหรือยัง **ถ้ามีแล้วจะข้ามไปเลย** ไม่ crawl ไม่เรียก AI แล้วส่ง lead เดิมกลับมาในช่อง `skipped` — ประหยัดทั้งเวลาและค่า AI ถ้าอยากบังคับให้ดึงใหม่ทับของเดิม ส่ง `refresh: true`
→ `src/services/lead.service.ts` + `src/models/lead.model.ts`

```
keyword + location
      ↓  Serper API              ← ขั้น 1
   ลิงก์ 10 อัน
      ↓  กรอง + ตัดซ้ำ           ← ขั้น 2
   เว็บบริษัท 5 อัน
      ↓  Playwright              ← ขั้น 3
   ข้อความจากเว็บ (สูงสุด 3 หน้า/เว็บ)
      ↓  Claude                  ← ขั้น 4
   ชื่อ / เบอร์ / อีเมล / ที่อยู่
      ↓  Mongoose upsert         ← ขั้น 5
   MongoDB
```

ทั้ง 5 ขั้นนี้เกิดขึ้นในการเรียก `POST /api/leads/generate` ครั้งเดียว ส่วน endpoint อื่นคือการแยกเรียกเฉพาะบางขั้นเพื่อทดสอบ

---

## บริการที่ต้องสมัคร และค่าใช้จ่าย

| บริการ | จำเป็น | ราคา | ใช้ตอนไหน |
|---|---|---|---|
| **Serper** ([serper.dev](https://serper.dev)) | ✅ | ฟรี 2,500 queries แรก ไม่ต้องผูกบัตร หลังจากนั้นดูแผนราคาในเว็บ | 1 query ต่อการเรียก `/generate` หรือ `/search` 1 ครั้ง |
| **Anthropic API** ([console.anthropic.com](https://console.anthropic.com)) | ✅ | จ่ายตามใช้จริง เติมเงินล่วงหน้า — ขึ้นกับโมเดลที่เลือก — default `claude-haiku-4-5` คิด $1 ต่อ 1 ล้าน input token และ $5 ต่อ 1 ล้าน output token (เทียบรุ่นอื่นในหัวข้อ [การเปลี่ยนโมเดล AI](#การเปลี่ยนโมเดล-ai)) | 1 ครั้งต่อ 1 เว็บที่ crawl |
| **MongoDB** | ✅ | ติดตั้งบนเครื่องเอง = ฟรี / MongoDB Atlas มี free tier (M0, 512MB) พอสำหรับช่วงเริ่มต้น | ทุกครั้งที่บันทึก lead |
| **Playwright** | - | ฟรี เป็น open source รันบนเครื่องเราเอง | ทุกครั้งที่ crawl |

### ประมาณการค่าใช้จ่ายจริง (อิงโมเดล default `claude-haiku-4-5`)

ต้นทุนเกือบทั้งหมดคือ **ค่า AI** ส่วน Serper แทบไม่มีผล (ยิงแค่ 1 query ต่อ 1 ครั้ง — โควตาฟรี 2,500 ครั้งใช้ได้นานมาก)

| การใช้งาน | ประมาณการ |
|---|---|
| 1 lead (1 เว็บ) | ~$0.004–0.01 · ราว **0.15–0.35 บาท** |
| เรียก `/generate` 1 ครั้ง ที่ `limit: 5` | ~$0.02–0.05 · ราว **0.7–1.8 บาท** |
| เก็บครบ 100 leads | ~$0.4–1.0 · ราว **15–35 บาท** |
| ยิงซ้ำ keyword เดิม (ข้ามของที่มีแล้ว) | **ฟรี** ฝั่ง AI — จ่ายแค่ Serper 1 query |

> ตัวเลขนี้เป็น **การประมาณ** ไม่ใช่ค่าที่วัดจากการใช้งานจริง คำนวณจากขนาดข้อความที่ส่งเข้า AI (ตัดไว้ที่ 12,000 ตัวอักษรต่อเว็บ) — ข้อความภาษาไทยกินโทเค็นมากกว่าภาษาอังกฤษเกือบเท่าตัว ถ้าเจอเว็บไทยล้วนจะอยู่ขอบบนของช่วง ดูยอดใช้จริงได้ที่ console ของ Anthropic

**วิธีคุมค่าใช้จ่าย**
- เริ่มด้วย `limit` น้อย ๆ (2–3) ตอนทดสอบ ค่อยเพิ่มเมื่อมั่นใจว่า keyword ให้ผลดี
- ใช้ `POST /api/leads/search` (ฟรีจาก AI เพราะไม่เรียก AI เลย) เช็คก่อนว่า keyword นี้ได้เว็บที่ใช้ได้จริงไหม แล้วค่อยยิง `/generate`
- ระบบ**ข้าม domain ที่มีใน DB อยู่แล้วโดยอัตโนมัติ** (ไม่ crawl ไม่เรียก AI) ยิง keyword เดิมซ้ำจึงแทบไม่เสียเงิน ถ้าอยากดึงข้อมูลใหม่ทับของเดิม ส่ง `refresh: true` มาด้วย
- ระบบตั้ง `effort: "low"` ให้ AI อยู่แล้ว เพราะงานดึงข้อมูลไม่ต้องคิดซับซ้อน — ช่วยลดค่า output token ไปพอสมควร

---

## การเปลี่ยนโมเดล AI

ระบบออกแบบให้สลับโมเดลได้ง่าย ทำได้ 2 ทาง เลือกทางไหนก็ได้

**ทาง A — แก้ในโค้ด** (เปลี่ยนถาวรทั้งโปรเจกต์) ที่ [`src/config/env.ts`](src/config/env.ts) บรรทัดเดียว:

```ts
const defaultAiModel = "claude-haiku-4-5";   // ← เปลี่ยนตรงนี้
```

**ทาง B — แก้ใน `.env`** (เปลี่ยนเฉพาะเครื่องนี้ ไม่ต้องแตะโค้ด ทับค่าใน `env.ts` เสมอ):

```bash
AI_MODEL=claude-opus-5
```

เปลี่ยนแล้ว restart server พอ ไม่ต้องแก้ไฟล์อื่นเลย — `ai.service.ts` อ่านค่าจาก `env.aiModel` ที่เดียว

### เลือกโมเดลไหนดี

| โมเดล | ราคา (in / out ต่อ 1M token) | ค่าใช้จ่าย/100 leads | เหมาะกับ |
|---|---|---|---|
| `claude-haiku-4-5` ← **default** | $1 / $5 | ~15–40 บาท | งานปกติ เว็บมีข้อมูลติดต่อชัดเจน — คุ้มที่สุด |
| `claude-sonnet-5` | $2 / $10 | ~30–95 บาท | เว็บที่ข้อมูลกระจัดกระจาย ต้องตีความมากขึ้น |
| `claude-opus-5` | $5 / $25 | ~80–240 บาท | เว็บซับซ้อนมาก หรือต้องการความแม่นสูงสุด |

แนะนำให้เริ่มที่ `claude-haiku-4-5` ก่อน เพราะงานนี้คือ "อ่านข้อความแล้วหยิบเบอร์/อีเมล/ที่อยู่ออกมา" ซึ่งไม่ต้องใช้การให้เหตุผลซับซ้อน ถ้าเจอว่าข้อมูลที่ได้ขาด ๆ หาย ๆ บ่อย ค่อยขยับขึ้น

### เรื่องที่ระบบจัดการให้อัตโนมัติแล้ว

พารามิเตอร์ `effort` (ตัวคุมว่าให้ AI คิดละเอียดแค่ไหน ยิ่งต่ำยิ่งถูก) **ไม่ได้รองรับทุกโมเดล**

- `claude-haiku-4-5`, `claude-sonnet-4-5` → **ไม่รองรับ** ถ้าส่งไปจะได้ error `400 This model does not support the effort parameter.`
- `claude-opus-5`, `claude-sonnet-5`, `claude-opus-4-x` → รองรับ

`ai.service.ts` เช็คให้เองแล้วว่าโมเดลที่ตั้งไว้รองรับหรือไม่ ถ้ารองรับจะส่ง `effort: "low"` ไปด้วยเพื่อประหยัด ถ้าไม่รองรับก็ไม่ส่ง — **สลับโมเดลไปมาได้เลยโดยไม่เจอ error นี้**

ถ้าในอนาคตเจอโมเดลใหม่ที่ไม่รองรับ `effort` เพิ่มชื่อลงในลิสต์ `modelsWithoutEffort` ที่หัวไฟล์ `ai.service.ts` ได้เลย

> โมเดลที่ key ของคุณใช้ได้ ดูได้ด้วยคำสั่งนี้:
> ```bash
> curl -s "https://api.anthropic.com/v1/models" \
>   -H "x-api-key: $ANTHROPIC_API_KEY" -H "anthropic-version: 2023-06-01"
> ```

---

## การติดตั้ง

```bash
npm install
npx playwright install chromium   # ต้องรัน 1 ครั้ง ไม่งั้น crawler จะพัง
cp .env.example .env              # แล้วใส่ค่า key
```

ต้องมี MongoDB รันอยู่ (local หรือ Atlas) — ถ้าต่อ MongoDB ไม่ได้ server จะไม่ start

### Environment Variables

| ตัวแปร | จำเป็น | ค่า default | คำอธิบาย |
|---|---|---|---|
| `PORT` | - | `4000` | port ของ server |
| `MONGO_URI` | - | `mongodb://127.0.0.1:27017/leadscout` | connection string |
| `SERPER_API_KEY` | ✅ | - | จาก serper.dev |
| `ANTHROPIC_API_KEY` | ✅ | - | จาก console.anthropic.com |
| `AI_MODEL` | - | `claude-haiku-4-5` | โมเดลที่ใช้ดึงข้อมูล ดูหัวข้อ [การเปลี่ยนโมเดล AI](#การเปลี่ยนโมเดล-ai) |

### การรัน

```bash
npm run dev     # โหมด dev (tsx watch, reload อัตโนมัติ)
npm run build   # compile ไป dist/
npm start       # รันจาก dist/
```

---

## API

base URL: `http://localhost:4000`

| Method | Endpoint | ใช้ทำอะไร | เรียก AI? |
|---|---|---|---|
| `GET` | `/health` | เช็คว่า server ยังอยู่ | - |
| `POST` | `/api/leads/generate` | **flow เต็ม** — ขั้น 1–5 ครบ | ✅ |
| `POST` | `/api/leads/search` | ขั้น 1–2 อย่างเดียว (ไม่ save) | - |
| `POST` | `/api/leads/crawl` | ขั้น 3 กับ 1 หน้า (ไม่ save) | - |
| `GET` | `/api/leads` | ดู lead ที่บันทึกไว้ | - |

### POST /api/leads/generate

ตัวหลักของระบบ ทำครบทุกขั้นแล้ว save ลง MongoDB

```bash
curl -X POST http://localhost:4000/api/leads/generate \
  -H "Content-Type: application/json" \
  -d '{ "keyword": "โรงงานผลิตอาหาร", "location": "สมุทรปราการ", "limit": 5 }'
```

| field | type | จำเป็น | default |
|---|---|---|---|
| `keyword` | string | ✅ | - |
| `location` | string | - | - |
| `limit` | number | - | `5` (จำนวนเว็บที่จะ crawl) |
| `refresh` | boolean | - | `false` — `true` = crawl ใหม่ทับของเดิม ไม่ข้าม domain ที่มีใน DB |

```jsonc
{
  "success": true,
  "leads": [
    {
      "_id": "6712...",
      "companyName": "บริษัท ตัวอย่าง จำกัด",
      "industry": "Food Manufacturing",
      "website": "https://example.co.th",
      "domain": "example.co.th",
      "phone": "02-123-4567",
      "email": "info@example.co.th",
      "address": "123 ถนนสุขุมวิท สมุทรปราการ",
      "createdAt": "2026-09-02T04:00:00.000Z",
      "updatedAt": "2026-09-02T04:00:00.000Z"
    }
  ],
  "skipped": [
    { "_id": "6700...", "companyName": "บริษัทที่เคยเก็บไว้แล้ว", "domain": "old-example.co.th" }
  ],
  "failed": [
    { "url": "https://timeout-site.com", "message": "Timeout 30000ms exceeded" }
  ]
}
```

| ช่อง | ความหมาย |
|---|---|
| `leads` | เว็บที่ crawl + ให้ AI อ่านในรอบนี้ แล้วบันทึกลง DB |
| `skipped` | domain ที่มีใน DB อยู่แล้ว → ข้าม ไม่ crawl ไม่เสียค่า AI ส่งข้อมูลเดิมกลับมาให้ดู |
| `failed` | เว็บที่พัง พร้อมสาเหตุ — ไม่ทำให้ทั้ง request ล้ม |

ถ้ายิง keyword เดิมซ้ำ ส่วนใหญ่จะเห็น `leads: []` กับ `skipped` เต็มไปหมด แปลว่าปกติ — ระบบไม่ทำงานซ้ำให้เปลืองเงิน ถ้าต้องการข้อมูลใหม่จริง ๆ ส่ง `refresh: true`

> ### ⏱️ หมายเหตุ: `/generate` ใช้เวลานาน
>
> endpoint นี้ทำงานแบบ synchronous — crawl ทีละเว็บจนครบแล้วค่อยตอบกลับ
>
> | `limit` | เวลาที่ควรเผื่อ |
> |---|---|
> | 1 | ~20–45 วินาที |
> | 3 | ~1–2 นาที |
> | 5 | ~2–4 นาที |
> | 10 | ~5–8 นาที |
>
> ตารางนี้คือกรณี **crawl จริงทุกเว็บ** ถ้า domain เคยเก็บไว้แล้วจะถูกข้าม ทำให้การยิงซ้ำ keyword เดิมเสร็จใน **1–2 วินาที**
>
> เวลาส่วนใหญ่หมดไปกับการรอเว็บโหลด ต่อ 1 เว็บระบบเปิดได้ถึง 3 หน้า และแต่ละหน้ารอนานสุด 30 วินาทีก่อนยอมแพ้ (ตั้งค่าไว้ใน `crawler.service.ts`) ดังนั้นถ้าเจอเว็บช้าหลายอันติดกัน อาจนานกว่าตารางข้างบนได้อีก
>
> **สิ่งที่ต้องทำฝั่ง client:** ตั้ง timeout อย่างน้อย 5 นาที (axios/fetch ปกติ default สั้นกว่านั้นมาก) ถ้าเรียกผ่าน nginx หรือ reverse proxy ต้องเพิ่ม `proxy_read_timeout` ด้วย และควรมี loading state บอกผู้ใช้ว่ากำลังทำงานอยู่
>
> ตอนทดสอบแนะนำให้เริ่มที่ `limit: 1–2` ก่อน จะได้ไม่ต้องนั่งรอนาน และไม่เปลืองค่า AI

### POST /api/leads/search

ค้นหาผ่าน Serper อย่างเดียว ใช้เช็คว่า keyword ได้ผลลัพธ์แบบไหนก่อนสั่ง generate — ตอบกลับใน 1–2 วินาที และไม่เสียค่า AI

```bash
curl -X POST http://localhost:4000/api/leads/search \
  -H "Content-Type: application/json" \
  -d '{ "keyword": "บริษัทรับทำเว็บ", "location": "กรุงเทพ" }'
```

```jsonc
{
  "success": true,
  "results": [
    { "title": "...", "url": "https://example.com", "snippet": "..." }
  ]
}
```

ดึงมา 10 ผลลัพธ์ แล้วกรองเว็บ social/directory ทิ้ง (แก้รายชื่อได้ที่ `src/utils/url.utils.ts`)

### POST /api/leads/crawl

crawl 1 หน้า ใช้ debug ว่าเว็บนั้นดึงข้อความออกมาได้ไหม (ใช้เวลา ~5–30 วินาที)

```bash
curl -X POST http://localhost:4000/api/leads/crawl \
  -H "Content-Type: application/json" \
  -d '{ "url": "https://example.com" }'
```

```jsonc
{
  "success": true,
  "result": {
    "url": "https://example.com",
    "title": "Example",
    "text": "ข้อความทั้งหน้า...",
    "links": ["https://example.com/contact"]
  }
}
```

### GET /api/leads

```bash
curl "http://localhost:4000/api/leads?limit=20"
```

เรียงจากใหม่ไปเก่า (`createdAt` desc), `limit` default `50`

### Error response

ทุก endpoint ที่ validate ไม่ผ่านจะได้ HTTP `400`:

```json
{ "success": false, "message": "Keyword is required" }
```

---

## โครงสร้างโปรเจกต์

```
src/
├── config/env.ts              # รวม process.env ไว้ที่เดียว
├── routes/lead.routes.ts      # ผูก endpoint กับ controller
├── controllers/               # รับ request, validate, เรียก service
├── services/
│   ├── lead.service.ts        # คุม flow: search → crawl → AI → save
│   ├── search.service.ts      # Serper อย่างเดียว
│   ├── crawler.service.ts     # Playwright อย่างเดียว
│   └── ai.service.ts          # Claude อย่างเดียว
├── models/lead.model.ts       # Mongoose schema + unique index
├── types/                     # type ที่ใช้ร่วมกัน
├── utils/                     # ฟังก์ชันเล็ก ๆ ไม่มี state
└── server.ts                  # Fastify + เชื่อม MongoDB
```

ทิศทาง dependency: `route → controller → service → model / external API` เท่านั้น

## รายละเอียดที่ควรรู้

**กันข้อมูลซ้ำ** — ใช้ unique index บนฟิลด์ `domain` แล้ว upsert ยิง keyword เดิมซ้ำจะเป็นการ *อัปเดต* lead เดิม ไม่สร้างใหม่ และในรอบเดียวกันถ้าเจอหลาย URL จาก domain เดียวกันจะเก็บแค่อันแรก

**การ crawl** — ต่อ 1 เว็บเปิดหน้าแรก + ตามลิงก์ contact / about / ติดต่อ / เกี่ยวกับ อีกไม่เกิน 2 หน้า (เฉพาะ domain เดียวกัน) ใช้ browser instance เดียวต่อเว็บเพื่อไม่ให้ช้าเกินไป ปรับจำนวนหน้าได้ที่พารามิเตอร์ `maxPages` ใน `crawlSite()`

**การหาอีเมล** — ระบบหาจาก 3 ทาง: อีเมลที่พิมพ์อยู่บนหน้าเว็บตรง ๆ, อีเมลที่ซ่อนในลิงก์ `mailto:` (ดึงมาจาก href ไม่ใช่จากข้อความ), และอีเมลที่เขียนกันบอทแบบ `info (at) example (dot) com` ซึ่ง AI จะแปลงกลับให้เป็นรูปแบบปกติ เบอร์โทรก็ดึงจากลิงก์ `tel:` ด้วยวิธีเดียวกัน ถ้าเว็บไม่มีอีเมลจริง ๆ จะได้ `null` — ไม่มีการเดาจากชื่อโดเมน ถ้ามีหลายอีเมลจะเลือกอันที่เป็นช่องทางหลักของบริษัท (info@, contact@, sales@) ก่อนอีเมลส่วนตัว

**AI** — ใช้ structured output (Zod schema) จึงไม่ต้อง parse JSON เอง และไม่มีปัญหา AI ตอบผิดฟอร์แมต ข้อมูลที่ไม่มีในหน้าเว็บจะได้ `null` โมเดลตั้งค่าที่ `src/config/env.ts` หรือ `AI_MODEL` ใน `.env`

## ถ้าจะขยายต่อ

สิ่งเดียวที่น่าจะจำเป็นจริงตอนโปรเจกต์โตขึ้นคือ **job queue** (เช่น BullMQ) ให้ `/generate` คืน job id กลับมาทันทีแล้วประมวลผลเบื้องหลัง เพราะปัญหารอนานตามตารางข้างบนจะหายไปเลย — ตอนนี้ที่ `limit` ระดับ 5 ยังพอรอไหว
# lead-scout-wis
