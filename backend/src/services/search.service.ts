import axios from "axios";
import { env } from "../config/env.js";
import { isBusinessWebsite } from "../utils/url.utils.js";
import type { SearchResult } from "../types/search.type.js";

interface SerperItem {
  title: string;
  link: string;
  snippet: string;
}

export async function searchWeb(keyword: string, location?: string): Promise<SearchResult[]> {
  const query = location ? `${keyword} ${location}` : keyword;

  const { data } = await axios.post(
    "https://google.serper.dev/search",
    { q: query, num: 10 },
    {
      headers: {
        "X-API-KEY": env.serperApiKey,
        "Content-Type": "application/json"
      }
    }
  );

  const items: SerperItem[] = data.organic ?? [];

  return items
    .filter((item) => isBusinessWebsite(item.link))
    .map((item) => ({
      title: item.title,
      url: item.link,
      snippet: item.snippet
    }));
}
