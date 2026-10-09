import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import type { Locale } from "@/i18n/config";
import type { BlogCategory, BlogPost, BlogPostResult } from "@/lib/blog";
import { ALL_SANITY_TAGS } from "@/lib/blog-queries";
import { client } from "@/sanity/lib/client";
import { CATEGORIES_QUERY, POST_CARDS_QUERY, POST_QUERY, POST_SITEMAP_QUERY } from "@/sanity/queries";

/*
 * Every read from Sanity, cached on the server ("use cache"). Each one is
 * tagged with the document types it reads (every read touches posts and
 * categories, a card shows its category), so a change in Sanity clears them
 * right away (webhook → /api/revalidate) and the pages built from them are
 * rebuilt. The hourly revalidation is only a safety net (a lost webhook, a
 * post whose publish date has just been reached). The Sanity client never
 * reaches the browser: client components read what the page put into the
 * query cache.
 */

/** Lifetime and tags of every blog read; call it first inside a "use cache" function */
function blogCache() {
  cacheLife("hours");
  cacheTag(...ALL_SANITY_TAGS);
}

/** The overview's posts in one language (pinned first, then newest first) */
export async function getPostCards(locale: Locale) {
  "use cache";
  blogCache();
  return client.fetch<BlogPostResult[]>(POST_CARDS_QUERY, { locale });
}

/** The categories of the filter, with their number of posts */
export async function getCategories(locale: Locale) {
  "use cache";
  blogCache();
  return client.fetch<BlogCategory[]>(CATEGORIES_QUERY, { locale });
}

/** One post by either of its addresses, in one language (null if there's none) */
export async function getPost(slug: string, locale: Locale) {
  "use cache";
  blogCache();
  return client.fetch<BlogPost | null>(POST_QUERY, { slug, locale });
}

export type PostSitemapEntry = { slugs: { de: string | null; en: string | null }; _updatedAt: string };

/** Every published post's address per language (sitemap, prerendering) */
export async function getPostSlugs() {
  "use cache";
  blogCache();
  return client.fetch<PostSitemapEntry[]>(POST_SITEMAP_QUERY);
}
