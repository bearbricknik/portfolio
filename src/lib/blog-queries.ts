import { queryOptions } from "@tanstack/react-query";

import type { Locale } from "@/i18n/config";
import type { BlogCategory, BlogPostResult } from "@/lib/blog";

/*
 * The blog's query cache entries, shared by server and browser. A page fills
 * them on the server from the cached Sanity reads (blog-data.server.ts) and
 * they stream to the browser through HydrationBoundary; client components
 * read them with useSuspenseQuery. The browser never asks Sanity itself: the
 * data only changes with a new version of the page, so it never goes stale.
 */

/** Cache tags: one per Sanity document type */
export const SANITY_TAGS = { post: "sanity:post", category: "sanity:category" } as const;
export const ALL_SANITY_TAGS = Object.values(SANITY_TAGS);

export const blogKeys = {
  all: ["blog"] as const,
  posts: (locale: Locale) => [...blogKeys.all, "posts", locale] as const,
  categories: (locale: Locale) => [...blogKeys.all, "categories", locale] as const,
};

/**
 * The data always comes with the page, so this never runs in practice. It
 * exists because TanStack Query expects a queryFn (and warns in development
 * without one), and it says clearly what went wrong if it ever does run.
 */
function providedByThePage(queryKey: readonly unknown[]) {
  return () => Promise.reject(new Error(`${JSON.stringify(queryKey)} is filled by the page on the server, not fetched in the browser`));
}

/** The overview's posts in one language (pinned first, then newest first) */
export const blogPostsOptions = (locale: Locale) =>
  queryOptions<BlogPostResult[]>({
    queryKey: blogKeys.posts(locale),
    queryFn: providedByThePage(blogKeys.posts(locale)),
    staleTime: Infinity,
  });

/** The categories of the filter, with their number of posts */
export const blogCategoriesOptions = (locale: Locale) =>
  queryOptions<BlogCategory[]>({
    queryKey: blogKeys.categories(locale),
    queryFn: providedByThePage(blogKeys.categories(locale)),
    staleTime: Infinity,
  });
