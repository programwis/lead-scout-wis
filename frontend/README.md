# LeadScout Frontend

หน้าบ้านของ LeadScout — ฟอร์มค้นหา Lead ธุรกิจ, ตารางแสดงผล/แก้ไขก่อนบันทึก, และปุ่มยืนยันเพื่อบันทึกลงฐานข้อมูล
เรียก backend แยกต่างหาก (โฟลเดอร์ `../backend`) ผ่าน REST API — ดูรายละเอียด endpoint/โฟลว์การทำงานจริงที่
[`backend/README.md`](../backend/README.md)

---

## Tech Stack

- **Vite 6** + **React 18** + **TypeScript** — SPA ล้วน ไม่มี SSR/Next.js
- **react-router-dom v7** — routing (`createBrowserRouter`)
- **antd v5** — UI component ทั้งหมด (form, table, drawer, notification)
- **axios** — เรียก API ผ่าน wrapper กลาง (ดู [การเรียก API](#การเรียก-api))
- **lucide-react** — ไอคอน

ไม่มี Tailwind, ไม่มี state management library (Redux/Zustand/React Query), ไม่มี test framework — ดูเหตุผลและ
รายละเอียดทั้งหมดที่ [`AGENTS.md`](AGENTS.md) ข้อ 27 (Project-Specific Checklist)

---

## การติดตั้ง

### Environment Variables

คัดลอก `.env.example` เป็น `.env.local` แล้วตั้งค่า:

```bash
cp .env.example .env.local
```

| ตัวแปร | ความหมาย | ค่าเริ่มต้นถ้าไม่ตั้ง |
|---|---|---|
| `VITE_API_URL` | URL ของ backend (LeadScout API) | `http://localhost:4000` |

### การรัน

```bash
npm install
npm run dev        # dev server (Vite)
```

ต้องรัน backend คู่กันด้วย (ดู `backend/README.md` → การติดตั้ง) ไม่งั้นฟอร์มค้นหาจะยิง API ไม่เจอ

---

## คำสั่งที่มี

```bash
npm run dev        # เปิด dev server พร้อม hot reload
npm run build      # type check (tsc -b) แล้ว build production ไปที่ dist/
npm run preview    # serve ไฟล์ที่ build แล้วเพื่อเช็คก่อน deploy
```

ไม่มี `lint`/`test` script — ตรวจงานด้วย `npm run build` (type check + build) แล้วเปิดเบราว์เซอร์ทดสอบจริง

---

## โครงสร้างโปรเจกต์

```
src/
├── router/index.tsx                    ← createBrowserRouter ทั้งหมดของแอป — ครอบแต่ละ route ด้วย MainLayout ที่นี่
├── pages/<route>/
│   ├── index.tsx                       ← ไฟล์เดียวของหน้า: ประกอบ section + mutation state/handler ทั้งหมด
│   └── hooks/useLoadInitialData.ts     ← โหลดข้อมูลตั้งต้นของหน้าอย่างเดียว (ไม่มี mutation)
├── components/
│   ├── layout/MainLayout/MainLayout.tsx
│   └── <feature>/<Name>/<Name>.tsx     ← section/card/form ของแต่ละ entity เช่น components/leads/SearchForm/
├── services/
│   ├── axios/axios.ts                  ← AxiosUtil.createRequest<T>() — axios wrapper กลาง คืน ApiResult<T> เสมอ ไม่ throw
│   └── <Entity>Service/<Entity>Service.ts  ← เช่น LeadService.generate(), LeadService.confirm()
├── types/                              ← ApiResult<T> + type ที่ UI ใช้ (ตรงกับ response ของ backend)
├── constants/                          ← ตัวเลือก static (industries, provinces, leadCount)
└── utils/                              ← helper ที่ไม่ใช่ UI (เช่น toFriendlyErrorMessage)
```

ทุกไฟล์ที่เป็น "หนึ่งหน่วย" (component / service) อยู่ในโฟลเดอร์ชื่อเดียวกับตัวเอง (เช่น `SearchForm/SearchForm.tsx`,
`LeadService/LeadService.ts`) เพื่อให้เพิ่มไฟล์ที่เกี่ยวข้อง (type, style, ฯลฯ) ในอนาคตได้ง่ายโดยไม่ต้องย้ายไฟล์

**กฎการเขียนโค้ด, เหตุผลของการตัดสินใจแต่ละอย่าง, และ checklist ก่อนส่งงาน อยู่ใน [`AGENTS.md`](AGENTS.md)**
อ่านไฟล์นั้นก่อนเริ่มงานทุกครั้ง — ไฟล์นี้ (README) สรุปไว้แค่ภาพรวมสำหรับคนเปิดโปรเจกต์ครั้งแรก

---

## การเรียก API

ทุกการเรียก backend ผ่าน `AxiosUtil.createRequest<T>()` ใน `src/services/axios/axios.ts` ซึ่ง**ไม่ throw**
คืนค่าเป็น `ApiResult<T>` เสมอ:

```ts
type ApiResult<T> = { ok: true; data: T } | { ok: false; message: string };
```

Service ต่อ entity (เช่น `src/services/LeadService/LeadService.ts`) export เป็น object รวมฟังก์ชัน เรียกใช้แบบ
`LeadService.generate(payload)` แล้วเช็ค `.ok` ที่ฝั่งเรียก:

```ts
const res = await LeadService.generate(values);
if (!res.ok) {
  setErrorMessage(res.message);
  return;
}
// res.data คือ shape จริงจาก backend (ดู backend/README.md)
```

`LeadService.generate()` ตั้ง timeout ยาวเป็นพิเศษ (10 นาที) เพราะ `/api/leads/generate` ทำ search + crawl + AI
ต่อกันแบบ synchronous ที่ backend — ดูรายละเอียดโฟลว์และเวลาโดยประมาณที่ `backend/README.md`

---

## หน้าที่มีอยู่ตอนนี้

| Path | หน้า | ทำอะไร |
|---|---|---|
| `/leads` | `src/pages/leads/` | ค้นหา Lead (`SearchForm`) → แสดงผลลัพธ์ในตาราง แก้ไขได้ก่อนบันทึก (`LeadsTable`, `EditLeadDrawer`) → เลือกแล้วกด "ยืนยัน" เพื่อบันทึกลง DB จริง (`LeadService.confirm`) |
| `/` | — | redirect ไป `/leads` |

ผลลัพธ์จาก `/api/leads/generate` **ยังไม่ถูกบันทึก** — หน้านี้ถือ state ไว้เองในหน่วยความจำ (ไม่ persist) ถ้า
refresh หน้าเว็บก่อนกด "ยืนยัน" ข้อมูลจะหายและต้องค้นหาใหม่ (เสียค่า AI ซ้ำฝั่ง backend)
