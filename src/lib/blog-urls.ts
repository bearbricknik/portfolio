import { defaultLocale, type Locale, locales } from "@/i18n/config";
import { siteConfig } from "@/lib/site";

/** Absolute address of a post in one language */
export const postUrl = (slug: string) => `${siteConfig.url}/blog/${slug}`;

/**
 * hreflang alternates of a post: one address per language that has one, plus
 * x-default (the default locale's address, else the first one there is).
 * Shared by the sitemap and the post page's <link rel="alternate">.
 */
export function postAlternates(slugs: Partial<Record<Locale, string | null>>) {
  const languages: Record<string, string> = {};
  for (const locale of locales) {
    const slug = slugs[locale];
    if (slug) languages[locale] = postUrl(slug);
  }
  const fallback = languages[defaultLocale] ?? Object.values(languages)[0];
  if (fallback) languages["x-default"] = fallback;
  return languages;
}
