import axios from "axios";
import { env } from "../config/env.js";
import { classifySource } from "../utils/url.utils.js";
import type { PlacePage, PlaceResult, SearchPage, SearchResult } from "../types/search.type.js";

interface SerperItem {
  title: string;
  link: string;
  snippet: string;
}

/** จำนวนผลลัพธ์ต่อ 1 query ของ Serper — หน้า 2 = อันดับ 11-20 */
const resultsPerPage = 10;

/**
 * ค้นหา 1 หน้าจาก Serper แล้วกรองเหลือเฉพาะเว็บบริษัท
 * `page` เริ่มที่ 1 — `lead.service.ts` ใช้ไล่หน้าถัดไปเมื่อผลหน้าแรกได้ lead ไม่ครบ `limit`
 */
export async function searchWeb(keyword: string, location?: string, page = 1): Promise<SearchPage> {
  const query = location ? `${keyword} ${location}` : keyword;

  const { data } = await axios.post(
    "https://google.serper.dev/search",
    { q: query, num: resultsPerPage, page },
    {
      headers: {
        "X-API-KEY": env.serperApiKey,
        "Content-Type": "application/json"
      }
    }
  );

  const items: SerperItem[] = data.organic ?? [];

  // จัดประเภทแทนการทิ้ง — ผู้เรียกตัดสินเองว่าจะใช้หน้าไหนเป็นอะไร
  const results: SearchResult[] = items.map((item) => ({
    title: item.title,
    url: item.link,
    snippet: item.snippet,
    sourceType: classifySource(item.link)
  }));

  return { results, hasMore: items.length > 0 };
}

interface SerperPlace {
  title: string;
  address?: string;
  phoneNumber?: string;
  website?: string;
  /** หมวดธุรกิจจาก Google เช่น "โรงเรียนมัธยมศึกษา" */
  type?: string;
  cid?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * ค้นธุรกิจจริงจาก Google Places (ผ่าน Serper) — **แหล่งเดียวของ "ตัวธุรกิจ" ในระบบ**
 *
 * ต่างจาก `searchWeb()` ตรงที่ได้ชื่อกิจการ ที่อยู่ เบอร์ และเว็บทางการ มาจากข้อมูลธุรกิจจริง
 * ไม่ใช่ title/snippet ของหน้าเว็บ — ข่าว กระทู้ และ Wikipedia จึงไม่มีทางกลายเป็น lead
 * และที่อยู่ที่ได้เอาไปตรวจจังหวัดได้แบบ deterministic โดยไม่ต้องให้ AI เดา
 *
 * ตรึง gl/hl เป็น th เพราะระบบนี้ใช้กับตลาดไทย และการตรวจจังหวัดอิงชื่อจังหวัดไทย
 *
 * **ใช้ `/maps` ไม่ใช่ `/places`** — `/places` คืนที่อยู่แบบตัดท้าย ("548 หมู่ 12 ถ. มิตรภาพ")
 * ไม่มีชื่อจังหวัด ทำให้ `verifyLocation()` ตอบ unknown ทั้งที่ธุรกิจอยู่ในจังหวัดที่ขอจริง
 * (ทดสอบ "สำนักงานใหญ่ ขอนแก่น": /places ได้ unknown 10/10 · /maps ได้ verified 20/20)
 * `/maps` ยังให้ 20 รายต่อหน้าแทน 10 ด้วย
 *
 * ขอหน้า 2 ขึ้นไปต้องส่ง `cursor` (พิกัด) ที่ได้จากหน้าก่อนหน้ามาด้วย ไม่งั้น Serper ตอบ 400
 */
export async function searchPlaces(
  keyword: string,
  location?: string,
  page = 1,
  cursor?: string | null
): Promise<PlacePage> {
  const query = location ? `${keyword} ${location}` : keyword;

  const { data } = await axios.post(
    "https://google.serper.dev/maps",
    { q: query, gl: "th", hl: "th", page, ...(cursor ? { ll: cursor } : {}) },
    {
      headers: {
        "X-API-KEY": env.serperApiKey,
        "Content-Type": "application/json"
      }
    }
  );

  const items: SerperPlace[] = data.places ?? [];

  const places: PlaceResult[] = items.map((item) => ({
    cid: item.cid ?? null,
    title: item.title,
    address: item.address ?? null,
    phone: item.phoneNumber ?? null,
    website: item.website ?? null,
    category: item.type ?? null
  }));

  // Serper คืนพิกัดที่มันใช้ค้นมาให้ในฟิลด์ `ll` อยู่แล้ว ใช้ค่านั้นก่อน ค่อย fallback ไปคำนวณเอง
  const next: string | null = data.ll ?? cursor ?? centerOf(items);

  // ไม่มีพิกัดให้ส่งต่อ = ขอหน้าถัดไปไม่ได้ ต่อให้หน้านี้ยังมีผลอยู่
  return { places, hasMore: items.length > 0 && next !== null, cursor: next };
}

/** จุดกึ่งกลางของผลในหน้านี้ ในรูปแบบ `@lat,lng,zoom` ที่ Google Maps ใช้ระบุพื้นที่ค้นหา */
function centerOf(items: SerperPlace[]) {
  const points = items.filter(
    (item): item is SerperPlace & { latitude: number; longitude: number } =>
      typeof item.latitude === "number" && typeof item.longitude === "number"
  );

  if (points.length === 0) return null;

  const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
  const latitude = average(points.map((point) => point.latitude));
  const longitude = average(points.map((point) => point.longitude));

  // 12z = ระดับเมือง กว้างพอให้เจอธุรกิจเพิ่มแต่ไม่หลุดออกนอกพื้นที่ที่ผู้ใช้ขอ
  return `@${latitude.toFixed(6)},${longitude.toFixed(6)},12z`;
}
