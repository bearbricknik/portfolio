import type { MetadataRoute } from "next";

import { ROUTES, type AppRoute } from "@/lib/routes";
import { siteConfig } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return (ROUTES as AppRoute[])
    .filter((route) => !route.excludeFromSitemap)
    .map(({ href, changeFrequency = "monthly", priority = 0.8 }) => ({
      url: `${siteConfig.url}${href === "/" ? "" : href}`,
      lastModified: new Date(),
      changeFrequency,
      priority,
    }));
}
