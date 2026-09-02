import { getDomain } from "tldts";

export { getDomain };

const excludedDomains = new Set([
  "facebook.com",
  "instagram.com",
  "youtube.com",
  "wikipedia.org",
  "linkedin.com",
  "trustpilot.com",
  "line.me",
  "tiktok.com",
  "x.com",
  "twitter.com",
  "moph.go.th"
]);

export function isBusinessWebsite(url: string) {
  try {
    const domain = getDomain(url);

    if (!domain) return false;

    return !excludedDomains.has(domain);
  } catch {
    return false;
  }
}

/** Lowercase host + path without trailing slash, used as the stored website. */
export function normalizeUrl(url: string) {
  try {
    const { protocol, hostname, pathname } = new URL(url);
    const path = pathname.replace(/\/+$/, "");

    return `${protocol}//${hostname.toLowerCase()}${path}`;
  } catch {
    return url;
  }
}
