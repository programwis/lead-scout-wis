# LeadScout Frontend — คู่มือสำหรับ AI agent

อ่านไฟล์นี้ก่อนเริ่มงานทุกครั้ง และ **อัปเดตไฟล์นี้ทุกครั้งที่เพิ่ม/แก้ไขโครงสร้าง** เพื่อให้ session ถัดไปไม่ต้องไล่โค้ดใหม่

ไฟล์นี้ครอบคลุม **frontend เท่านั้น** (โฟลเดอร์นี้) — เรื่อง API/โฟลว์การหา lead จริง ดูที่
`../backend/README.md` (คู่มือคนอ่าน) กับ `../backend/CLAUDE.md` (คู่มือ agent ของ backend) **เสมอ**
อย่าเดา field หรือ behavior ของ backend เอง

---

## 1. โปรเจกต์นี้คืออะไร

Frontend แบบ PoC ของ LeadScout — เครื่องมือภายในให้ Sales กรอก **คำค้นธุรกิจ + จังหวัด + จำนวนที่ต้องการ**
แล้วระบบไปค้น Google Maps, เข้าเว็บจริง, ให้ AI ดึงเบอร์/อีเมล ออกมาให้ตรวจ/แก้ก่อนกดยืนยันบันทึก

โฟลว์หลัก: **ค้นหา → รอผล (นานได้หลายนาที) → ตรวจ/แก้ไขในตาราง → ยืนยัน (เขียนลง MongoDB จริง)**

**หน้าเดียวคือ `/leads`** ไม่มีระบบ login, ไม่มี dashboard, ไม่มี CRM — ดูหัวข้อ 8 ว่าอะไรที่ตั้งใจไม่ทำ

## 2. Stack

- **Vite** + **React 18** + **TypeScript** (strict) — ไม่ใช่ Next.js
- **Ant Design 5** (`antd`) — ใช้ component สำเร็จรูปให้มากที่สุด ไม่เขียน UI พื้นฐานเอง (Table, Form, Select,
  Drawer, Statistic, Alert, Collapse ฯลฯ)
- **Axios** — เรียก API ทั้งหมดผ่าน `src/services/`
- **react-router-dom** — มีแค่ route เดียวจริง ๆ (`/leads`) ใส่ไว้เผื่อขยาย ไม่ได้ over-engineer
- **lucide-react** — ใช้เฉพาะไอคอนที่ AntD ไม่มีให้ (เช่นโลโก้ header, ปุ่มแก้ไข)
- **ไม่มี** Redux/Zustand, ไม่มี Tailwind, ไม่มี i18n framework, ไม่มี ESLint config (ตัดออกเพื่อความเรียบง่ายของ PoC
  — ถ้าจะเพิ่มทีหลังค่อยตั้งค่าตามจริง)

State ทั้งหมดอยู่ใน React state ธรรมดา ไม่มี global store — ข้อมูลจาก `/generate` อยู่ในหน่วยความจำของหน้าเว็บ
เท่านั้น (ตาม README ของ backend: **backend ไม่เก็บ draft ให้** refresh หน้าแล้วข้อมูลหายต้อง generate ใหม่)

## 3. โครงสร้างโปรเจกต์

```
src/
├── main.tsx              # entry — ครอบ ConfigProvider (locale th_TH, primary color)
├── App.tsx                # แค่ RouterProvider
├── index.css              # reset เล็ก ๆ + font stack ที่รองรับไทย
├── vite-env.d.ts          # type ของ import.meta.env
├── router/
│   └── index.tsx           # "/" redirect ไป "/leads", route จริงมีแค่ "/leads"
├── layouts/
│   └── MainLayout.tsx      # header เล็ก ๆ (โลโก้ + ชื่อระบบ) + container กว้าง 1320px
├── types/
│   └── lead.types.ts       # type ทั้งหมดที่คุยกับ backend — มาจาก backend/README.md ตรง ๆ
│                            # (LeadCandidate, GenerateResponse, ConfirmResponse, AIModel, ฯลฯ)
├── constants/
│   ├── industries.ts       # preset คำค้นธุรกิจ (autocomplete, พิมพ์เองได้เสมอ)
│   ├── provinces.ts        # 77 จังหวัดไทย (รวมกรุงเทพฯ) ไม่ดึงจาก API ภายนอก
│   └── leadCount.ts        # ตัวเลือกจำนวน lead [5, 10, 20, 50]
├── services/
│   ├── api.ts               # axios instance เดียว อ่าน baseURL จาก VITE_API_URL
│   └── lead.service.ts      # generateLeads / confirmLeads / getModels / getLeads
│                             # generateLeads() ใช้ timeout แยก 10 นาที เพราะ /generate เป็น synchronous
│                             # request ที่ backend บอกไว้ว่าอาจใช้เวลาถึง ~8 นาทีตอน limit สูง
├── utils/
│   └── apiError.ts          # แปลง AxiosError → ข้อความไทยที่อ่านรู้เรื่อง ไม่โชว์ stack trace
├── components/
│   └── ContactStatusTag.tsx # Tag สี contactable/partial/no_contact ใช้ร่วมหลายที่
└── pages/leads/              # ทุกอย่างของหน้า /leads อยู่รวมกันที่นี่ (ไม่แยกเป็น global hook/component
                                # เพราะใช้ที่เดียว — ดูกฎข้อ 6)
    ├── LeadsPage.tsx          # หน้าเดียวที่ประกอบทุกอย่างเข้าด้วยกัน ไม่มี business logic ในนี้เอง
    ├── useLeadsFlow.ts        # hook เดียวคุม state ทั้งหมดของหน้า (generate/edit/confirm)
    ├── SearchForm.tsx         # ฟอร์มค้นหา (keyword/province/limit/model)
    ├── GeneratingPanel.tsx    # ข้อความ + Spin ระหว่างรอผล (ดูข้อ 5)
    ├── ResultsSummary.tsx     # แถบสถิติด้านบนตาราง
    ├── InsufficientResultsAlert.tsx  # แจ้งเตือนตอนได้ leads ไม่ครบ requested
    ├── LeadsTable.tsx         # ตารางหลัก (เฉพาะ leads ที่ใช้งานได้) + edit action + expandable row
    ├── EditLeadDrawer.tsx     # Drawer แก้ไขข้อมูลก่อนยืนยัน
    └── SecondaryLeadsSections.tsx  # Collapse: needsReview / noContact / rejected / skipped / failed
```

## 4. Data flow — จาก `/generate` ถึง `/confirm`

```
SearchForm (กรอกฟอร์ม)
   → useLeadsFlow.handleGenerate(values)
   → lead.service.generateLeads()  → POST /api/leads/generate
   → GenerateResponse เก็บไว้ใน state (result)
   → result.leads แปลงเป็น EditableLeadRow[] (เติม rowKey ให้แต่ละแถว) เก็บใน state (rows)
   → LeadsTable แสดง rows + เลือกแถวด้วย checkbox (rowSelection)
   → EditLeadDrawer แก้ไขแถว → useLeadsFlow.handleSaveEdit() แทนที่แถวเดิมใน rows ด้วย rowKey
   → ผู้ใช้กด "ยืนยัน Lead ที่เลือก" → useLeadsFlow.handleConfirm()
   → ตัด field rowKey ออก ส่ง LeadCandidate[] ที่เลือกไป POST /api/leads/confirm
   → ตอบกลับมา: ลบแถวที่บันทึกสำเร็จออกจากตาราง + notification.success
```

**`rowKey` เป็นของฝั่งหน้าบ้านล้วน ๆ** — `${domain ?? companyName}::${index}` เพราะ lead ที่ยังไม่ confirm
ไม่มี `_id` จาก backend เลย (ดู README ของ backend หัวข้อ `/generate`) **ห้ามใช้ index เฉย ๆ เป็น key** เพราะถ้า
ลบ/กรองแถวออกจาก array แล้ว index จะขยับ ทำให้ React reconciliation จับคู่แถวผิด

**`contactStatus` ไม่ถูกคำนวณใหม่ฝั่งหน้าบ้านเด็ดขาด** แม้ผู้ใช้จะแก้เบอร์/อีเมลใน `EditLeadDrawer` ก็ตาม
— backend เป็นคนคิดค่านี้ตอน `/generate` เท่านั้น (ตามสเปกที่ backend ยืนยันไว้ว่าเป็นเงื่อนไขตายตัว) ฝั่งหน้าบ้าน
แค่แสดงผลเฉย ๆ

## 5. UX ที่ตั้งใจทำตามสเปก — อย่าเปลี่ยนโดยไม่ปรึกษา

- **`/generate` เป็น synchronous request ที่ช้ามาก** (README backend: limit 5 ~2-4 นาที, limit 10 ~5-8 นาที)
  `lead.service.ts` ตั้ง timeout ของ call นี้ไว้ 10 นาทีโดยเฉพาะ (แยกจาก axios instance หลักที่ 30 วิ)
  **ห้ามลดค่านี้** และถ้าจะเพิ่ม limit option ใหม่ที่สูงกว่า 50 ต้องเผื่อ timeout เพิ่มตามสัดส่วนด้วย
- ระหว่างรอ ต้องมี loading state ที่ชัดเจนเสมอ (`GeneratingPanel.tsx`) ห้ามปล่อยปุ่มเป็น disabled เฉย ๆ
  โดยไม่มีคำอธิบาย ผู้ใช้ต้องรู้ว่าระบบไม่ได้ค้าง
- **`/generate` ไม่เขียน DB, `/confirm` เขียนอย่างเดียว** — ห้ามเรียก `/confirm` อัตโนมัติหลัง generate เสร็จ
  ต้องรอผู้ใช้ตรวจ/แก้แล้วกดยืนยันเองเท่านั้น (ตรงตาม README backend หัวข้อ "หน้าบ้านต้องเก็บผลจาก /generate ไว้เอง")
- ตารางหลักโชว์เฉพาะ `result.leads` (ธุรกิจที่ใช้งานได้จริง) ส่วน `needsReview` / `noContact` / `rejected` /
  `skipped` / `failed` เป็นข้อมูลรอง ต้องไม่ปนเข้าตารางหลัก — เก็บไว้ใน Collapse ที่ `SecondaryLeadsSections.tsx`
- ตัวเลือกโมเดล AI (`SearchForm.tsx`) **ต้องไม่เด่นกว่า keyword/province/limit** — ไม่บังคับเลือก ปล่อยว่างได้
  (backend ใช้ default ของตัวเองถ้าไม่ส่งมา) รายชื่อโมเดลดึงจาก `GET /api/leads/models` เสมอ **ห้าม hardcode**
  ชื่อ/ราคาโมเดลไว้ในหน้าบ้าน เพิ่มโมเดลใหม่ฝั่ง backend แล้วหน้าบ้านต้องเห็นเองโดยไม่ต้องแก้โค้ด

## 6. กฎการเขียนโค้ด

แนวทางเดียวกับ backend (`../backend/CLAUDE.md`) — **โครงสร้างแบน ไม่มี layer ที่ทำหน้าที่ forward call เฉย ๆ**

- **ห้ามเพิ่ม**: repository, use case, DTO, DI container, factory, state management library, custom wrapper
  รอบ component ของ AntD (ห้ามสร้าง `CustomButton`/`CustomTable`/ฯลฯ)
- โค้ดเฉพาะหน้า `/leads` อยู่รวมกันใน `pages/leads/` ทั้งหมด (component, hook, ไม่แยกไป `src/hooks/` หรือ
  `src/components/` เว้นแต่จะถูกใช้ซ้ำข้ามหน้าจริง ๆ — ตอนนี้มีแค่ `ContactStatusTag` ที่เข้าเงื่อนไขนี้)
  **ถ้าเพิ่มหน้าที่ 2 ในอนาคต ค่อยพิจารณาย้าย logic ที่ใช้ร่วมออกมา** อย่าเผื่อไว้ล่วงหน้า
- **1 hook ต่อ 1 หน้า คุม state ทั้งหมดของหน้านั้น** (`useLeadsFlow.ts`) — component ย่อยรับ props อย่างเดียว
  ไม่เรียก service ตรง ๆ เอง
- ใช้ AntD component ตรง ๆ ก่อนเสมอ อย่าเขียน CSS-in-JS หรือ custom style ใหญ่ ๆ ถ้า AntD มี prop ให้ปรับอยู่แล้ว
- ทุก type ที่คุยกับ backend อยู่ใน `types/lead.types.ts` ไฟล์เดียว ห้ามประกาศ type ซ้ำในไฟล์อื่น
- error ทั้งหมดที่โชว์ผู้ใช้ต้องผ่าน `utils/apiError.ts` (`toFriendlyErrorMessage`) ห้ามโชว์ `error.message`
  ดิบ ๆ หรือ stack trace ให้ผู้ใช้เห็น

## 7. คำสั่งที่ใช้บ่อย

```bash
npm install
npm run dev       # http://localhost:5173 (ต้องมี backend รันอยู่ที่ VITE_API_URL คู่กันด้วย)
npm run build     # tsc -b && vite build — ใช้ตรวจงานหลังแก้โค้ดทุกครั้ง (ไม่มี test framework)
npm run preview   # ดู production build
```

**env ที่ต้องมี** — คัดลอก `.env.example` เป็น `.env.local` แล้วตั้ง `VITE_API_URL` (default `http://localhost:4000`)

## 8. สถานะปัจจุบัน (MVP)

| ส่วน | สถานะ |
|---|---|
| หน้า `/leads` — ฟอร์มค้นหา (keyword autocomplete, province, lead count, AI model) | ✅ |
| Loading state ระหว่างรอ `/generate` | ✅ |
| ตารางผลลัพธ์ + สรุปสถิติ + แจ้งเตือนผลไม่ครบ (`canContinue`/`suggestion`) | ✅ |
| แก้ไขข้อมูล lead ก่อนบันทึก (Drawer) | ✅ |
| ยืนยันบันทึก (`/confirm`) + แจ้งผลสำเร็จ/ล้มเหลว | ✅ |
| ส่วนรอง: needsReview / noContact / rejected / skipped / failed | ✅ (Collapse ในการ์ดแยก) |
| ทดสอบ TypeScript (`tsc -b`) + production build | ✅ ผ่านทั้งคู่ |
| ทดสอบ UI จริงผ่าน browser (Playwright) | ✅ ฟอร์ม render ถูกต้อง, ไม่มี console error |

**ที่ตั้งใจยังไม่ทำ** (ตรงตามสเปก PoC ที่ตกลงกัน) — authentication, user management, roles, CRM/pipeline,
analytics dashboard, notification, export, advanced filter, websocket/SSE/job queue, i18n multi-language
(หน้าบ้านนี้เป็นภาษาไทยล้วน backend ตอบเป็นข้อมูลดิบไม่ผูก locale)

## 9. กับดักที่ควรรู้ก่อนแก้ต่อ

- **frontend/ เคยมี `AGENTS.md`/`CLAUDE.md` ของโปรเจกต์อื่น (MEEGA Diamond Jewelry, Next.js) ติดมาโดยไม่ตั้งใจ**
  ถูกแทนที่ด้วยไฟล์นี้แล้ว — ถ้าเจอไฟล์คู่มือที่พูดถึง stack ไม่ตรงกับ `package.json` ให้สงสัยว่าเป็นไฟล์หลงเหลือ
  จากโปรเจกต์อื่นเสมอ อย่าทำตามโดยไม่เช็ค
- **ทดสอบ AntD `Select`/`AutoComplete` ด้วย Playwright headless ต้องระวัง** — คลิกที่ label ตรง ๆ บางทีจะโดน
  search-input ที่ถูก selection item บังอยู่ (`intercepts pointer events`) ใช้ `.click({ force: true })` หรือคลิก
  ที่ container แทน — เป็นเรื่องของการทดสอบอัตโนมัติเท่านั้น ผู้ใช้จริงคลิกได้ปกติ
- **`npx playwright install chromium` ต้องรันจากโฟลเดอร์ `backend/`** (ที่ที่ `playwright` เป็น dependency)
  ถ้า browser cache กับ `playwright-core` เวอร์ชันไม่ตรงกัน (เช่น revision 1234 vs 1243) จะเจอ
  `Executable doesn't exist` — รันคำสั่งนี้ซ้ำอีกทีแก้ได้เลย
