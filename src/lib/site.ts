/** Canonical production origin; the apex domain redirects here */
const PRODUCTION_URL = "https://www.huberdominik.com";

/**
 * Public origin of the site, without trailing slash.
 * NEXT_PUBLIC_SITE_URL overrides it (e.g. for a staging domain); production
 * builds use PRODUCTION_URL, `pnpm dev` uses localhost. (NODE_ENV is inlined
 * reliably at build time, VERCEL_ENV is not.)
 */
export function getSiteUrl() {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.NODE_ENV === "production" ? PRODUCTION_URL : "http://localhost:3000");
  const withProtocol = url.startsWith("http") ? url : `https://${url}`;
  return withProtocol.replace(/\/$/, "");
}

export const siteConfig = {
  url: getSiteUrl(),
  /** The public domain, e.g. for the Open Graph image (never localhost) */
  productionHost: new URL(PRODUCTION_URL).host,
  ogImage: {
    width: 1200,
    height: 630,
    type: "image/png",
  },
} as const;
