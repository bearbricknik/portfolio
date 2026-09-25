/**
 * Public origin of the site, without trailing slash.
 * Set NEXT_PUBLIC_SITE_URL in production (e.g. https://example.com);
 * on Vercel the production domain is used as fallback.
 */
export function getSiteUrl() {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    "http://localhost:3000";
  const withProtocol = url.startsWith("http") ? url : `https://${url}`;
  return withProtocol.replace(/\/$/, "");
}

export const siteConfig = {
  url: getSiteUrl(),
  ogImage: {
    width: 1200,
    height: 630,
    type: "image/png",
  },
} as const;
