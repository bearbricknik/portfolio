import type { MetadataRoute } from "next";

import { locales } from "@/i18n/config";
import { postSitemapOptions } from "@/lib/blog-queries";
import { postAlternates, postUrl } from "@/lib/blog-urls";
import { getQueryClient } from "@/lib/query-client";
import { ROUTES, type AppRoute } from "@/lib/routes";
import { siteConfig } from "@/lib/site";

// Rebuilt at most once an hour, so new posts show up without a deploy
export const revalidate = 3600;

/**
 * Pages from ROUTES, then every blog post once per language: each entry lists
 * all its language versions (hreflang, plus x-default) so search engines
 * connect /blog/<slug-de> and /blog/<slug-en>.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = (ROUTES as AppRoute[])
    .filter((route) => !route.excludeFromSitemap)
    .map(({ href, changeFrequency = "monthly", priority = 0.8 }) => ({
      url: `${siteConfig.url}${href === "/" ? "" : href}`,
      lastModified: new Date(),
      changeFrequency,
      priority,
    }));

  // The same query options as everywhere else; the sitemap has to wait for them
  const posts = await getQueryClient().fetchQuery(postSitemapOptions());

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
