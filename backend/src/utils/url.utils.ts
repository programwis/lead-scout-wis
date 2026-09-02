import { getDomain } from "tldts";

export { getDomain };

const excludedDomains = new Set([
  "facebook.com",
  "instagram.com",
  "youtube.com",
  "linkedin.com",
  "tiktok.com",
  "x.com",
  "twitter.com",
  "line.me",
  "wikipedia.org",
  "trustpilot.com",
  "dataforthai.com",
  "companieshouse.gov.uk",
  "crunchbase.com",
  "zoominfo.com",
  "dnb.com",
  "opencorporates.com",
  "kompass.com",
  "thailandbusinessdirectory.com",
  "yellowpages.co.th",
  "moph.go.th",
  "dbd.go.th",
  "diw.go.th",
  "rd.go.th",
  "กรมพัฒนาธุรกิจการค้า.com"
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