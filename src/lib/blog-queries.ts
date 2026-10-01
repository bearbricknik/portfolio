import { queryOptions } from "@tanstack/react-query";

import type { Locale } from "@/i18n/config";
import type { BlogCategory, BlogPost, BlogPostResult } from "@/lib/blog";
import { client } from "@/sanity/lib/client";
import { CATEGORIES_QUERY, POST_CARDS_QUERY, POST_QUERY, POST_SITEMAP_QUERY } from "@/sanity/queries";

/*
 * Every blog read goes through TanStack Query: the same options prefetch on
 * the server (and stream to the browser through HydrationBoundary) and read
 * in client components (useSuspenseQuery). The `next` option lets Next.js
 * cache the Sanity request on the server (the browser ignores it): tagged
 * with the document types it reads, so a change in Sanity clears exactly
 * these entries right away (webhook → /api/revalidate). The time-based
 * revalidation is only a safety net in case a webhook gets lost.
 */

/** Cache tags: one per Sanity document type */
export const SANITY_TAGS = { post: "sanity:post", category: "sanity:category" } as const;
export const ALL_SANITY_TAGS = Object.values(SANITY_TAGS);

const REVALIDATE = 3600;
// Every blog read touches posts and categories (a card shows its category)
const fetchOptions = { next: { revalidate: REVALIDATE, tags: ALL_SANITY_TAGS } };

export const blogKeys = {
  all: ["blog"] as const,
  posts: (locale: Locale) => [...blogKeys.all, "posts", locale] as const,
  categories: (locale: Locale) => [...blogKeys.all, "categories", locale] as const,
  post: (slug: string, locale: Locale) => [...blogKeys.all, "post", slug, locale] as const,
  sitemap: () => [...blogKeys.all, "sitemap"] as const,
};

/** The overview's posts in one language (pinned first, then newest first) */
export const blogPostsOptions = (locale: Locale) =>
  queryOptions({
    queryKey: blogKeys.posts(locale),
    queryFn: () => client.fetch<BlogPostResult[]>(POST_CARDS_QUERY, { locale }, fetchOptions),
  });

/** The categories of the filter, with their number of posts */
export const blogCategoriesOptions = (locale: Locale) =>
  queryOptions({
    queryKey: blogKeys.categories(locale),
    queryFn: () => client.fetch<BlogCategory[]>(CATEGORIES_QUERY, { locale }, fetchOptions),
  });

/** One post by either of its addresses, in one language (null if there's none) */
export const blogPostOptions = (slug: string, locale: Locale) =>
  queryOptions({
    queryKey: blogKeys.post(slug, locale),
    queryFn: () => client.fetch<BlogPost | null>(POST_QUERY, { slug, locale }, fetchOptions),
  });

export type PostSitemapEntry = { slugs: { de: string | null; en: string | null }; _updatedAt: string };

/** Every published post's address per language, for the sitemap */
export const postSitemapOptions = () =>
  queryOptions({
    queryKey: blogKeys.sitemap(),
    queryFn: () => client.fetch<PostSitemapEntry[]>(POST_SITEMAP_QUERY, {}, fetchOptions),
  });
