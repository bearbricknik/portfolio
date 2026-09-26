import type { MetadataRoute } from "next";

export type AppRoute = {
  href: `/${string}`;
  /** Public route that should NOT be emitted in /sitemap.xml (legal pages, success pages, …) */
  excludeFromSitemap?: boolean;
  changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority?: number;
};

/**
 * All app routes in one place. Add new pages here and they show up in
 * /sitemap.xml automatically (unless `excludeFromSitemap` is set).
 */
export const ROUTES = [
  { href: "/", changeFrequency: "monthly", priority: 1 },
  { href: "/about-me", changeFrequency: "monthly", priority: 0.8 },
  { href: "/cv", changeFrequency: "monthly", priority: 0.8 },
] satisfies AppRoute[];
