# AGENTS.md — Shared Coding Guide (Template)

> เอกสารนี้เป็น **มาตรฐานกลาง** สำหรับ AI agent (และคน) ที่ทำงานในโปรเจกต์เว็บแอป TypeScript/React
> สกัดมาจากแพทเทิร์นที่ใช้งานได้จริงในโปรเจกต์ production — **ไม่ผูกกับโปรเจกต์ใด**
>
> ก่อนใช้กับโปรเจกต์ใหม่ AI ต้องทำ [ข้อ 0](#0-วิธีใช้เอกสารนี้-อ่านก่อนเสมอ) ให้ครบก่อน

---

## สารบัญ

0. [วิธีใช้เอกสารนี้ (อ่านก่อนเสมอ)](#0-วิธีใช้เอกสารนี้-อ่านก่อนเสมอ)
1. [General Rules](#1-general-rules)
2. [Project Structure](#2-project-structure)
3. [Creating a New Page](#3-creating-a-new-page)
4. [Creating Components](#4-creating-components)
5. [Creating Hooks](#5-creating-hooks)
6. [API / Service Layer](#6-api--service-layer)
7. [Types](#7-types)
8. [Validation / Schema](#8-validation--schema)
9. [State Management](#9-state-management)
10. [Styling](#10-styling)
11. [Forms](#11-forms)
12. [Authentication / Authorization](#12-authentication--authorization)
13. [Error Handling](#13-error-handling)
14. [Naming Convention](#14-naming-convention)
15. [Code Style](#15-code-style)
16. [Reuse Before Create](#16-reuse-before-create)
17. [When to Create a New File](#17-when-to-create-a-new-file)
18. [Workflow: แก้บั๊ก / Refactor](#18-workflow-แก้บั๊ก--refactor)
19. [Testing / Verification](#19-testing--verification)
20. [Environment Variables](#20-environment-variables)
21. [Security](#21-security)
22. [SEO](#22-seo)
23. [Performance](#23-performance)
24. [Git](#24-git)
25. [Internationalization (optional)](#25-internationalization-optional)
26. [Documentation Upkeep](#26-documentation-upkeep)
27. [Project-Specific Checklist (ต้องเติมทุกโปรเจกต์)](#27-project-specific-checklist-ต้องเติมทุกโปรเจกต์)

---

## 0. วิธีใช้เอกสารนี้ (อ่านก่อนเสมอ)

### 0.1 ลำดับความสำคัญ

```
Existing working project architecture   ← สูงสุด: โค้ดที่ใช้งานได้จริงใน repo
        ↓
Project-specific instructions           ← README · AGENTS.md/CLAUDE.md ส่วนเฉพาะโปรเจกต์ · สิ่งที่ผู้ใช้สั่ง
        ↓
AGENTS.md general guideline (ไฟล์นี้)
        ↓
AI preference                           ← ต่ำสุด
```

- ถ้า repo มี architecture ที่ต่างจากไฟล์นี้ → **ยึด repo เป็นหลัก** ห้ามเปลี่ยนโครงสร้างโปรเจกต์เพียงเพื่อให้ตรงกับเอกสารนี้
- ไฟล์นี้บอก "ค่าเริ่มต้นที่ดี" ไม่ได้บอก "ความจริงของโปรเจกต์"

### 0.2 ระบบ TODO

ส่วนที่เป็นเรื่องเฉพาะโปรเจกต์ถูกทำเครื่องหมายไว้ 2 แบบ:

```md
<!-- TODO: AI MUST REVIEW THIS SECTION FOR EACH PROJECT -->
> TODO: Confirm project-specific convention before applying this rule.
```

เมื่อนำไฟล์นี้ไปใช้กับโปรเจกต์ใหม่ AI ต้อง:

1. **อ่าน repository ก่อน** — `package.json`, config, โครงโฟลเดอร์, และเปิดไฟล์จริงอย่างน้อย 1 ตัวอย่างของ page / component / hook / API / form
2. **ไล่ดูทุก TODO** ในไฟล์นี้
3. **เติมข้อมูลที่ตรงกับโปรเจกต์** ลงใน [ข้อ 27](#27-project-specific-checklist-ต้องเติมทุกโปรเจกต์) (หรือในไฟล์ AGENTS.md ของโปรเจกต์)
4. ถ้าไม่แน่ใจว่าควรเลือก pattern ไหน → **ถามผู้ใช้ก่อน**
5. **ห้ามเดา architecture** และห้ามสมมติคำสั่ง/ไลบรารีที่ไม่มีใน repo

### 0.3 Ask Before Assuming

ถ้าพบ **หลาย pattern** ในโปรเจกต์ และระบุไม่ได้ว่าแบบไหนคือมาตรฐาน → **หยุดแล้วถามผู้ใช้** อย่าเลือกเอง

```
ตัวอย่างที่ 1
พบว่ามีทั้ง:
- API logic อยู่ใน hooks ของแต่ละหน้า
- API logic อยู่ใน services/
ไม่สามารถระบุได้ว่าแบบไหนเป็นมาตรฐาน
→ ถามผู้ใช้ก่อน ว่างานใหม่ควรใช้แบบไหน

ตัวอย่างที่ 2
พบทั้ง:
- components/Button.tsx
- features/example/components/Button.tsx
→ อย่าเลือกเอง
→ ถามว่าโปรเจกต์ต้องการ component กลาง หรือ component ตาม feature
```

กรณีที่ **ไม่ต้องถาม**: มี pattern เดียวชัดเจนอยู่แล้ว · เป็นรายละเอียดเล็กที่ไม่กระทบโครงสร้าง (ชื่อตัวแปรภายในฟังก์ชัน ฯลฯ) — ให้ทำตาม pattern ที่มีแล้วบอกผู้ใช้ว่าตัดสินใจอะไรไป

### 0.4 Framework อาจใหม่กว่าความรู้ของ AI

<!-- TODO: AI MUST REVIEW THIS SECTION FOR EACH PROJECT -->

เฟรมเวิร์กเปลี่ยน API บ่อย (เช่น Next.js รุ่นใหม่เปลี่ยน `middleware.ts` → `proxy.ts`, `params` เป็น Promise, Tailwind v4 ไม่มี `tailwind.config.*`)
- เช็คเวอร์ชันจริงใน `package.json` ก่อนเขียนโค้ด
- ถ้าเฟรมเวิร์กมีเอกสารใน `node_modules` (เช่น `node_modules/next/dist/docs/`) **อ่านจากที่นั่นก่อน** อย่าเชื่อความจำ
- ใส่ความต่างที่สำคัญของโปรเจกต์ลงใน [ข้อ 27](#27-project-specific-checklist-ต้องเติมทุกโปรเจกต์)

---

## 1. General Rules

1. **อ่านโครงสร้างโปรเจกต์ก่อนแก้ไขทุกครั้ง** — เปิดไฟล์ที่เกี่ยวข้องจริง ไม่ใช่ดูแค่ชื่อโฟลเดอร์
2. **ใช้ pattern ที่มีอยู่ก่อนสร้าง pattern ใหม่** — หาไฟล์ที่ทำงานคล้ายกันที่สุดแล้วคัดลอกโครงของมัน
3. **Reuse ก่อน duplicate** — ค้นหา component / hook / util / type ที่มีอยู่ก่อนเสมอ (ดู [ข้อ 16](#16-reuse-before-create))
4. **ห้ามสร้างไฟล์/โฟลเดอร์โดยไม่จำเป็น** — ห้ามสร้างไฟล์เพื่อให้โครงสร้าง "ดูดี" (ดู [ข้อ 17](#17-when-to-create-a-new-file))
5. **ห้าม refactor ใหญ่โดยไม่มีเหตุผล** และห้ามทำโดยไม่ได้ตกลงกับผู้ใช้
6. **อย่าแก้ไฟล์ที่ไม่เกี่ยวกับ task** — ไม่จัด format ใหม่ ไม่เปลี่ยนชื่อ ไม่ "เก็บกวาด" ของที่ไม่ได้ถูกขอ
7. **อย่าเปลี่ยน architecture โดยพลการ** — การย้ายชั้น data flow / state / auth ต้องถามก่อน
8. **อย่า over-engineer** — ไม่สร้าง abstraction เผื่ออนาคต ไม่สร้าง generic layer ที่ยังมีผู้ใช้แค่ที่เดียว
9. **ถ้าไม่แน่ใจเรื่อง requirement หรือดีไซน์ ให้ถามก่อนลงมือ**
10. **รายงานผลตามจริง** — lint/type/build ไม่ผ่านต้องบอก พร้อม output · ข้ามขั้นตอนไหนต้องบอก
11. **ทำงานให้ครบ scope** — ถ้าบางส่วนติดขัด ให้ทำส่วนอื่นให้เสร็จแล้วบอกชัดว่าส่วนไหนค้างและเพราะอะไร

---

## 2. Project Structure

<!-- TODO: AI MUST REVIEW THIS SECTION FOR EACH PROJECT -->
> TODO: Confirm project-specific convention before applying this rule.
> โครงด้านล่างคือ **โครงอ้างอิง** สำหรับ Next.js App Router + TypeScript ถ้าโปรเจกต์มีโครงของตัวเองอยู่แล้ว ให้ map หน้าที่ของแต่ละโฟลเดอร์เข้ากับของจริง อย่าย้ายไฟล์ให้ตรงกับตรงนี้

```
src/
├── app/                        ← routing เท่านั้น (page · layout · route handler · not-found)
│   ├── <route>/
│   │   ├── page.tsx            ← Server Component: metadata + ประกอบ section
│   │   ├── <Name>Client.tsx    ← Client Component: เรียก hook โหลดข้อมูลแล้วส่ง props ลงไป (มีเฉพาะหน้าที่โหลดข้อมูล)
│   │   └── hooks/
│   │       ├── useLoadInitialData.ts ← hook โหลดข้อมูลของ "หน้านี้" เท่านั้น
│   │       └── server.ts       ← (ถ้าต้องใช้) อ่านข้อมูลฝั่ง server ให้ generateMetadata — มี import "server-only"
│   ├── admin/                  ← (ถ้ามี) หลังบ้าน — แยก root layout ได้
│   └── api/<resource>/         ← route handler (REST)
│       ├── route.ts            ← GET list · POST create
│       └── [id]/route.ts       ← GET one · PATCH · DELETE
├── components/
│   ├── common/                 ← UI กลางที่ใช้หลายหน้า (Container · Section · Button · LoadError …)
│   ├── layout/                 ← Header · Footer · Navigation
│   └── <feature>/              ← component ตามโดเมน/หน้า (product/ · article/ · checkout/ …)
├── lib/                        ← logic ที่ไม่ใช่ UI
│   ├── utils.ts                ← helper เล็ก ๆ ทั่วไป (cn · formatDate · formatPrice)
│   ├── api/                    ← response envelope · API client ฝั่ง browser · serializer · query helper
│   ├── db/                     ← connection + accessor ของ collection/table + type ของเอกสารใน DB
│   ├── auth/                   ← session · requireAuth / requireAdmin
│   └── <integration>/          ← service ภายนอก (email · payment · storage) หนึ่งโฟลเดอร์ต่อหนึ่งระบบ
├── schemas/                    ← validation schema (zod) แยกตาม entity + common.ts
├── types/                      ← type ที่ UI ใช้ร่วมกัน (shape ของ API response)
├── constants/                  ← ข้อมูล static / enum / config ที่เป็น single source of truth
├── i18n/                       ← (ถ้ามีหลายภาษา) config + dictionaries
└── proxy.ts | middleware.ts    ← redirect / optimistic auth check

scripts/                        ← script ที่รันด้วย tsx (seed · check connection · migration)
public/                         ← ไฟล์ static (รูป · ไอคอน · favicon)
.env.example                    ← รายชื่อ env ที่ต้องมี (ไม่มีค่าจริง) — commit ได้
```

### หน้าที่ของแต่ละโฟลเดอร์

| โฟลเดอร์ | ควรวาง | ไม่ควรวาง |
|---|---|---|
| `app/` | route, layout, metadata, route handler, ไฟล์ที่ผูกกับ route นั้นเท่านั้น (`<Name>Client.tsx`, `hooks/`) | component ที่ใช้หลายหน้า · logic ธุรกิจยาว ๆ |
| `app/<route>/hooks/` | hook โหลดข้อมูล **ของหน้านั้น** | hook ที่หน้าอื่นจะ import ไปใช้ |
| `components/common/` | UI กลาง ไม่รู้จัก entity ใด ๆ | การเรียก API · การอ่าน DB |
| `components/<feature>/` | section / card / form ของโดเมนนั้น รับข้อมูลทาง props | การโหลดข้อมูลเอง |
| `lib/api/` | ซอง response, `apiGet`/`apiSend`, serializer, query helper | UI |
| `lib/db/` | client (cache connection), accessor, type ของเอกสาร DB | การแปลงเป็น shape ของ UI (อยู่ใน serializer) |
| `lib/<integration>/` | wrapper ของ service ภายนอก (อ่าน env ตอนเรียกใช้ ไม่ใช่ตอน import) | secret ที่ hardcode |
| `schemas/` | schema ของ input ที่ API รับ + `z.infer` type | type ของ response |
| `types/` | type ที่ UI + API ใช้ร่วมกัน | type ของเอกสาร DB (ให้อยู่ใน `lib/db/types.ts`) |
| `constants/` | ข้อมูล static, enum ที่ zod/API/UI อ่านร่วมกัน | ข้อมูลที่ผู้ใช้/แอดมินแก้ได้ (ต้องอยู่ใน DB) |

> **ไม่มี `src/hooks/` กลาง** ในโครงอ้างอิงนี้โดยตั้งใจ — hook โหลดข้อมูลผูกกับหน้า (colocate) · hook ที่เป็น context/global (เช่นตะกร้า) อยู่คู่กับ Provider ใน `components/<feature>/`
> TODO: Confirm project-specific convention before applying this rule. ถ้าโปรเจกต์ใช้ `src/hooks/` หรือ `features/<name>/` อยู่แล้ว ให้ยึดของโปรเจกต์

### ทิศทางข้อมูล (data flow)

```
Page (page.tsx · Server)
 ↓
<Name>Client.tsx (Client) ── เรียก hooks/useLoadInitialData ที่เดียว
 ↓
API client (lib/api/client.ts → apiGet / apiSend)
 ↓
Route handler (app/api/**/route.ts)
 ↓
Auth check (requireAdmin / requireAuth) → Validation (schemas/ + parseBody)
 ↓
Database (lib/db/collections) → Serializer (lib/api/serialize) → { ok, data }
 ↓
Section component (props เท่านั้น)
```

---

## 3. Creating a New Page

### Workflow — เมื่อได้รับงาน "สร้างหน้าใหม่"

1. **ตรวจ routing** — root layout อยู่ไหน, มี segment แบบ `[locale]`/route group หรือไม่, มี `proxy.ts`/`middleware.ts` redirect อะไรบ้าง
2. **หาหน้าที่ใกล้เคียงที่สุด** (static ล้วน / มี listing / มี `[slug]`) แล้วเปิดอ่านทั้งโฟลเดอร์
3. **ตัดสินว่าหน้านี้โหลดข้อมูลหรือไม่**
   - ไม่โหลด → มีแค่ `page.tsx` (Server ล้วน) **ห้ามสร้าง `<Name>Client.tsx`**
   - โหลด → `page.tsx` + `<Name>Client.tsx` + `hooks/useLoadInitialData.ts`
   - dynamic route ที่ metadata ต้องใช้ข้อมูลจริง → เพิ่ม `hooks/server.ts`
4. **เช็ค component ที่มีอยู่** ใน `components/common/` และ `components/<feature>/` ก่อนสร้างใหม่
5. **สร้างข้อความ UI** — ถ้ามีหลายภาษา เพิ่ม dictionary ทุกภาษา (ดู [ข้อ 25](#25-internationalization-optional))
6. **จัดการ loading / error / empty / not found** ครบทุกสถานะ (ดู [ข้อ 13](#13-error-handling))
7. **ใส่ metadata** (title/description unique · canonical · OG · robots) ถ้าเป็นหน้า public (ดู [ข้อ 22](#22-seo))
8. **Responsive** — เช็คอย่างน้อยมือถือ (~390px), แท็บเล็ต, เดสก์ท็อป และจอกว้าง ต้องไม่มี horizontal scroll
9. **ตรวจ lint / type / build** (ดู [ข้อ 19](#19-testing--verification))
10. **อัปเดตเอกสาร** (ดู [ข้อ 26](#26-documentation-upkeep))

### ตัวอย่าง — หน้า static (ไม่มี API)

```tsx
// app/about/page.tsx — Server Component ล้วน ไม่มี Client.tsx
import type { Metadata } from "next";
import Container from "@/components/common/Container";
import Section from "@/components/common/Section";

export const metadata: Metadata = {
  title: "About | Site Name",
  description: "Who we are and what we do.",
};

export default function AboutPage() {
  return (
    <Section>
      <Container size="narrow">
        <h1 className="text-3xl font-semibold">About us</h1>
        <p className="mt-4 text-muted">...</p>
      </Container>
    </Section>
  );
}
```

### ตัวอย่าง — หน้าที่โหลดข้อมูล

```
app/posts/
├── page.tsx
├── PostsClient.tsx
└── hooks/useLoadInitialData.ts
```

```tsx
// app/posts/page.tsx — Server Component: metadata + ประกอบ section
import type { Metadata } from "next";
import CtaBand from "@/components/common/CtaBand";
import PostsClient from "./PostsClient";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Posts | Site Name", description: "Latest posts." };
}

export default async function PostsPage() {
  return (
    <>
      <PostsClient />   {/* ← ส่วนเดียวที่เป็น client */}
      <CtaBand />       {/* ← section ที่ไม่ใช้ข้อมูล ยังเป็น Server Component */}
    </>
  );
}
```

```tsx
// app/posts/PostsClient.tsx — เรียก hook ที่เดียว แล้วส่ง props ลงไป
"use client";

import LoadError from "@/components/common/LoadError";
import PostGrid from "@/components/post/PostGrid";
import { useLoadInitialData } from "./hooks/useLoadInitialData";

export default function PostsClient() {
  const { isLoadingInitialData, hasError, reload, posts } = useLoadInitialData();

  if (hasError) return <LoadError onRetry={reload} />;

  return <PostGrid posts={posts} isLoading={isLoadingInitialData} />;
}
```

**กฎของ page**

- **`page.tsx` เป็น Server Component เสมอ** เพื่อให้ export metadata ได้ — งานโหลดข้อมูลย้ายลงไปที่ `<Name>Client.tsx`
- ครอบ Client ให้ **แคบที่สุด** — section ที่ไม่ใช้ข้อมูลอยู่ใน `page.tsx` ตรง ๆ
- ถ้าต้อง "ซ่อน section ท้ายหน้าเมื่อหาข้อมูลไม่เจอ" ให้ส่ง section เป็น `children` ของ Client (section ยัง render ฝั่ง server แต่ Client ตัดสินว่าจะโชว์ไหม)
- **ห้ามสร้าง `layout.tsx` เพิ่มเพื่อใส่ metadata** — `page.tsx` ใส่ `generateMetadata` เองได้
- ข้อยกเว้นให้ทั้งหน้าเป็น Client ได้ **เฉพาะเมื่อมีเหตุผลจริง** (เช่น 2 section ใช้ข้อมูลชุดเดียวกันคนละตำแหน่ง แยกแล้วต้องยิง API ซ้ำ) และต้องเขียนเหตุผลไว้ในเอกสารโปรเจกต์
- หน้า dynamic ใน Next.js รุ่นใหม่: `params` เป็น Promise → `const { slug } = await params;`

> TODO: Confirm project-specific convention before applying this rule. บางโปรเจกต์ fetch ข้อมูลใน Server Component ตรง ๆ (RSC data fetching) แทน client hook — ถ้า repo ใช้แบบนั้นอยู่ ให้ยึดของ repo

---

## 4. Creating Components

### เมื่อไหร่ควรสร้าง component

- JSX ก้อนเดียวกันถูกใช้ **≥ 2 ที่** หรือกำลังจะถูกใช้ในงานนี้
- section ของหน้ามีหน้าที่ชัดเจนแยกออกมาได้ (เช่น HeroSection, FaqSection) และทำให้ `page.tsx` อ่านง่ายขึ้น
- ต้องแยก Client ออกจาก Server (ส่วนที่มี state/event แยกเป็น client ชิ้นเล็ก ที่เหลือยังเป็น server)

### เมื่อไหร่ **ไม่ควร** แยก

- JSX สั้น ๆ ใช้ครั้งเดียว และการแยกไม่ได้ทำให้อ่านง่ายขึ้น
- แยกแล้วต้องส่ง props ต่อกันหลายชั้นจนตามยากกว่าเดิม
- แค่อยากให้ไฟล์ "สั้นลง" โดยไม่มีขอบเขตหน้าที่ชัดเจน

### วางที่ไหน

| ใช้ที่ไหน | วางที่ |
|---|---|
| หลายหน้า ไม่ผูกกับ entity | `components/common/` |
| ผูกกับโดเมน (product, post, order) | `components/<feature>/` |
| layout ทั้งเว็บ | `components/layout/` |
| หน้าเดียว และผูกกับ route นั้นเท่านั้น (Client wrapper) | ข้าง `page.tsx` ในโฟลเดอร์ route |

### ตัวอย่าง — component ทั่วไป (Server Component, รับ props อย่างเดียว)

```tsx
// components/post/PostCard.tsx
import Image from "next/image";
import Link from "next/link";
import type { Post } from "@/types";
import { cn } from "@/lib/utils";

export default function PostCard({
  post,
  sizes = "(max-width: 640px) 100vw, 33vw",
  className,
}: {
  post: Post;
  /** ความกว้างจริงของการ์ดในแต่ละ breakpoint — ส่งให้ next/image */
  sizes?: string;
  className?: string;
}) {
  return (
    <Link href={`/posts/${post.slug}`} className={cn("group block", className)}>
      <div className="relative aspect-[4/3] overflow-hidden bg-surface">
        <Image src={post.image} alt={post.title} fill sizes={sizes} className="object-cover" />
      </div>
      <h3 className="mt-3 text-sm font-semibold">{post.title}</h3>
    </Link>
  );
}
```

- **ทำไมวางที่ `components/post/`** — ผูกกับ entity `Post` และถูกใช้ทั้งหน้า listing, หน้าแรก, และ "โพสต์อื่น ๆ" ท้ายหน้า detail
- **ทำไมแยก** — ใช้ ≥ 2 ที่ · มีหน้าที่ชัด (แสดงโพสต์หนึ่งใบ)
- **ไม่ใส่ `"use client"`** เพราะไม่มี state/event (hover ใช้ CSS)

### ตัวอย่าง — component ที่มี variant

```tsx
// components/common/Button.tsx
import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "outline";
type Size = "sm" | "md";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-white hover:bg-primary-dark",
  outline: "border border-ink/30 text-ink hover:border-ink/60",
};

const sizes: Record<Size, string> = {
  sm: "px-4 py-2 text-xs",
  md: "px-6 py-3 text-sm",
};

type ButtonProps = {
  href?: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
};

export default function Button({ href, variant = "primary", size = "md", className, children }: ButtonProps) {
  const classes = cn("inline-flex items-center justify-center font-medium", variants[variant], sizes[size], className);

  if (href) return <Link href={href} className={classes}>{children}</Link>;

  return <button type="button" className={classes}>{children}</button>;
}
```

### กฎของ component

- **Server Component เป็นค่าเริ่มต้น** — ใส่ `"use client"` เฉพาะเมื่อมี state, event handler, effect, หรือ browser API
- **component ห้ามโหลดข้อมูลเอง** — รับทาง props (ข้อยกเว้น: context ที่ออกแบบให้ใช้ทั่วแอป เช่นตะกร้า)
- **UI state** (แท็บที่เลือก, dropdown เปิด/ปิด) อยู่ใน component ได้ตามปกติ
- props ที่ไม่ obvious ให้ใส่ JSDoc สั้น ๆ บรรทัดเดียวเหนือ prop นั้น
- รับ `className?: string` แล้วรวมด้วย `cn()` เมื่อผู้ใช้ component อาจต้องปรับระยะ/ขนาด
- `isLoading` ให้ section เป็นคนตัดสินใจว่าจะโชว์ skeleton แบบไหน
- **Composition ก่อน config** — ถ้า prop boolean เริ่มเยอะจนกลายเป็นหลาย layout ในตัวเดียว ให้พิจารณารับ `children` หรือแยก variant

> TODO: Confirm project-specific convention before applying this rule. โครงอ้างอิงใช้ **default export + props type แบบ inline** (หรือ `type Props` ในไฟล์เมื่อยาว) ถ้า repo ใช้ named export (`export function X`) ให้ตาม repo

---

## 5. Creating Hooks

### หลักคิด

hook มีไว้เพื่อ **แยก state + side effect ออกจาก JSX** และให้ทั้งหน้ามี **แหล่งข้อมูลเดียว**
hook ไม่ใช่ที่เก็บ business rule ของ server (ราคา, สิทธิ์, สถานะ) — ของพวกนั้นอยู่ใน route handler / `lib/`

### วางที่ไหน

| ประเภท hook | วางที่ |
|---|---|
| โหลดข้อมูลของหน้า | `app/<route>/hooks/useLoadInitialData.ts` — **ของหน้านั้นเท่านั้น** |
| อ่านข้อมูลฝั่ง server ให้ metadata | `app/<route>/hooks/server.ts` (ไม่ใช่ hook จริง แต่ colocate ไว้ด้วยกัน) |
| context ที่ใช้ทั่วแอป | คู่กับ Provider ใน `components/<feature>/XxxProvider.tsx` (export `useXxx`) |
| hook UI ทั่วไปที่ใช้ ≥ 2 ที่ (useDebounce ฯลฯ) | TODO — ดูหมายเหตุด้านล่าง |

> TODO: Confirm project-specific convention before applying this rule. โครงอ้างอิงไม่มี `src/hooks/` กลาง ถ้าต้องมี hook UI ทั่วไปที่ใช้หลายหน้าจริง ให้ถามผู้ใช้ว่าจะวางที่ไหน

### กฎเหล็ก

1. **ห้าม import hook โหลดข้อมูลข้ามหน้า** แม้เป็น entity เดียวกัน — หลายหน้าเรียก endpoint เดียวกันได้ แต่ต้องมี hook ของตัวเอง
2. **มีแค่ `<Name>Client.tsx` (หรือ page ที่เป็น client) ที่เรียก `useLoadInitialData`** — component ลูกรับ props อย่างเดียว
   *เหตุผล: ถ้า 2 component ในหน้าเดียวเรียก hook เดียวกัน = ยิง API ซ้ำ และ state ไม่ตรงกัน*
3. **ห้ามเรียก `fetch` ตรง ๆ ใน hook** — ใช้ `apiGet` / `apiSend` (ดู [ข้อ 6](#6-api--service-layer))

### ตัวอย่าง — โครงมาตรฐานของ `useLoadInitialData`

```ts
// app/posts/hooks/useLoadInitialData.ts
"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api/client";
import type { Category, Post } from "@/types";

export const useLoadInitialData = () => {
  // เริ่มที่ true เพื่อไม่ให้เห็นสถานะ "ว่าง" แวบหนึ่งก่อน effect ทำงาน
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Call Post Data
  const callPosts = async () => {
    setPosts([]);

    const response = await apiGet<{ posts: Post[] }>("/api/posts");

    if (!response.ok) return false;

    setPosts(response.data.posts);
    return true;
  };

  // Call Category Data
  const callCategories = async () => {
    setCategories([]);

    const response = await apiGet<{ categories: Category[] }>("/api/categories");

    if (!response.ok) return false;

    setCategories(response.data.categories);
    return true;
  };

  const loadInitialData = async (): Promise<void> => {
    setIsLoadingInitialData(true);
    setHasError(false);

    const results = await Promise.all([callPosts(), callCategories()]);
    setIsLoadingInitialData(false);

    if (results.includes(false)) setHasError(true);
  };

  // Load initial data on component mount
  useEffect(() => {
    (async () => {
      await loadInitialData();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isLoadingInitialData, hasError, reload: loadInitialData, posts, categories };
};
```

**กติกาของโครงนี้**

- หนึ่ง API = หนึ่งฟังก์ชัน `callXxx` → ยิง API → คืน `true` / `false`
- หลาย API ในหน้าเดียว รวมด้วย `Promise.all` ใน `loadInitialData`
- `loadInitialData` คุม `isLoadingInitialData` + `hasError` ที่เดียว และคืนเป็น `reload` ให้ปุ่ม "ลองใหม่"
- `useEffect` เรียกผ่าน **async IIFE** — ผ่านกฎ `react-hooks/set-state-in-effect` ของ React 19 (ห้าม `setState` ตรง ๆ ในตัว effect)
- hook ที่ต้องรับพารามิเตอร์ (slug, page) → รับเป็นอาร์กิวเมนต์ แล้วใส่ใน dependency array: `useLoadInitialData(slug)`

**Return shape มาตรฐาน**

```ts
{
  isLoadingInitialData: boolean;
  hasError: boolean;
  reload: () => Promise<void>;   // หรือคืนค่าที่มีความหมาย เช่น total ล่าสุด (ดูด้านล่าง)
  ...data;                       // ข้อมูลที่หน้าใช้ ตั้งชื่อตาม entity
}
```

### ตัวอย่าง — hook ที่รับพารามิเตอร์ + แบ่งหน้าฝั่ง server

ใช้เมื่อหน้ามี pagination/ค้นหา/กรอง ที่ยิง API ใหม่ทุกครั้งที่ค่าเปลี่ยน

```ts
"use client";

import { useEffect, useRef, useState } from "react";
import { apiGet } from "@/lib/api/client";
import type { Post } from "@/types";

export const POSTS_PAGE_SIZE = 20;

export const useLoadInitialData = (page = 1, search = "") => {
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  // คำตอบของคำขอเก่าที่มาถึงทีหลัง ต้องไม่ทับข้อมูลของคำขอล่าสุด
  const latestRequest = useRef(0);

  // คืน total ล่าสุด (หรือ null ถ้าล้มเหลว / ถูกคำขอใหม่แซง)
  const callPosts = async (): Promise<number | null> => {
    const requestId = ++latestRequest.current;
    const params = new URLSearchParams({ page: String(page), limit: String(POSTS_PAGE_SIZE) });
    if (search.trim()) params.set("q", search.trim());

    const response = await apiGet<{ posts: Post[]; total: number }>(`/api/posts?${params}`);
    if (requestId !== latestRequest.current) return null;

    // ไม่ล้างรายการเดิมก่อนยิง — โชว์ loading ทับแถวเดิมแทนการกระพริบว่าง
    if (!response.ok) return null;

    setPosts(response.data.posts);
    setTotal(response.data.total);
    return response.data.total;
  };

  const reload = async (): Promise<number> => {
    setIsLoadingInitialData(true);
    setHasError(false);
    const result = await callPosts();
    setIsLoadingInitialData(false);
    if (result === null) setHasError(true);
    return result ?? 0;
  };

  useEffect(() => {
    (async () => {
      await reload();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  return { isLoadingInitialData, hasError, reload, posts, total };
};
```

- ผู้เรียกเก็บ `page` เป็น state แล้วผูกกับ pagination แบบ controlled
- **รีเซ็ตหน้ากลับเป็น 1 ใน event handler** ตอนเปลี่ยนตัวกรอง — ไม่ใช้ `useEffect` เฝ้าดู
- ลบรายการสุดท้ายของหน้าจนหน้านั้นว่าง → ใช้ค่า `total` ที่ `reload()` คืนมา (ไม่ใช่จาก state ใน closure) คำนวณหน้าสุดท้ายแล้วถอยกลับ **ใน handler ของปุ่มลบ**
- เปลี่ยน id ที่ดูอยู่ (เช่นเปิดรายละเอียดรายการอื่น) → ใช้ `key={id}` ที่ parent เพื่อ remount แทนการล้าง state เอง

### ตัวอย่าง — hook ของ context (ข้อยกเว้นที่ component เรียกเองได้)

```tsx
// components/cart/CartProvider.tsx
"use client";

import { createContext, useContext, useState } from "react";

type CartContextValue = { count: number; add: () => void };

const CartContext = createContext<CartContextValue | null>(null);

export default function CartProvider({ children }: { children: React.ReactNode }) {
  const [count, setCount] = useState(0);
  return <CartContext.Provider value={{ count, add: () => setCount((c) => c + 1) }}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside <CartProvider>");
  return context;
}
```

### เมื่อไหร่ **ไม่ควร** สร้าง hook

- โค้ดสั้น ใช้ครั้งเดียว และไม่มี state/effect — ห่อเป็น hook ไม่ได้ประโยชน์ทั้งด้าน reuse และ separation of concern
- แค่ derive ค่าจาก props/state → คำนวณตรง ๆ หรือใช้ `useMemo` ใน component
- logic ไม่ได้ใช้ React เลย (format, คำนวณ) → เป็นฟังก์ชันธรรมดาใน `lib/`

### ข้อควรระวัง

- hook ใช้ `useState`/`useEffect` → ไฟล์และผู้เรียกต้องเป็น Client Component
- ห้ามเรียกฟังก์ชันที่ขึ้นต้นด้วย `use` จาก async function หรือหลัง early return (`react-hooks/rules-of-hooks`)
- ถ้าต้องเช็คค่า (เช่น `isLocale(locale)`) แล้ว return ก่อน — ให้เรียก hook **ก่อน** เช็ค

---

## 6. API / Service Layer

<!-- TODO: AI MUST REVIEW THIS SECTION FOR EACH PROJECT -->
> TODO: Confirm project-specific convention before applying this rule. โครงอ้างอิงคือ REST route handler ใน `app/api/**` + database driver ตรง (ไม่มี ORM) ถ้าโปรเจกต์ใช้ Server Actions, tRPC, GraphQL, ORM (Prisma/Drizzle) หรือ backend แยก ให้ map แนวคิด (envelope · validate · auth · serialize) เข้ากับของจริง

### ตำแหน่งของแต่ละชั้น

| ชั้น | อยู่ที่ | หน้าที่ |
|---|---|---|
| API client (browser) | `lib/api/client.ts` | `apiGet` / `apiSend` — แกะซอง `{ ok, data }` และดัก network error ให้ |
| Route handler | `app/api/<resource>/route.ts` | รับ request → auth → validate → เรียก DB/service → serialize → ตอบ |
| Response helper | `lib/api/response.ts` | `apiOk` · `apiError` · `parseBody` · `apiCatch` |
| Validation | `schemas/<entity>.ts` | zod schema ของ input |
| Auth | `lib/auth/` | `requireAdmin()` / `requireAuth()` เรียกในทุก mutation |
| DB access | `lib/db/` | client (cache connection) + accessor ต่อ collection/table + type ของเอกสาร |
| Serializer | `lib/api/serialize.ts` | แปลงเอกสาร DB → type ของ UI (`_id` → `id`, `Date` → ISO) และ **ตัด field ภายในทิ้ง** |
| Service / domain logic | `lib/<domain>/` | logic ที่ใช้ ≥ 2 route หรือซับซ้อน (email, payment, storage, กติกาเฉพาะ) |
| Server data สำหรับ metadata | `app/<route>/hooks/server.ts` | query DB ตรง + serializer ตัวเดียวกับ API · `import "server-only"` |

### Response envelope — ทุก endpoint ใช้ซองเดียวกัน

```ts
// สำเร็จ
{ ok: true, data: { posts: Post[], total: number, page: number, limit: number } }
// ล้มเหลว
{ ok: false, error: { message: string, issues?: ZodIssue[] } }
```

- **"ไม่พบ" ใน GET รายการเดียว** ให้ตอบ `{ ok: true, data: { post: null } }` เพื่อให้หน้าเว็บแยก "ไม่มีจริง" กับ "ยิงพลาด" ได้
- list ที่แบ่งหน้าคืน `total` · `page` · `limit` เสมอ

### ตัวอย่าง — `lib/api/response.ts`

```ts
import { ZodError, type ZodType } from "zod";

export function apiOk<T extends Record<string, unknown>>(data: T, status = 200): Response {
  return Response.json({ ok: true, data }, { status });
}

export function apiError(message: string, status = 400, issues?: unknown): Response {
  return Response.json({ ok: false, error: { message, ...(issues ? { issues } : {}) } }, { status });
}

/** อ่าน JSON body แล้ว validate ในขั้นตอนเดียว — ไม่ผ่านคืน response ที่พร้อมส่งกลับ */
export async function parseBody<T>(
  request: Request,
  schema: ZodType<T>,
): Promise<{ ok: true; data: T } | { ok: false; response: Response }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { ok: false, response: apiError("Invalid JSON body", 400) };
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, response: apiError("Validation failed", 422, parsed.error.issues) };
  }
  return { ok: true, data: parsed.data };
}

/** ตัวจับ error ตัวสุดท้าย — ไม่ปล่อยรายละเอียดภายในออกไปหา client */
export function apiCatch(error: unknown, context: string): Response {
  if (error instanceof ZodError) return apiError("Validation failed", 422, error.issues);
  console.error(`[api] ${context}`, error);
  return apiError("Internal server error", 500);
}
```

### ตัวอย่าง — `lib/api/client.ts` (browser)

```ts
export type ApiResult<T> = { ok: true; data: T } | { ok: false; data: null; error: string };

async function request<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const response = await fetch(path, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    });
    const body = await response.json().catch(() => null);

    if (!response.ok || !body?.ok || body.data === undefined) {
      return { ok: false, data: null, error: body?.error?.message ?? `HTTP ${response.status}` };
    }
    return { ok: true, data: body.data as T };
  } catch (error) {
    return { ok: false, data: null, error: error instanceof Error ? error.message : "network error" };
  }
}

export const apiGet = <T>(path: string) => request<T>(path);

export const apiSend = <T>(method: "POST" | "PATCH" | "DELETE", path: string, payload?: unknown) =>
  request<T>(path, { method, ...(payload === undefined ? {} : { body: JSON.stringify(payload) }) });
```

### ตัวอย่าง — route handler (list + create)

```ts
// app/api/posts/route.ts
import type { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { apiCatch, apiError, apiOk, parseBody } from "@/lib/api/response";
import { escapeRegex, readInt } from "@/lib/api/query";
import { serializePost } from "@/lib/api/serialize";
import { postsCollection } from "@/lib/db/collections";
import type { PostDoc } from "@/lib/db/types";
import { createPostSchema } from "@/schemas/post";

// route ที่ต่อ DB ตอนมี request จริง — ห้ามให้ build พยายาม prerender
export const dynamic = "force-dynamic";

/** GET /api/posts · query: q · page · limit → { posts, total, page, limit } */
export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const filter: Record<string, unknown> = {};

    const search = params.get("q")?.trim();
    if (search) filter.title = new RegExp(escapeRegex(search), "i"); // escape ก่อนเสมอ

    const limit = readInt(params, "limit", 20, { min: 1, max: 200 }); // clamp เพดาน
    const page = readInt(params, "page", 1, { min: 1, max: 10_000 });

    const posts = await postsCollection();
    const [docs, total] = await Promise.all([
      posts.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).toArray(),
      posts.countDocuments(filter),
    ]);

    return apiOk({ posts: docs.map(serializePost), total, page, limit });
  } catch (error) {
    return apiCatch(error, "GET /api/posts");
  }
}

/** POST /api/posts — แอดมินเท่านั้น */
export async function POST(request: Request) {
  try {
    const denied = await requireAdmin();          // 1. auth ก่อนทุกอย่าง
    if (denied) return denied;

    const parsed = await parseBody(request, createPostSchema); // 2. validate
    if (!parsed.ok) return parsed.response;

    const posts = await postsCollection();
    if (await posts.findOne({ slug: parsed.data.slug })) {     // 3. กติกาธุรกิจ
      return apiError("Slug already exists", 409);
    }

    const now = new Date();
    const doc: Omit<PostDoc, "_id"> = { ...parsed.data, createdAt: now, updatedAt: now };
    const result = await posts.insertOne(doc as PostDoc);

    return apiOk({ post: serializePost({ ...doc, _id: result.insertedId }) }, 201); // 4. serialize
  } catch (error) {
    return apiCatch(error, "POST /api/posts");
  }
}
```

### ตัวอย่าง — route handler (one + update + delete)

```ts
// app/api/posts/[id]/route.ts
export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;

    const { id } = await ctx.params;
    if (!isObjectIdLike(id)) return apiError("Invalid id", 400);

    const parsed = await parseBody(request, updatePostSchema);
    if (!parsed.ok) return parsed.response;

    const posts = await postsCollection();
    const doc = await posts.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { ...parsed.data, updatedAt: new Date() } },
      { returnDocument: "after" },
    );
    if (!doc) return apiError("Not found", 404);

    return apiOk({ post: serializeAdminPost(doc) });
  } catch (error) {
    return apiCatch(error, "PATCH /api/posts/[id]");
  }
}
```

### ตัวอย่าง — DB client + accessor

```ts
// lib/db/client.ts — อ่าน env ตอนเรียกใช้ ไม่ใช่ตอน import (build ไม่ได้มี env ครบเสมอ)
import { MongoClient, type Db } from "mongodb";

// dev hot reload โหลดโมดูลใหม่ทุกครั้ง — cache client บน globalThis กัน connection บาน
const globalForDb = globalThis as typeof globalThis & { _dbClient?: Promise<MongoClient> };

export function getDbClient(): Promise<MongoClient> {
  const uri = process.env.DATABASE_URI;
  if (!uri) throw new Error("DATABASE_URI is not set — see .env.example");
  globalForDb._dbClient ??= new MongoClient(uri).connect();
  return globalForDb._dbClient;
}

export async function getDb(): Promise<Db> {
  return (await getDbClient()).db(process.env.DATABASE_NAME);
}
```

```ts
// lib/db/collections.ts
export async function postsCollection(): Promise<Collection<PostDoc>> {
  return (await getDb()).collection<PostDoc>("posts");
}
```

### ตัวอย่าง — serializer (public vs admin)

```ts
// lib/api/serialize.ts
export function serializePost(doc: PostDoc): Post {
  return {
    id: doc._id.toHexString(),
    slug: doc.slug,
    title: doc.title,
    image: doc.image,
    publishedAt: doc.publishedAt.toISOString(),
  }; // ตั้งใจไม่ส่ง field ภายใน (internalNote, createdBy ฯลฯ) ออก public API
}

export function serializeAdminPost(doc: PostDoc) {
  return { ...serializePost(doc), internalNote: doc.internalNote ?? null, updatedAt: doc.updatedAt.toISOString() };
}
```

### ตัวอย่าง — server data ของ `generateMetadata`

```ts
// app/posts/[slug]/hooks/server.ts
import "server-only"; // build พังทันทีถ้าถูก import เข้า client

import { serializePost } from "@/lib/api/serialize";
import { postsCollection } from "@/lib/db/collections";

export async function findPostBySlug(slug: string) {
  const doc = await (await postsCollection()).findOne({ slug });
  return doc ? serializePost(doc) : null;
}
```

> `generateMetadata` ไม่ควรยิง HTTP กลับมาที่ตัวเอง (ต้องรู้ base URL) — อ่าน DB ตรงผ่านไฟล์นี้แทน

### กฎของ API

- **ทุก mutation (`POST`/`PATCH`/`DELETE`) เรียก `requireAdmin()`/`requireAuth()` ที่ route handler เสมอ** — แม้ proxy/middleware กันไว้แล้ว
- **validate ทุก input ด้วย schema ฝั่ง server** — ห้ามเชื่อ client
- **ค่าที่มีผลทางธุรกิจ (ราคา, ยอดรวม, สิทธิ์, เวลา) คำนวณฝั่ง server** — client ส่งมาแค่ "เจตนา" (id, จำนวน, ตัวเลือก)
- **shape ของ response ต้องไม่ขึ้นกับ cookie** — ถ้าต้องมีฉบับแอดมิน ใช้ query ชัดเจน เช่น `?view=admin` + เช็คสิทธิ์ (การสลับ shape ตาม session ทำให้หน้าสาธารณะพังเมื่อผู้ใช้คนเดียวกันเปิดหลังบ้านค้างไว้)
- **operation ที่อาจถูกเรียกซ้ำ/พร้อมกัน** (webhook, ปุ่มกดรัว) ต้อง idempotent ที่ระดับ DB (update แบบมีเงื่อนไข / atomic) ไม่ใช่แค่ `if` ในโค้ด
- **งานรอง (อีเมล, แจ้งเตือน) ต้องไม่ทำให้งานหลักพัง** — ไม่ throw ออกมา, log แล้วจบ, และรันหลังตอบ response ได้ (เช่น `after()` ของ Next)
- **งานตามเวลา** ใช้ cron endpoint ที่ป้องกันด้วย secret — ห้ามใช้ `setInterval`/`setTimeout` บน serverless

---

## 7. Types

### วางที่ไหน

| ประเภท | วางที่ |
|---|---|
| type ที่ UI + API ใช้ร่วมกัน (shape ของ response) | `types/index.ts` (หรือ `types/<domain>.ts` เมื่อยาว) |
| type ของหลังบ้าน (ฟิลด์เยอะกว่า public) | `types/admin.ts` |
| type ของเอกสารใน DB (มี `ObjectId`, `Date`) | `lib/db/types.ts` — **ใช้ฝั่ง server เท่านั้น** |
| type ของ input API | `schemas/<entity>.ts` ผ่าน `z.infer` — ไม่เขียนซ้ำด้วยมือ |
| type ของ props / ใช้ในไฟล์เดียว | ในไฟล์นั้นเลย |
| type ของไลบรารีที่ไม่มี `.d.ts` | `types/<package-name>.d.ts` เขียนเฉพาะส่วนที่ใช้จริง |

### ตัวอย่าง

```ts
// types/index.ts — shape ที่ UI ใช้ ตรงกับ response ของ API
export type Post = {
  id: string;
  slug: string;
  title: string;
  image: string;
  /** ISO 8601 พร้อม timezone — format ตอน render */
  publishedAt: string;
};

/** ฉบับเต็ม — ตรงกับ GET /api/posts/:slug */
export type PostDetail = Post & { content: PostBlock[] };

/** discriminated union สำหรับข้อมูลที่มีหลายชนิด */
export type PostBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "list"; items: string[] };
```

```ts
// lib/db/types.ts — เอกสารใน DB (server only)
import type { ObjectId } from "mongodb";

export type PostDoc = {
  _id: ObjectId;
  slug: string;
  title: string;
  image: string;
  content: PostBlock[];
  internalNote?: string;
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};
```

### กฎ

- ใช้ `type` เป็นหลัก — TODO: Confirm project-specific convention before applying this rule. (บางโปรเจกต์ใช้ `interface`)
- ใช้ `import type { ... }` เมื่อ import แค่ type
- ฟิลด์ที่ความหมายไม่ obvious ใส่ JSDoc สั้น ๆ
- **ห้ามใช้ `any`** — ถ้าจำเป็นจริงใช้ `unknown` แล้ว narrow
- **แยก type ของ DB กับ type ของ UI เสมอ** แล้วเชื่อมด้วย serializer — UI ไม่ต้องรู้จัก `ObjectId`/`Date`
- ค่าคงที่ที่เป็นชุดตัวเลือก ให้ derive type จาก constant: `type Key = (typeof ITEMS)[number]["key"]`
- ใช้ `Record<Key, T>` กับ map ที่ต้องครบทุก key — เพิ่ม key ใหม่แล้วลืม TypeScript จะฟ้อง

---

## 8. Validation / Schema

> TODO: Confirm project-specific convention before applying this rule. ตัวอย่างใช้ zod — ถ้าโปรเจกต์ใช้ไลบรารีอื่น (yup, valibot) ให้ตาม repo

### วางที่ไหน

- `schemas/common.ts` — schema ที่ใช้ซ้ำ (slug, image URL, id, pagination)
- `schemas/<entity>.ts` — `createXxxSchema` · `updateXxxSchema` · `export type XxxInput = z.infer<...>`

### ตัวอย่าง

```ts
// schemas/common.ts
import { z } from "zod";

export const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug allows a-z, 0-9 and - only");

export const imageSchema = z
  .string()
  .trim()
  .refine((v) => v.startsWith("/") || /^https?:\/\//.test(v), "must be a path or http(s) URL");
```

```ts
// schemas/post.ts
import { z } from "zod";
import { imageSchema, slugSchema } from "./common";

export const createPostSchema = z.object({
  slug: slugSchema,
  title: z.string().trim().min(1).max(200),
  image: imageSchema,
  publishedAt: z.iso.datetime({ offset: true }),
  tags: z.array(z.string().trim().min(1)).default([]),
});

/** ห้ามใช้ .partial() เฉย ๆ เมื่อ create schema มี .default()
 *  zod v4 ยังเติม default ให้ field ที่ไม่ได้ส่งมา → PATCH { title } จะได้ tags: [] ไปเขียนทับข้อมูลเดิม
 *  ให้ .extend() ทับ field ที่มี default ด้วย .optional() ล้วน */
export const updatePostSchema = createPostSchema.partial().extend({
  tags: z.array(z.string().trim().min(1)).optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
```

### กฎ

- **server validation บังคับเสมอ** (ที่ route handler ผ่าน `parseBody`) · client validation เป็นแค่ UX
- **ห้ามเชื่อข้อมูลจาก client** — ทั้ง body, query, header, form-data, ชื่อไฟล์
- `.trim()` string ทุกตัว, ใส่ `.max()` ทุก string/array เพื่อกันข้อมูลยักษ์
- ใส่ `.default()` เฉพาะเมื่อ "ไม่ส่งมา" แปลว่า "ค่านั้น" จริง ๆ — field ที่ PATCH แล้วไม่ควรโดนแตะ **ห้ามมี default ใน update schema**
- enum ที่ UI/API/DB ใช้ร่วม ให้ derive จาก `constants/` (`z.enum(KEYS)`) — แหล่งเดียว
- query string ของ listing → อ่านด้วย helper ที่ clamp ค่า (`readInt(params, "limit", 20, { min: 1, max: 200 })`)
- ข้อความ error ของ schema ใช้ภาษาที่ผู้ใช้ระบบเห็น — TODO: Confirm project-specific convention before applying this rule.

---

## 9. State Management

<!-- TODO: AI MUST REVIEW THIS SECTION FOR EACH PROJECT -->

โครงอ้างอิง **ไม่ใช้ global state library** (ไม่มี Redux/Zustand/React Query) — ใช้ของ React ล้วน

| ประเภท | ใช้เมื่อ | เครื่องมือ |
|---|---|---|
| **Local state** | UI ของ component เดียว (แท็บ, modal, ค่าในฟอร์ม) | `useState` ใน component |
| **Page data (server state)** | ข้อมูลจาก API ของหน้า | `useLoadInitialData` ของหน้า → ส่ง props |
| **URL state** | ค่าที่ควร share/bookmark ได้ (ตัวกรอง, หน้า, ค้นหา) | `searchParams` / dynamic segment |
| **Global state** | ข้อมูลที่ทุกหน้าต้องเห็นพร้อมกัน (ตะกร้า, ธีม, session ฝั่ง UI) | React Context + Provider ใน root layout |
| **Persisted client state** | ต้องอยู่หลังรีเฟรช และตกลงแล้วว่าไม่เก็บ server | `localStorage` ผ่าน Provider (อ่านหลัง hydrate เท่านั้น) |

**กฎ**

- **ห้ามเพิ่ม global state ถ้า local state พอ** · ห้ามเพิ่มไลบรารี state ใหม่โดยไม่ถามก่อน
- state ที่ derive ได้ **ไม่ต้องเก็บซ้ำ** — คำนวณจาก state หลัก (หรือ `useMemo` ถ้าแพงจริง)
- `localStorage` ไม่มีตอน SSR → อ่านใน effect หลัง hydrate แล้วค่อยเปิดการเขียนกลับ (flag `isReady`)
- ข้อมูลจาก server ห้ามเชื่อถือจากค่าใน `localStorage` (ราคา, สถานะชำระเงิน) — ต้องอ่านจาก API
- ระวัง **bfcache**: หน้าที่ถูกคืนด้วยปุ่ม Back อาจได้ state เดิม (เช่น `isSubmitting` ค้าง true) → ฟัง `pageshow` + `event.persisted` แล้วรีเซ็ต

> TODO: Confirm project-specific convention before applying this rule. ถ้าโปรเจกต์ใช้ React Query/SWR/Zustand อยู่แล้ว ให้ใช้ตามนั้นแทนตารางนี้

---

## 10. Styling

<!-- TODO: AI MUST REVIEW THIS SECTION FOR EACH PROJECT -->
> TODO: Confirm project-specific convention before applying this rule. โครงอ้างอิงใช้ **Tailwind CSS v4** (token ใน `@theme` ของ `globals.css`) สำหรับหน้า public และ **UI library (antd)** สำหรับหลังบ้าน — ระบุของจริงใน [ข้อ 27](#27-project-specific-checklist-ต้องเติมทุกโปรเจกต์)

### Design tokens — แหล่งเดียว

```css
/* app/globals.css (Tailwind v4 — ไม่มี tailwind.config) */
@import "tailwindcss";

@theme {
  --color-primary: #1f2937;
  --color-primary-dark: #111827;
  --color-surface: #f6f4f0;
  --color-ink: #1c1c1a;
  --color-muted: #8b8b85;
  --color-line: #e4e0d8;

  /* ความกว้างของเนื้อหา → gen utility max-w-narrow / max-w-wide */
  --container-narrow: 1180px;
  --container-wide: 1440px;
}
```

### กฎ

- **ห้าม hardcode สี/ขนาดความกว้างนอกไฟล์ token** — ใช้ `bg-primary`, `max-w-wide` แทน `bg-[#1f2937]`, `max-w-[1440px]`
- เพิ่ม token ใหม่ **เฉพาะเมื่อมีหน้าที่ใช้จริง** และบันทึกในเอกสารโปรเจกต์
- สีของแบรนด์ภายนอก (โลโก้ธนาคาร/พาร์ทเนอร์) **ไม่ใช่ design token** — เก็บคู่กับ config ของสิ่งนั้น
- รวม class แบบมีเงื่อนไขด้วย `cn()` จาก `lib/utils.ts` — **ห้ามสร้าง styling helper ใหม่ถ้ามีอยู่แล้ว**
- variant ของ component → object map (`variants: Record<Variant, string>`) ดู [ข้อ 4](#4-creating-components)
- layout ซ้ำ ๆ (container, section spacing) → ใช้ component กลาง (`Container`, `Section`) ไม่ก็อป class
- **Mobile first**: class ไม่มี prefix = มือถือ แล้วเติม `sm:` `md:` `lg:`
- จอกว้างมาก (2560px+) ต้องไม่ยืดเนื้อหาตาม viewport — cap ด้วย token ความกว้าง แล้ว center
- hover/transition ง่าย ๆ ใช้ CSS ล้วน (`group-hover:`) ไม่ต้องพึ่ง JS
- เคารพ `prefers-reduced-motion` — เนื้อหาต้องมองเห็นได้เสมอแม้ปิดแอนิเมชัน
- แอนิเมชันตอนเลื่อนหน้า (ถ้ามี) ให้มี **wrapper จุดเดียว** (เช่น `<Reveal>`) ครอบ section ใน `page.tsx` · **ห้ามครอบ hero/LCP**
- UI library ก้อนใหญ่ในหน้า public ต้อง **lazy-load** (`dynamic(() => import(...))`) เฉพาะที่ทุ่นแรงจริง
- หลังบ้านใช้ theme จาก provider จุดเดียว + ไฟล์สีกลางของหลังบ้าน — ห้ามใส่สีใหม่ในหน้า

---

## 11. Forms

<!-- TODO: AI MUST REVIEW THIS SECTION FOR EACH PROJECT -->
> TODO: Confirm project-specific convention before applying this rule. โครงอ้างอิงมี 2 แบบ: ฟอร์มเล็กฝั่ง public = `useState` + `<form>` ธรรมดา · ฟอร์มยาวหลังบ้าน = antd `Form` ถ้าโปรเจกต์ใช้ react-hook-form หรือ Server Actions ให้ตาม repo

### Flow มาตรฐาน

```
กรอก → client validation (UX) → submit (isSubmitting = true, ปิดปุ่ม)
     → toPayload(values)  ตัดค่าว่าง/แปลง null → undefined
     → apiSend(...)       server validate ซ้ำ + auth
     → ok?  success: แจ้ง, reset หรือ redirect + refresh
            error:   แจ้ง error.message, คงค่าที่กรอกไว้
     → isSubmitting = false
```

### ตัวอย่าง — ฟอร์มเล็ก (public)

```tsx
"use client";

import { useState } from "react";
import { apiSend } from "@/lib/api/client";

export default function SubscribeForm({ source }: { source: string }) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus("idle");

    const response = await apiSend("POST", "/api/contact", { email, source });

    setIsSubmitting(false);

    if (!response.ok) {
      setStatus("error");
      return;
    }

    setStatus("success");
    setEmail(""); // reset เฉพาะตอนสำเร็จ
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        aria-label="Email"
        className="border px-4 py-2"
      />
      <button type="submit" disabled={isSubmitting}>Subscribe</button>
      {status === "success" && <p role="status">Thanks!</p>}
      {status === "error" && <p role="alert">Something went wrong. Please try again.</p>}
    </form>
  );
}
```

### ตัวอย่าง — create / edit ใช้ฟอร์มตัวเดียวกัน

```tsx
// components/admin/PostForm.tsx — ฟอร์มกลางของ create และ edit
export type PostFormValues = { slug: string; title: string; image: string; tags?: string[] };

/** ตัดค่าว่างก่อนส่ง — schema ฝั่ง server ไม่รับ null และไม่ควรบันทึก field ที่ยังไม่กรอก */
export function toPostPayload(values: PostFormValues) {
  return {
    slug: values.slug.trim(),
    title: values.title.trim(),
    image: values.image,
    tags: (values.tags ?? []).filter((tag) => tag.trim()),
  };
}

export default function PostForm({
  initialValues,
  submitLabel,
  onSubmit,
}: {
  initialValues?: Partial<PostFormValues>;
  submitLabel: string;
  onSubmit: (payload: ReturnType<typeof toPostPayload>) => Promise<void>;
}) {
  const [form] = Form.useForm<PostFormValues>();
  const [isSaving, setIsSaving] = useState(false);

  const handleFinish = async (values: PostFormValues) => {
    setIsSaving(true);
    await onSubmit(toPostPayload(values));
    setIsSaving(false);
  };

  return (
    <Form form={form} layout="vertical" initialValues={initialValues} onFinish={handleFinish}>
      <Form.Item name="title" label="Title" rules={[{ required: true, message: "Enter a title" }]}>
        <Input />
      </Form.Item>
      {/* ... */}
      <Button type="primary" htmlType="submit" loading={isSaving}>{submitLabel}</Button>
    </Form>
  );
}
```

```tsx
// app/admin/posts/[id]/EditPostClient.tsx — หน้าเป็นคนตัดสินใจว่าจะยิง PATCH ไปไหน
const handleSubmit = async (payload: unknown) => {
  const response = await apiSend("PATCH", `/api/posts/${id}`, payload);

  if (!response.ok) {
    message.error(response.error);
    return;
  }

  message.success("Saved");
  router.push("/admin/posts");
  router.refresh();
};

// แปลง null จาก API เป็น undefined ก่อนเป็น initialValues (ไม่งั้นช่องโชว์ "null")
<PostForm initialValues={{ ...post, tags: post.tags ?? undefined }} submitLabel="Save" onSubmit={handleSubmit} />
```

### กฎ

- **create กับ edit ใช้ฟอร์มตัวเดียวกัน** ต่างกันที่ `initialValues` + `onSubmit`
- ฟอร์มไม่รู้ endpoint — หน้า (`New…Client` / `Edit…Client`) เป็นคนยิง API
- ปุ่ม submit ต้อง disable/loading ระหว่างส่ง (กันดับเบิลคลิก) — และ server ต้องกันซ้ำอีกชั้นถ้าผลกระทบสูง
- **action ที่ย้อนกลับไม่ได้หรือมีผลข้างเคียง** (ลบ, เปลี่ยนสถานะที่ส่งอีเมล, คืนเงิน) ต้องมีกล่องยืนยันที่บอกผลที่ตามมา
- select ที่ผูกกับค่าใน DB: กดยกเลิกในกล่องยืนยันต้องเด้งกลับค่าเดิม (อย่าอัปเดต state ก่อนยืนยัน)
- ฟอร์มยาวแบ่งเป็นการ์ด/แท็บ · submit ไม่ผ่านต้องพาไปแท็บ/ช่องที่ error เอง
- **ห้ามเปลี่ยนชื่อ field ของฟอร์ม หรือ `toXxxPayload` เพื่อความสวย** — ผูกกับ API contract
- ช่องที่เป็นตัวเลือกคงที่ (จังหวัด, ประเทศ) ใช้ list ใน `constants/` — ไม่ดึง API ภายนอกให้เป็นจุดล่มเพิ่ม

---

## 12. Authentication / Authorization

<!-- TODO: AI MUST REVIEW THIS SECTION FOR EACH PROJECT -->
> TODO: Confirm project-specific convention before applying this rule. โครงอ้างอิงคือ **แอดมินบัญชีเดียวจาก env + JWT ใน HttpOnly cookie** ถ้าโปรเจกต์มีระบบสมาชิก/role/OAuth/Auth provider ให้ระบุของจริงใน [ข้อ 27](#27-project-specific-checklist-ต้องเติมทุกโปรเจกต์)

### ชั้นการป้องกัน

```
1. proxy.ts / middleware.ts   ← optimistic check: cookie valid ไหม → ไม่ valid redirect ไป /login?next=<path>
2. route handler              ← requireAdmin() / requireAuth() ทุก mutation และทุก GET ที่เป็นข้อมูลภายใน  ← ด่านจริง
3. serializer                 ← ส่งเฉพาะ field ที่ผู้เรียกมีสิทธิ์เห็น
```

**proxy/middleware ไม่ใช่ระบบ auth** — ห้ามพึ่งด่านนี้อย่างเดียว

### ตัวอย่าง

```ts
// lib/auth/session.ts
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "app_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(userId: string, role: string) {
  return new SignJWT({ role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecret());
}

/** คืน null เมื่อไม่มี / หมดอายุ / ถูกแก้ */
export async function verifySessionToken(token?: string) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload.sub ? { userId: payload.sub, role: String(payload.role) } : null;
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
};
```

```ts
// lib/auth/admin.ts
import { cookies } from "next/headers";
import { apiError } from "@/lib/api/response";
import { SESSION_COOKIE, verifySessionToken } from "./session";

/** ยามหน้า route handler — คืน Response เมื่อไม่ผ่าน, null เมื่อผ่าน */
export async function requireAdmin(): Promise<Response | null> {
  const session = await verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session || session.role !== "admin") return apiError("Unauthorized", 401);
  return null;
}
```

### กฎ

- **ห้ามเชื่อ role/สิทธิ์จาก client** (body, query, localStorage) — อ่านจาก session ที่เซ็นแล้วฝั่ง server เท่านั้น
- session เก็บใน cookie `HttpOnly` + `SameSite=Lax` + `Secure` (production) — **ไม่เก็บ token ใน localStorage**
- ไม่ส่งรหัสผ่าน/secret กลับไป client · payload ของ JWT ไม่มีข้อมูลลับ
- เทียบรหัสผ่าน/secret แบบ **constant time** (hash ทั้งสองฝั่งแล้ว `timingSafeEqual`) และไม่ short-circuit
- login สำเร็จแล้วพากลับ `next` — ต้องเช็คว่าเป็น path ภายใน (ขึ้นต้นด้วย `/` และไม่ใช่ `//`) กัน open redirect
- หน้า login อยู่นอก layout ที่ต้อง login (route group) เพื่อไม่ให้ redirect วน
- หน้าหลังบ้านใส่ `robots: { index: false, follow: false }` และ disallow ใน robots.txt

---

## 13. Error Handling

| สถานการณ์ | ฝั่ง server | ฝั่ง UI |
|---|---|---|
| **Validation error** | `422` + `issues` (ผ่าน `parseBody`) | แสดงข้อความที่ช่อง / แจ้ง `response.error` |
| **Auth** | `401` (ไม่ login) · `403` (ไม่มีสิทธิ์) | redirect ไป login / แจ้งไม่มีสิทธิ์ |
| **Not found** | GET รายการเดียว: `200` + `data: { item: null }` · PATCH/DELETE: `404` | หน้า public: `notFound()` · หลังบ้าน: หน้า "ไม่พบ" + ปุ่มกลับ |
| **Conflict / สถานะไม่ถูกต้อง** | `409` (slug ซ้ำ, ทำ action ที่ยังไม่ถึงขั้น) | แจ้งข้อความจาก API |
| **ไฟล์ผิดชนิด / ใหญ่เกิน** | `415` / `413` | แจ้งข้อความจาก API |
| **Network error** | — | `apiGet/apiSend` คืน `ok: false` ให้เอง → `hasError` |
| **Unexpected** | `apiCatch` → log ภายใน + `500 "Internal server error"` (ไม่ส่ง stack) | `LoadError` + ปุ่มลองใหม่ |
| **Loading** | — | skeleton ในตำแหน่งจริงของเนื้อหา (ไม่ใช่ spinner เต็มจอ) |
| **Empty** | `200` + list ว่าง | `EmptyState` ข้อความตามบริบท (ไม่มีข้อมูล vs ไม่ตรงตัวกรอง) |

### ตัวอย่าง — หน้า detail ครบทุกสถานะ

```tsx
"use client";

export default function PostDetailClient({ slug }: { slug: string }) {
  const { isLoadingInitialData, hasError, reload, post } = useLoadInitialData(slug);

  if (isLoadingInitialData && !post) return <PostSkeleton />;   // loading ครั้งแรกเท่านั้น
  if (hasError) return <LoadError onRetry={reload} />;           // ยิงพลาด
  if (!post) return <NotFoundBlock />;                           // ไม่มีจริง

  return <PostContent post={post} />;
}
```

- `isLoadingInitialData && !post` → ตอน `reload()` จะไม่วูบกลับเป็น skeleton ทั้งหน้า
- `LoadError` แทนที่ **เฉพาะ section ที่โหลดข้อมูล** ส่วนอื่นของหน้ายังแสดงปกติ

### ตัวอย่าง — จัดการ error ของ mutation

```ts
const handleDelete = async (post: Post) => {
  const response = await apiSend("DELETE", `/api/posts/${post.id}`);

  if (!response.ok) {
    message.error(response.error);   // ข้อความจาก server
    return;
  }

  message.success("Deleted");
  await reload();
};
```

### กฎ

- route handler ทุกตัวครอบด้วย `try { ... } catch (error) { return apiCatch(error, "METHOD /path"); }`
- **ห้ามปล่อยรายละเอียดภายใน** (stack, query, ชื่อ collection, error ของ service ภายนอก) ออก response
- log ด้วย context ที่ค้นหาได้ (`[api] POST /api/posts`) · **ห้าม log secret, token, body ที่มีข้อมูลส่วนบุคคลหรือข้อมูลการชำระเงิน**
- ไม่กลืน error เงียบ ๆ — ถ้าตั้งใจไม่ throw (เช่นงานรอง) ต้อง log และมีคอมเมนต์บอกเหตุผล
- รูปภาพที่โหลดไม่ขึ้นไม่ควรทำให้ทั้ง component พัง — ถอดออกจาก list หรือ fallback
- 404 ของ route ที่ไม่มีอยู่จริง vs `notFound()` จากหน้าที่ match แล้ว อาจต้องใช้ไฟล์ต่างกันตามโครง root layout — เช็คเอกสารของ framework (TODO: ระบุของโปรเจกต์)

---

## 14. Naming Convention

> TODO: Confirm project-specific convention before applying this rule. ตารางนี้มาจากโปรเจกต์อ้างอิง — เช็คไฟล์จริงของ repo ก่อนเสมอ

| สิ่งที่ตั้งชื่อ | รูปแบบ | ตัวอย่าง |
|---|---|---|
| Component (ไฟล์ + ชื่อ) | PascalCase | `PostCard.tsx` → `export default function PostCard` |
| Client wrapper ของหน้า | `<Name>Client.tsx` | `PostsClient.tsx` · `EditPostClient.tsx` · `NewPostClient.tsx` |
| Section component | `<Name>Section.tsx` | `HeroSection.tsx` · `FaqSection.tsx` |
| Provider / context | `<Name>Provider.tsx` + `use<Name>()` | `CartProvider.tsx` · `useCart()` |
| Hook | `useXxx` camelCase | `useLoadInitialData` |
| Hook ไฟล์ | camelCase ตรงกับชื่อ hook | `hooks/useLoadInitialData.ts` |
| Server data helper | `hooks/server.ts` · ฟังก์ชัน `findXxxByYyy` | `findPostBySlug` |
| Function / variable | camelCase | `formatDate` · `isSubmitting` |
| Boolean | `is` / `has` / `can` / `should` | `isLoading` · `hasError` |
| Event handler | `handleXxx` (ภายใน) · `onXxx` (prop) | `handleSubmit` · `onRetry` |
| API call ใน hook | `callXxx` | `callPosts` · `callCategories` |
| Constant (ค่าคงที่ระดับโมดูล / config) | UPPER_SNAKE_CASE | `SESSION_MAX_AGE_SECONDS` · `POSTS_PAGE_SIZE` |
| Static data list ใน constants | camelCase หรือ UPPER_SNAKE_CASE ตาม repo | `socialLinks` · `PAYMENT_CHANNELS` |
| Type / interface | PascalCase | `Post` · `PostDetail` · `ApiResult<T>` |
| Type ของเอกสาร DB | `<Entity>Doc` | `PostDoc` |
| Schema | `<action><Entity>Schema` | `createPostSchema` · `updatePostSchema` |
| Input type จาก schema | `<Action><Entity>Input` | `CreatePostInput` |
| Serializer | `serialize<Entity>` · `serializeAdmin<Entity>` | `serializePost` |
| Collection accessor | `<entities>Collection()` | `postsCollection()` |
| ไฟล์ util / lib | camelCase | `utils.ts` · `formatDate.ts` · `orderLabels.tsx` |
| โฟลเดอร์ | lowercase / kebab-case | `components/common` · `api/cron/expire-orders` |
| Route segment | kebab-case · dynamic `[param]` · group `(name)` | `checkout/success` · `[slug]` · `(dashboard)` |
| Dictionary / i18n file | camelCase ตามหน้า | `dictionaries/en/products.ts` |
| Env var | UPPER_SNAKE_CASE · public ขึ้นต้น `NEXT_PUBLIC_` | `DATABASE_URI` · `NEXT_PUBLIC_APP_URL` |

---

## 15. Code Style

<!-- TODO: AI MUST REVIEW THIS SECTION FOR EACH PROJECT -->
> TODO: Confirm project-specific convention before applying this rule. โครงอ้างอิงไม่มี Prettier — style ยึดตามโค้ดที่มี: double quote · semicolon · trailing comma · indent 2 space · ESLint (`eslint-config-next` core-web-vitals + typescript) ถ้าโปรเจกต์มี Prettier/formatter ให้ใช้ของโปรเจกต์

### หลักการ

- **Readability over cleverness** — เขียนให้คนถัดไปอ่านแล้วเข้าใจในรอบเดียว
- **สั้นและกระชับเมื่อทำได้** — ฟังก์ชันสั้นเขียนเป็น arrow บรรทัดเดียวได้ · JSX สั้นไม่ต้องแตกหลายบรรทัด
- **ไม่ขึ้นบรรทัดใหม่โดยไม่จำเป็น** แต่ **เว้นบรรทัดคั่นขั้นตอน** (ยิง API / เช็คผล / set state) ให้อ่านเป็นจังหวะ
- **early return** แทน if ซ้อน
- **ไม่สร้าง abstraction เพื่อ abstraction** · ไม่สร้าง micro-file · ไม่ over-engineer
- **อย่า refactor โค้ดที่ไม่เกี่ยวกับ task** · อย่าเปลี่ยนชื่อ variable/file/function โดยไม่มีเหตุผล
- เขียนให้ **เข้ากับโค้ดรอบข้าง** — ชื่อ, ความหนาแน่นของคอมเมนต์, idiom

```ts
// ✅ กระชับ อ่านง่าย
export const isObjectIdLike = (value: string): boolean => /^[0-9a-fA-F]{24}$/.test(value);

if (!response.ok) return false;

// ❌ แตกบรรทัดโดยไม่ได้อะไรเพิ่ม
export const isObjectIdLike = (
  value: string,
): boolean => {
  const result = /^[0-9a-fA-F]{24}$/.test(value);
  return result;
};
```

### คอมเมนต์

- อธิบาย **"ทำไม"** ไม่ใช่ "ทำอะไร" — โดยเฉพาะข้อจำกัดที่ไม่ obvious, บั๊กที่เคยเจอ, พฤติกรรมของไลบรารี/API ภายนอกที่ไม่ตรงเอกสาร
- ใช้ JSDoc `/** ... */` เหนือฟังก์ชัน/type/prop ที่ export
- **ห้ามลบคอมเมนต์ที่อธิบาย workaround** แม้โค้ดดู "แปลก" — มักมีเหตุผล
- ภาษาของคอมเมนต์ — TODO: Confirm project-specific convention before applying this rule.

### TODO ในโค้ด

จุดที่ตั้งใจยังไม่ทำ ต้องบอกให้ชัดว่ารออะไร และ **ลบทันทีเมื่อทำเสร็จ** (TODO ที่ล้าสมัยทำให้คนถัดไปเข้าใจผิด)

```ts
// TODO: replace localStorage with backend cart       ← feature ที่ตกลงแล้วว่ายังไม่ทำ
// TODO: placeholder image — replace with final asset  ← รอไฟล์จากลูกค้า/ทีมดีไซน์
```

### Import

```ts
// 1. framework / external
import type { Metadata } from "next";
import { useEffect, useState } from "react";
// 2. internal (alias @/…)
import Container from "@/components/common/Container";
import { apiGet } from "@/lib/api/client";
// 3. relative (ไฟล์ในโฟลเดอร์เดียวกัน)
import { useLoadInitialData } from "./hooks/useLoadInitialData";
// 4. type-only
import type { Post } from "@/types";
```

- ใช้ path alias (`@/…`) แทน `../../..`
- `import type` สำหรับ type ล้วน
- ลำดับไม่ถูกบังคับด้วย lint ในโครงอ้างอิง — TODO: Confirm project-specific convention before applying this rule. อย่าจัดลำดับ import ใหม่ในไฟล์ที่ไม่ได้แก้

### การจัดลำดับภายในไฟล์ component

```
"use client" (ถ้ามี)
imports
constants / helper เล็ก ๆ ระดับโมดูล
export type (ถ้าต้อง export)
export default function Component(props) {
  hooks (state → context → data hook)
  derived values
  handlers (handleXxx)
  early returns (loading / error / empty)
  return JSX
}
```

---

## 16. Reuse Before Create

ก่อนสร้าง **component · hook · utility · service · type · helper · constant** ต้องค้นหาก่อนเสมอ

```bash
# ค้นจากชื่อ/คำสำคัญ
grep -rn "formatDate\|formatPrice" src/lib
grep -rln "export default function .*Card" src/components
# ดู component กลาง
ls src/components/common
# ดู type ที่มีอยู่
grep -n "export type" src/types/*.ts
```

**Decision**

| ผลการค้นหา | ทำอะไร |
|---|---|
| มีตรงทั้งหมด | ใช้ของเดิม |
| มีเกือบตรง | พิจารณาเพิ่ม prop/option ให้ของเดิม (ไม่ทำให้ผู้ใช้เดิมพัง) ก่อนสร้างใหม่ |
| มีแต่ความหมายต่างกันจริง | สร้างใหม่ ตั้งชื่อให้เห็นความต่าง |
| ไม่มี | สร้างใหม่ตาม pattern ในเอกสารนี้ |
| มีหลายตัวที่ทำคล้ายกัน | **ถามผู้ใช้** ว่าจะใช้ตัวไหน อย่าสร้างตัวที่สามเพิ่ม |

**Single source of truth** — ค่าที่ UI, validation, API, และอีเมล/หลังบ้านใช้ร่วมกัน (enum, รายชื่อตัวเลือก, เพดานจำนวน) ให้อยู่ใน `constants/<name>.ts` ที่เดียว แล้วทุกชั้น derive จากไฟล์นั้น

```ts
// constants/postStatuses.ts
export const POST_STATUSES = [
  { key: "draft", label: "Draft" },
  { key: "published", label: "Published" },
] as const;

export type PostStatus = (typeof POST_STATUSES)[number]["key"];
export const POST_STATUS_KEYS = POST_STATUSES.map((s) => s.key) as [PostStatus, ...PostStatus[]];
export const isPostStatus = (value: string): value is PostStatus => (POST_STATUS_KEYS as string[]).includes(value);

// schemas/post.ts → status: z.enum(POST_STATUS_KEYS)
// UI → POST_STATUSES.map(...)
```

---

## 17. When to Create a New File

**ควรสร้างไฟล์ใหม่เมื่อ**

- logic/JSX ใหญ่จนไฟล์เดิมอ่านยาก **และ** มีขอบเขตหน้าที่ชัดเจนแยกได้
- มีการ reuse ≥ 2 ที่ (หรือกำลังจะเกิดในงานนี้)
- ต้องแยก Server / Client boundary
- ต้องแยก `server-only` ออกจากโค้ดที่ client import ได้
- architecture กำหนด (`page.tsx` · `<Name>Client.tsx` · `hooks/useLoadInitialData.ts` · `route.ts` · schema ต่อ entity)
- เป็น integration ภายนอกใหม่ (email, payment, storage) → `lib/<integration>/`

**ไม่ต้องสร้างเมื่อ**

- โค้ดสั้นมากและใช้ครั้งเดียว
- abstraction ไม่ได้ช่วยให้อ่านง่ายขึ้น
- แค่อยากแยก type ที่ใช้ในไฟล์เดียว
- หน้าไม่โหลดข้อมูล → **ไม่สร้าง `<Name>Client.tsx`**
- ไม่มีเหตุผลอื่นนอกจาก "ให้โครงสร้างดูครบ" (เช่น `index.ts` re-export ที่ไม่มีใครใช้, `not-found.tsx` ที่ไม่มีทาง render)

---

## 18. Workflow: แก้บั๊ก / Refactor

### แก้บั๊ก

1. **reproduce ให้ได้ก่อน** — ขั้นตอน, input, ผลที่ได้ vs ผลที่ควรได้
2. **หา root cause** — อ่านโค้ดทั้งเส้นทาง (UI → hook → API → DB) อย่าแก้แค่อาการ
3. **แก้ให้แคบที่สุด** ที่ root cause · ไม่ refactor รอบ ๆ ไปด้วย
4. **เช็คจุดอื่นที่ใช้ pattern เดียวกัน** — บั๊กแบบเดียวกันมักซ้ำหลายไฟล์ (บอกผู้ใช้ก่อนแก้ถ้าอยู่นอก scope)
5. เขียนคอมเมนต์สั้น ๆ ถ้าการแก้ไม่ obvious (ทำไมต้องทำแบบนี้)
6. verify ตาม [ข้อ 19](#19-testing--verification) + ทดสอบเคสเดิมซ้ำ
7. ถ้าบั๊กเกิดจากกฎที่ไม่ obvious (พฤติกรรมไลบรารี, race condition) → บันทึกในเอกสารโปรเจกต์

### Refactor

1. **ต้องมีเหตุผลชัดเจน** และได้รับอนุญาต ถ้าเกิน scope ของ task
2. **พฤติกรรมต้องเหมือนเดิม** — API contract, ชื่อ field ฟอร์ม, URL, shape ของ response ห้ามเปลี่ยนโดยไม่ตั้งใจ
3. ทำทีละขั้นเล็ก ๆ และ verify ทุกขั้น
4. แยก commit refactor ออกจาก commit feature/bugfix
5. ย้าย/เปลี่ยนชื่อ → ค้นหาทุก import ให้ครบ (`grep -rn "OldName" src`)
6. อัปเดตเอกสารที่อ้างถึงชื่อ/ตำแหน่งเดิม

---

## 19. Testing / Verification

<!-- TODO: AI MUST REVIEW THIS SECTION FOR EACH PROJECT -->
> TODO: Confirm project-specific convention before applying this rule. **ใช้เฉพาะคำสั่งที่มีจริงใน `package.json`** ห้ามสมมติ — เปิด `scripts` ดูก่อนทุกครั้ง

คำสั่งที่พบในโปรเจกต์อ้างอิง (ตรวจของโปรเจกต์ปัจจุบันก่อนใช้):

```bash
npm run lint        # ESLint (script "lint": "eslint")
npx tsc --noEmit    # type check (tsconfig มี noEmit อยู่แล้ว)
npm run build       # type check + build production — ด่านสุดท้ายที่เชื่อถือได้
```

- ถ้ามี `test` script → `npm test` · ถ้าไม่มี test framework **อย่าติดตั้งเพิ่มเองโดยไม่ถาม**
- script ตรวจ integration (เช็ค DB, storage, email) ถ้ามี ให้รันเมื่อแตะส่วนนั้น
- โปรเจกต์อ้างอิงไม่มี automated test → verification = lint + type + build + ทดสอบในเบราว์เซอร์จริง

### Checklist หลังแก้โค้ด

- [ ] lint ผ่าน (ไม่มี warning ใหม่จากโค้ดที่แก้)
- [ ] type check ผ่าน
- [ ] build ผ่าน
- [ ] เปิดหน้าจริงในเบราว์เซอร์ — ข้อมูลที่โหลดฝั่ง client **`curl` จะเห็นแค่ skeleton** ต้องรอให้โหลดเสร็จในเบราว์เซอร์
- [ ] เช็ค responsive: มือถือ (~390px) · เดสก์ท็อป (~1440px) · จอกว้าง (~2560px)
- [ ] เช็คทุกสถานะ: loading · error (ปิด API/เน็ต) · empty · not found
- [ ] mutation: ทดสอบทั้งกรณีสำเร็จ, validation ไม่ผ่าน, ไม่ได้ login
- [ ] ถ้ามีหลายภาษา: เช็คทุกภาษา
- [ ] รายงานผลตามจริง — ไม่ผ่านต้องแนบ output

> หมายเหตุ: headless Chrome บางแพลตฟอร์มบังคับ viewport ขั้นต่ำ (~500px) — ต้องการ 390px จริงให้ใช้ device emulation (CDP `Emulation.setDeviceMetricsOverride`)

---

## 20. Environment Variables

- **`.env.example`** — รายชื่อ env ทั้งหมดที่ต้องมี **ไม่มีค่าจริง** · commit ได้ · เพิ่ม env ใหม่ต้องเพิ่มที่นี่ทุกครั้ง
- **`.env.local`** — ค่าจริงของเครื่อง dev · **ห้าม commit** (`.gitignore` ต้องมี `.env*` และ `!.env.example`)
- production ตั้งที่แพลตฟอร์ม deploy (TODO: ระบุแพลตฟอร์มของโปรเจกต์)

### Public vs private

| ประเภท | รูปแบบ (Next.js) | เห็นที่ไหน |
|---|---|---|
| Private (secret, key, credential, connection string) | `DATABASE_URI`, `AUTH_SECRET`, `*_API_KEY` | server เท่านั้น |
| Public (URL ของแอป, key ที่ออกแบบให้เปิดเผย) | `NEXT_PUBLIC_*` | ถูกฝังใน bundle ของ browser |

### กฎ

- **ห้าม hardcode secret** ในโค้ด · **ห้าม commit secret** · **ห้ามใส่ค่าจริงในเอกสาร**
- **service role key / admin key ห้ามอยู่ใน `NEXT_PUBLIC_*`** เด็ดขาด
- **อ่าน env ตอนเรียกใช้ ไม่ใช่ตอน import** — build step ไม่ได้มี env ครบเสมอ
- env ที่จำเป็นแต่ไม่มี → throw error ที่บอกชื่อตัวแปรและชี้ไป `.env.example`
- env ของ integration ที่ไม่บังคับ (เช่น email) → ไม่มี = ข้ามการทำงานนั้นอย่างปลอดภัย + log
- URL ของแอป (canonical, sitemap, callback) อ่านจาก env ตัวเดียว (เช่น `NEXT_PUBLIC_APP_URL`) — ไม่ hardcode กระจายหลายไฟล์
- ไฟล์ที่ใช้ secret ให้ `import "server-only"` กันหลุดเข้า client bundle

---

## 21. Security

| หัวข้อ | กฎ |
|---|---|
| **Secret** | อยู่ใน env ฝั่ง server เท่านั้น · ไม่ log · ไม่ส่งกลับ client · ไม่อยู่ใน `NEXT_PUBLIC_*` |
| **Server-side validation** | ทุก input ผ่าน schema ที่ route handler · ห้ามเชื่อ client |
| **Authentication** | เช็คที่ route handler ทุก mutation (proxy เป็นแค่ด่านแรก) |
| **Authorization** | อ่าน role จาก session ที่เซ็นแล้ว · serializer แยก public/admin · ข้อมูลภายในไม่หลุด public API |
| **ค่าที่มีผลทางเงิน/สิทธิ์** | คำนวณจาก DB ฝั่ง server เท่านั้น — client ไม่มีช่องให้ส่งราคา/ยอด/role |
| **NoSQL / SQL injection** | ใช้ query แบบ parameterized/driver API · `escapeRegex()` ก่อนสร้าง RegExp จาก input · validate id ก่อน `new ObjectId()` · ห้ามส่ง object จาก client เป็น filter ตรง ๆ |
| **XSS** | ปล่อยให้ React escape · หลีกเลี่ยง `dangerouslySetInnerHTML` (ยกเว้น JSON-LD ที่ประกอบเองจากข้อมูลที่เชื่อถือได้) · HTML อีเมลต้อง escape ทุกค่า · rich text เก็บเป็น block ที่มีโครง ไม่เก็บ HTML ดิบ |
| **File upload** | ตรวจ MIME type + ขนาดฝั่ง server · whitelist ชนิด (ไม่รับ `.svg` เพราะฝัง script ได้) · sanitize ชื่อไฟล์/พาธ (`replace(/[^a-zA-Z0-9_-]/g, "")`) · เก็บ URL ใน DB ไม่เก็บไฟล์ |
| **Webhook / callback** | ตรวจ signature/checksum · ยืนยันกับผู้ให้บริการแบบ server-to-server · เทียบยอด/สกุลเงินกับ DB · idempotent · **redirect ของผู้ใช้กลับมา ≠ หลักฐานความสำเร็จ** |
| **API abuse** | clamp `limit`/`page` · ใส่ `.max()` ใน schema · cron endpoint ต้องมี secret (`Authorization: Bearer`) · ป้องกันการสร้างซ้ำพร้อมกันด้วย lock/เงื่อนไข atomic |
| **Open redirect** | redirect ไปเฉพาะ path ภายในที่ตรวจแล้ว |
| **Sensitive logs** | log ได้แค่ id / เลขอ้างอิง / รหัสผลลัพธ์ · ห้าม log password, token, API key, ข้อมูลบัตร, body ของคำขอที่มีข้อมูลส่วนบุคคล |
| **Timing attack** | เทียบ credential แบบ constant time |
| **Cookie** | `HttpOnly` · `SameSite=Lax` · `Secure` ใน production |

---

## 22. SEO

> ใช้เมื่อเป็น public web project เท่านั้น · **อย่าเพิ่ม SEO implementation ถ้าโปรเจกต์ไม่ต้องการ** (เช่น dashboard ภายใน → แค่ `noindex`)

### แพทเทิร์น

- helper กลางใน `lib/seo.ts`: `buildSocialMeta()` · `localeAlternates()` (ถ้ามีหลายภาษา) · `PUBLIC_ROBOTS` / `PRIVATE_ROBOTS` · `getSiteUrl()` · JSON-LD builder
- ทุกหน้า public เรียก helper แทนการเขียน `openGraph: {...}` เอง — Next.js **ไม่ deep-merge** `openGraph` ของหน้าลูกกับ layout (หน้าลูกกำหนดเอง = แทนทั้งก้อน `siteName`/`images` หายเงียบ ๆ)

```ts
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await findPostBySlug(slug);
  if (!post) return { title: "Not found | Site Name", robots: PRIVATE_ROBOTS };

  const title = `${post.title} | Site Name`;
  const description = post.excerpt;

  return {
    title,
    description,
    robots: PUBLIC_ROBOTS,
    alternates: { canonical: `/posts/${slug}` },
    ...buildSocialMeta({ title, description, path: `/posts/${slug}`, image: { url: post.image, alt: post.title } }),
  };
}
```

### กฎ

- **title + description unique ทุกหน้า** และแปลตามภาษา
- canonical ทุกหน้า · หลายภาษาใส่ hreflang + `x-default`
- `metadataBase` ที่ root layout จาก `getSiteUrl()` (env) — production ต้องตั้งโดเมนจริง
- `robots.ts` / `sitemap.ts` ใช้ file convention ของ framework · sitemap ดึง URL dynamic จาก DB และมี fallback ถ้า DB ล่ม
- หน้าเฉพาะบุคคล (checkout, ผลการชำระเงิน, บัญชี) ใช้ `noindex` meta — **ไม่ใช่** `disallow` ใน robots.txt (ยกเว้นหลังบ้าน)
- รูป OG ใช้รูปจริงของเนื้อหาหน้านั้น · ไม่ใช้ `.svg`
- **JSON-LD ใส่เฉพาะข้อมูลจริง** — ห้ามใส่ rating/review/ที่อยู่/ผู้เขียนปลอม · breadcrumb schema ใส่เฉพาะหน้าที่มี breadcrumb ให้เห็นจริง
- semantic HTML: **`<h1>` เดียวต่อหน้า** · heading ไล่ลำดับ · `<main>` `<nav>` `<section>` `<article>` · `alt` ทุกรูป (รูปตกแต่ง `alt=""`)
- ไม่ใส่ `meta keywords` — ไม่ใช่สัญญาณที่ search engine ใช้แล้ว

---

## 23. Performance

**ไม่ optimize ก่อนพบปัญหาจริง** — แต่หลีกเลี่ยงของที่รู้อยู่แล้วว่าแพง

- **รูปภาพ**: ใช้ `next/image` เสมอ · `sizes` ตรงกับความกว้างจริงทุก breakpoint · `priority` เฉพาะรูป above-the-fold (hero/LCP) · ย่อไฟล์ต้นฉบับก่อนวางใน `public/` (ไม่วางไฟล์ RAW หลาย MB) · ให้ optimizer แปลง AVIF/WebP แทนการแปลงไฟล์เอง
- **Client component**: ใส่ `"use client"` ให้แคบที่สุด — ส่วนใหญ่ของหน้าควรเป็น Server Component
- **Bundle size**: ไลบรารีก้อนใหญ่ lazy-load ด้วย `dynamic()` · เพิ่ม dependency ใหม่ต้องมีเหตุผล (และถามก่อน)
- **API calls**: หน้าหนึ่งยิง endpoint เดียวกันครั้งเดียว (hook ที่ Client wrapper เดียว) · ยิงหลายตัวพร้อมกันด้วย `Promise.all` · debounce ช่องค้นหา (~400ms) · กันคำตอบเก่าทับใหม่
- **Pagination**: list ที่โตได้ไม่จำกัดต้องแบ่งหน้าฝั่ง server (`page`/`limit`/`total`) · `limit` มีเพดาน
- **Database**: สร้าง index ให้ field ที่ query/sort บ่อย · `find` + `countDocuments` ขนานกัน · cache connection บน `globalThis`
- **Re-render**: ไม่เก็บ derived state · `useMemo`/`useCallback` เมื่อวัดแล้วหรือเป็น context value ที่ส่งให้ลูกเยอะ
- **Caching**: รูปที่เปลี่ยนชื่อเมื่อเปลี่ยนเนื้อหา → cache ยาวได้ · route ที่อ่าน DB ตอน request ใส่ `dynamic = "force-dynamic"`
- **แอนิเมชัน**: ห้ามหน่วงเนื้อหา LCP · ใช้ CSS สำหรับ hover ธรรมดา

---

## 24. Git

<!-- TODO: AI MUST REVIEW THIS SECTION FOR EACH PROJECT -->
> TODO: Confirm project-specific convention before applying this rule. branch หลัก / branch ทำงาน / รูปแบบ commit message ของทีม

- **commit หรือ push เฉพาะเมื่อผู้ใช้สั่ง** · ถ้าอยู่บน branch หลักให้แตก branch ก่อน
- **commit เล็กและมีความหมาย** — หนึ่ง commit หนึ่งเรื่อง
- **ไม่รวม unrelated changes** — refactor/format แยก commit จาก feature/fix
- **ตรวจ `git diff` ก่อน commit ทุกครั้ง** — ดูว่าไม่มีไฟล์ที่ไม่ตั้งใจ, debug log, หรือ secret
- **ห้าม commit secret** (`.env.local`, key, credential) — ถ้าเผลอ commit ไปแล้วต้องแจ้งผู้ใช้ให้ rotate key (ลบใน commit ถัดไปไม่พอ)
- **commit message อ่านแล้วรู้ว่าทำอะไร** — รูปแบบ `type: summary` (`feat:` · `fix:` · `refactor:` · `update:` · `docs:`) ตามที่ทีมใช้
- ไฟล์ที่ framework generate ใหม่เอง (เช่น block ใน AGENTS.md ที่ `next dev` เขียน) — commit ไปพร้อมงานเพื่อให้ tree สะอาด ไม่ต้องไล่ลบ
- ห้าม `--force` push, rewrite history, หรือลบ branch โดยไม่ได้รับอนุญาต

---

## 25. Internationalization (optional)

> ใช้เมื่อโปรเจกต์มีหลายภาษาเท่านั้น — TODO: Confirm project-specific convention before applying this rule.

แพทเทิร์นอ้างอิง (ไม่ใช้ไลบรารี i18n):

```
i18n/
├── config.ts          ← locales · defaultLocale · isLocale()
├── index.ts           ← t() · getDictionary() · re-export
└── dictionaries/
    ├── <ref-lang>/    ← ภาษาอ้างอิง = shape หลัก
    │   ├── common.ts · <page>.ts … · index.ts
    └── <other-lang>/  ← โครงเดียวกัน ผูก type กับภาษาอ้างอิง
```

```ts
// dictionaries/en/posts.ts — ผูก type กับภาษาอ้างอิง ลืมแปลแล้ว TypeScript ฟ้องตอน build
import type { posts as refPosts } from "../th/posts";
export const posts: typeof refPosts = { title: "Posts", empty: "No posts yet" };
```

- **ข้อความ UI** → dictionary · **ข้อมูล entity** จาก DB → `{ th, en }` แล้วดึงด้วย `t(value, locale)`
- ข้อความที่ใช้หลายหน้า → `common.ts` ไม่ก็อปไปทุก dictionary
- **ห้ามเขียน `locale === "th" ? ... : ...` กระจายในคอมโพเนนต์** (ยกเว้น title/description ใน `generateMetadata` ที่สั้นมาก)
- สลับภาษาให้แทนเฉพาะส่วน locale ใน path (`/th/about` → `/en/about`) ไม่เด้งกลับหน้าแรก
- วันที่/ตัวเลข format ตามภาษาด้วย `Intl` และ **ตรึง timeZone** กัน hydration mismatch ระหว่าง server/client

---

## 26. Documentation Upkeep

- **อัปเดต AGENTS.md และ README ทุกครั้งที่งานเสร็จ** เมื่อ: เพิ่มไฟล์/โฟลเดอร์ใหม่ · เปลี่ยนโครงสร้าง · เพิ่ม token · เพิ่มหน้า/endpoint · เพิ่ม env · ตกลงอะไรกับลูกค้า/ทีม
- บันทึก **"ทำไม"** ของการตัดสินใจที่ไม่ obvious (เช่น เลือกไลบรารี fork, workaround ของ framework) เพื่อไม่ให้คนถัดไปย้อนกลับ
- ตาราง endpoint ในเอกสารต้องตรงกับ route handler จริง (method · path · auth · payload · สถานะ)
- ลบ/แก้ข้อความที่ล้าสมัยทันที — เอกสารผิดแย่กว่าไม่มีเอกสาร
- ข้อมูลที่ยังรอจากลูกค้า/ทีม ให้มีรายการ TODO แยกชัดเจน

---

## 27. Project-Specific Checklist (ต้องเติมทุกโปรเจกต์)

> โปรเจกต์นี้คือ **Vite + React SPA** ไม่ใช่ Next.js — ส่วนของเอกสารนี้ที่ผูกกับ Next.js โดยเฉพาะ
> (Server/Client Component split, `page.tsx`/`<Name>Client.tsx`, route handler, `generateMetadata`,
> proxy/middleware auth, `server-only`, `next/image`) **ไม่ใช้กับโปรเจกต์นี้** — ดูคอลัมน์ "ค่าของโปรเจกต์นี้"
> ด้านล่างสำหรับของจริงที่ใช้แทน

| หัวข้อ | ค่าของโปรเจกต์นี้ | ที่มา (ไฟล์ที่ตรวจ) |
|---|---|---|
| Framework + version | Vite 6 + React 18 (SPA, ไม่มี SSR) | `package.json` |
| ความต่างจาก framework รุ่นเก่าที่ต้องระวัง | ไม่มี App Router/route handler — ไม่มีแนวคิด Server Component | `package.json` |
| Routing | `react-router-dom` v7 `createBrowserRouter` ที่ `src/router/index.tsx` — ไม่มี route group/segment พิเศษ | `src/router/index.tsx` |
| Root layout | `src/components/layout/MainLayout.tsx` — **ครอบที่ router** (`router/index.tsx` ห่อ `element` ของแต่ละ route ด้วย `<MainLayout>`) ไม่ใช่ page component เรียกครอบตัวเอง — ไม่มี root layout กลางแบบ Next.js layout.tsx | `src/router/index.tsx` |
| Data fetching | client hook เท่านั้น (ไม่มี RSC/Server Actions/React Query) | `src/pages/<route>/hooks/` |
| ตำแหน่ง hook โหลดข้อมูล | `src/pages/<route>/hooks/useLoadInitialData.ts` — **เฉพาะการโหลดข้อมูลตั้งต้นของหน้าเท่านั้น** (เช่น dropdown ตัวเลือก, ข้อมูลโชว์ตอนเปิดหน้าแรก) ห้ามใส่ mutation handler (generate/confirm/save) หรือ UI state (selection, editingRow) — พวกนั้นอยู่ใน `pages/<route>/index.tsx` โดยตรง เพื่อให้อ่านง่าย ไม่มีชั้นซ้อนเกินจำเป็น | `src/pages/leads/hooks/useLoadInitialData.ts`, `src/pages/leads/index.tsx` |
| API architecture | ไม่มี API ในตัว (ไม่มี `app/api/`) — เรียก backend แยก (ดู `backend/README.md`/`backend/CLAUDE.md`) ผ่าน service object ต่อ entity ใน `src/services/<Entity>Service.ts` (เช่น `LeadService.generate()`, `LeadService.confirm()`) | `src/services/` |
| Response envelope | ฝั่ง client เท่านั้น (backend กำหนด shape ของตัวเอง) — `AxiosUtil.createRequest<T>()` ใน `src/services/axios.ts` ครอบทุก call แล้วคืน `ApiResult<T>` = `{ ok: true; data: T } \| { ok: false; message: string }` เสมอ ไม่ throw · type อยู่ที่ `src/types/api.types.ts` | `src/services/axios.ts` |
| Database + driver/ORM | ไม่มี (อยู่ฝั่ง backend) | — |
| Validation library | ไม่มี (ไม่มี local API route ให้ validate) — ฟอร์มใช้ antd `Form` rules เป็น client-side UX check เท่านั้น ข้อมูลจริง validate ที่ backend | `src/pages/leads/SearchForm.tsx` |
| Authentication | ไม่มีระบบ login ในโปรเจกต์นี้ ณ ตอนนี้ | — |
| Authorization | ไม่มี | — |
| State management | React ล้วน — local state (`useState`) + page hook (`useLoadInitialData`) ต่อหน้า ไม่มี global state library | `src/pages/<route>/hooks/` |
| Styling system | ไม่มี Tailwind — ใช้ antd component + inline `style` เป็นหลัก ไม่มีไฟล์ design token กลาง | `src/index.css`, antd |
| UI library | antd v5 (ทั้งแอปเป็น "หลังบ้าน/เครื่องมือภายใน" จึงไม่ต้อง lazy-load แยกตาม public/admin) | `package.json` |
| Form library | antd `Form` | `src/pages/leads/SearchForm.tsx` |
| i18n | ไม่มี — ข้อความ UI เป็นภาษาไทย hardcode ในคอมโพเนนต์ | — |
| Storage ไฟล์/รูป | ไม่มี | — |
| Integration ภายนอก | ไม่มีในฝั่ง frontend (อยู่ฝั่ง backend) | — |
| Testing framework | ไม่มี | `package.json` |
| คำสั่ง verify ที่มีจริง | `npx tsc -b` (type check) · `npm run build` (type check + vite build) — **ไม่มี** `lint`/`test` script | `package.json` scripts |
| Formatter | ไม่มี Prettier config | — |
| ภาษาของคอมเมนต์ / ข้อความ error / commit | ไทย | โค้ดที่มีอยู่ |
| Export style ของ component | `export default function ComponentName(...)` | โค้ดที่มีอยู่ |
| Deployment platform + cron | TODO — ยังไม่ระบุ | — |
| Env vars ที่ต้องมี | `VITE_API_URL` | `.env.example` |
| Branch หลัก · branch ทำงาน · รูปแบบ commit | main / develop · `type: summary` (`feat:`, `fix:`, `update:`) | `git log` |
| ข้อยกเว้นจากกฎในเอกสารนี้ (พร้อมเหตุผล) | โครงสร้างด้านบน (ข้อ 2–13) เขียนไว้สำหรับ Next.js App Router — โปรเจกต์นี้ map เป็น React SPA ตามตารางนี้แทนทั้งหมด: ไม่มี `page.tsx`/`<Name>Client.tsx` split (ไม่มี Server Component ให้แยกจาก), ไม่มี `lib/db`/`schemas`/`lib/auth`, ไม่มี SEO metadata (internal tool) · **ต่างจากข้อ 2 ("หน้าเดียวและผูกกับ route นั้นเท่านั้น → colocate ข้าง page")**: โปรเจกต์นี้ให้ section component ของหน้าไปอยู่ `components/<feature>/` เสมอแม้ใช้แค่หน้าเดียว — `pages/<route>/` มีแค่ `index.tsx` + `hooks/useLoadInitialData.ts` (ตกลงกับผู้ใช้เมื่อ 2026-09-22) · **ต่างจากข้อ 5 (โครงมาตรฐาน `useLoadInitialData`)**: ในโปรเจกต์นี้ hook นี้โหลด "ข้อมูลตั้งต้นของหน้า" อย่างเดียวจริง ๆ — mutation handler (`handleGenerate`/`handleConfirm`/`handleSaveEdit`) และ state ที่เกี่ยวข้องทั้งหมดอยู่ใน `pages/<route>/index.tsx` โดยตรง ไม่ยกไปไว้ใน hook เพื่อลดชั้นซ้อนที่ไม่จำเป็น · **ต่างจากข้อ 6 (API/Service layer แบบ Next.js route handler)**: เรียก backend แยกผ่าน `services/axios.ts` (`AxiosUtil.createRequest<T>()` คืน `ApiResult<T>` เสมอ ไม่ throw) + service object ต่อ entity เช่น `services/LeadService.ts` (`LeadService.generate()`, `.confirm()`, `.getModels()`) แทน `lib/api/client.ts`/route handler แบบ Next.js · **root layout ครอบที่ `router/index.tsx`** (`<MainLayout><LeadsPage /></MainLayout>` ต่อ route) ไม่ใช่ page component ครอบตัวเอง — ทั้งหมดตกลงกับผู้ใช้เมื่อ 2026-09-22 ตามตัวอย่างมาตรฐานโปรเจกต์อื่นของผู้ใช้ (ProductPage/ProductService/GlobalLayout) | บทสนทนากับผู้ใช้ |

### โครงสร้างจริงของโปรเจกต์นี้ (React SPA)

```
src/
├── router/index.tsx              ← createBrowserRouter ทั้งหมดของแอป
│                                    ครอบแต่ละ route ด้วย <MainLayout> ตรงนี้ที่เดียว
│                                    (ไม่ใช่ page component เรียกครอบตัวเอง)
├── pages/<route>/
│   ├── index.tsx                 ← ไฟล์เดียวของหน้า: ประกอบ section + เก็บ mutation
│   │                                state/handler ทั้งหมดของหน้านี้ (generate/confirm/save ฯลฯ)
│   │                                (component ภายในตั้งชื่อ <Name>Page เช่น LeadsPage)
│   └── hooks/useLoadInitialData.ts  ← โหลดข้อมูลตั้งต้นของหน้าอย่างเดียว ไม่มี handler อื่น
├── components/
│   ├── common/                   ← (ยังไม่มีไฟล์ในนี้ ณ ตอนนี้) UI กลางที่ใช้ ≥ 2 หน้า
│   ├── layout/MainLayout.tsx     ← layout ของแอป
│   └── <feature>/                ← section/card/form ของ entity นั้น ๆ (เช่น components/leads/)
│                                    — วางที่นี่แม้ใช้แค่หน้าเดียว ไม่ colocate ใน pages/<route>/
│                                    (ตกลงกับผู้ใช้: pages/<route>/ มีแค่ index.tsx + hooks/)
├── services/
│   ├── axios.ts                  ← axios instance + AxiosUtil.createRequest<T>() กลาง
│   └── <Entity>Service.ts        ← object รวมฟังก์ชันเรียก API ต่อ entity (PascalCase ตรงกับชื่อ
│                                    object ที่ export เช่น LeadService) คืน Promise<ApiResult<T>>
├── types/
│   ├── api.types.ts              ← ApiResult<T>
│   └── <entity>.types.ts
├── constants/                    ← ตัวเลือก static (industries, provinces, leadCount)
└── utils/                        ← helper ที่ไม่ใช่ UI (เช่น apiError.ts → toFriendlyErrorMessage)
```

---

## Final Checklist สำหรับ AI ก่อนส่งงาน

- [ ] อ่านโค้ดจริงที่เกี่ยวข้องแล้ว ไม่ได้เดาจากชื่อไฟล์
- [ ] ใช้ pattern ที่มีอยู่ · reuse ก่อนสร้างใหม่
- [ ] ไม่สร้างไฟล์/abstraction ที่ไม่จำเป็น · ไม่ over-engineer
- [ ] ไม่แก้ไฟล์หรือเปลี่ยนชื่อสิ่งที่ไม่เกี่ยวกับ task
- [ ] server validate + auth ครบทุก mutation
- [ ] ไม่มี secret/credential ในโค้ด เอกสาร หรือ log
- [ ] loading · error · empty · not found ครบ
- [ ] lint · type · build ผ่าน (ใช้คำสั่งที่มีจริง) และรายงานผลตามจริง
- [ ] อัปเดตเอกสารโปรเจกต์แล้ว
- [ ] เรื่องที่ไม่แน่ใจ → ถามผู้ใช้แล้ว ไม่ได้เดา