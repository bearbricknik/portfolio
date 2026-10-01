import { Suspense } from "react";
import type { Metadata } from "next";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getLocale, getTranslations } from "next-intl/server";

import { BlogFilterProvider, CategoryFilter } from "@/components/blog/blog-filter";
import { PostMosaic } from "@/components/blog/post-mosaic";
import { PageIntro } from "@/components/page-intro";
import { PageJsonLd } from "@/components/page-json-ld";
import type { Locale } from "@/i18n/config";
import { blogCategoriesOptions, blogPostsOptions } from "@/lib/blog-queries";
import { pageMetadata } from "@/lib/metadata";
import { getQueryClient } from "@/lib/query-client";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({ namespace: "BlogPage", path: "/blog" });
}

export default async function Blog() {
  const t = await getTranslations("BlogPage");
  const locale = (await getLocale()) as Locale;

  // Server-side rendering: both queries are loaded before the page renders,
  // so the posts are in the delivered HTML and the browser's query cache
  // starts filled (HydrationBoundary); nothing loads after the fact
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(blogPostsOptions(locale));
  await queryClient.prefetchQuery(blogCategoriesOptions(locale));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BlogFilterProvider>
        <section className="flex flex-col gap-6">
          <h1 className="sr-only">{t("title")}</h1>
          <PageJsonLd namespace="BlogPage" path="/blog" />
          <PageIntro
            id="blog-intro"
            content={t.rich("intro", {
              strong: (chunks) => <strong className="font-medium">{chunks}</strong>,
            })}
          />
          <Suspense>
            <PostMosaic
              labels={{ pinned: t("pinned"), empty: t("empty"), noPosts: t("noPosts") }}
              // The filter sits in the space the lower right column leaves anyway
              toolbar={<CategoryFilter labels={{ all: t("filterAll"), filter: t("filterLabel") }} />}
            />
          </Suspense>
        </section>
      </BlogFilterProvider>
    </HydrationBoundary>
  );
}
