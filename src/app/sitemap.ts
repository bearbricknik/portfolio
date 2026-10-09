import type { MetadataRoute } from "next";
import { cacheLife } from "next/cache";

import { locales } from "@/i18n/config";
import { getPostSlugs } from "@/lib/blog-data.server";
import { postAlternates, postUrl } from "@/lib/blog-urls";
import { ROUTES, type AppRoute } from "@/lib/routes";
import { siteConfig } from "@/lib/site";

/**
 * Pages from ROUTES, then every blog post once per language: each entry lists
 * all its language versions (hreflang, plus x-default) so search engines
 * connect /blog/<slug-de> and /blog/<slug-en>.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Cached like the posts it lists: rebuilt when they change (webhook) or hourly
  "use cache";
  cacheLife("hours");

  const pages = (ROUTES as AppRoute[])
    .filter((route) => !route.excludeFromSitemap)
    .map(({ href, changeFrequency = "monthly", priority = 0.8 }) => ({
      url: `${siteConfig.url}${href === "/" ? "" : href}`,
      lastModified: new Date(),
      changeFrequency,
      priority,
    }));

  const posts = await getPostSlugs();

  const postEntries = posts.flatMap(({ slugs, _updatedAt }) => {
    const languages = postAlternates(slugs);
    return locales.flatMap((locale) => {
      const slug = slugs[locale];
      if (!slug) return [];
      return {
        url: postUrl(slug),
        lastModified: new Date(_updatedAt),
        changeFrequency: "monthly" as const,
        priority: 0.6,
        alternates: { languages },
      };
    });
  });

  return [...pages, ...postEntries];
}
