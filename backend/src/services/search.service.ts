import axios from "axios";
import { env } from "../config/env.js";
import { isBusinessWebsite } from "../utils/url.utils.js";
import type { SearchPage, SearchResult } from "../types/search.type.js";

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

  const results: SearchResult[] = items
    .filter((item) => isBusinessWebsite(item.link))
    .map((item) => ({
      title: item.title,
      url: item.link,
      snippet: item.snippet
    }));

  return { results, hasMore: items.length > 0 };
}
