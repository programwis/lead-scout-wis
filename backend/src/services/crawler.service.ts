import { chromium, type Browser } from "playwright";
import { getDomain } from "../utils/url.utils.js";
import type { CrawlResult } from "../types/crawler.type.js";

const contactHints = ["contact", "about", "ติดต่อ", "เกี่ยวกับ"];

/** Crawl a single page. */
export async function crawlWebsite(url: string): Promise<CrawlResult> {
  const browser = await chromium.launch({ headless: true });

  try {
    return await crawlPage(browser, url);
  } finally {
    await browser.close();
  }
}

/** Crawl the homepage plus the contact/about pages it links to. */
export async function crawlSite(url: string, maxPages = 3): Promise<CrawlResult[]> {
  const browser = await chromium.launch({ headless: true });

  try {
    const home = await crawlPage(browser, url);
    const pages = [home];

    for (const link of findContactLinks(home).slice(0, maxPages - 1)) {
      try {
        pages.push(await crawlPage(browser, link));
      } catch {
        // A broken contact page should not fail the whole crawl.
      }
    }

    return pages;
  } finally {
    await browser.close();
  }
}

async function crawlPage(browser: Browser, url: string): Promise<CrawlResult> {
  const page = await browser.newPage({
    userAgent: "Mozilla/5.0 (compatible; LeadScout/1.0)"
  });

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});

    const title = await page.title();
    const text = await page.locator("body").innerText();

    const links = await page
      .locator("a[href]")
      .evaluateAll((elements) =>
        elements.map((element) => (element as { href: string }).href).filter(Boolean)
      );

    return {
      url,
      title,
      text: text.trim(),
      links: [...new Set(links)]
    };
  } finally {
    await page.close();
  }
}

function findContactLinks(page: CrawlResult) {
  const domain = getDomain(page.url);

  return page.links.filter((link) => {
    if (link === page.url || getDomain(link) !== domain) return false;

    let value = link.toLowerCase();
    try {
      value = decodeURIComponent(value);
    } catch {
      // Keep the raw href if it is not valid percent-encoding.
    }

    return contactHints.some((hint) => value.includes(hint));
  });
}
