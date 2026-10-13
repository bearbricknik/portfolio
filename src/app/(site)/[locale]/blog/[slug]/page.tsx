import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { IconArrowLeft } from "@central-icons-react/round-outlined-radius-3-stroke-1.5";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";

import { PostBody } from "@/components/blog/post-body";
import { LocaleAlternates } from "@/components/locale-alternates";
import { MetaLine } from "@/components/meta-line";
import { RoundButton } from "@/components/round-button";
import { SanityImage } from "@/components/sanity-image";
import { SectionHeading } from "@/components/section-heading";
import type { Locale } from "@/i18n/config";
import { COVER_RATIO, readingMinutes } from "@/lib/blog";
import { getPost as fetchPost, getPostSlugs } from "@/lib/blog-data.server";
import { postAlternates } from "@/lib/blog-urls";
import { urlFor } from "@/sanity/lib/image";

// Cached read (blog-data.server.ts): generateMetadata and the page share it
async function getPost(slug: string) {
  const locale = (await getLocale()) as Locale;
  const post = await fetchPost(decodeURIComponent(slug), locale);
  return { post, locale };
}

/**
 * Every post is prerendered in both languages under each of its addresses
 * (the other language's address redirects to this one's). Posts published
 * later are rendered on their first visit and cached from then on.
 */
export async function generateStaticParams() {
  const posts = await getPostSlugs();
  const slugs = [...new Set(posts.flatMap(({ slugs }) => [slugs.de, slugs.en]).filter((slug) => slug !== null))];
  // At least one entry is required; without posts it's a page that doesn't exist (404)
  return slugs.length ? slugs.map((slug) => ({ slug })) : [{ slug: "_" }];
}

export async function generateMetadata({ params }: PageProps<"/[locale]/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { post, locale } = await getPost(slug);
  if (!post) return {};

  const canonical = `/blog/${post.slugs[locale] ?? post.slugs.de}`;
  const image = urlFor(post.cover).width(1200).height(630).fit("crop").auto("format").url();

  return {
    title: post.title,
    description: post.excerpt,
    // Each language has its own address; they point at each other (hreflang)
    alternates: { canonical, languages: postAlternates(post.slugs) },
    openGraph: {
      type: "article",
      url: canonical,
      title: post.title,
      description: post.excerpt,
      publishedTime: post.publishedAt,
      modifiedTime: post._updatedAt,
      images: [{ url: image, width: 1200, height: 630, alt: post.cover.alt }],
    },
    twitter: { card: "summary_large_image", title: post.title, description: post.excerpt, images: [image] },
  };
}

/**
 * The page itself doesn't read the URL: the post (which depends on the slug)
 * renders inside a Suspense boundary, so the route's shared shell stays free
 * of URL data and Partial Prefetching can prefetch it once for every post.
 * Known posts are still fully prerendered (their data is cached), and the
 * blog cards prefetch the whole post, so opening one from there is instant.
 */
export default function BlogPostPage({ params }: PageProps<"/[locale]/blog/[slug]">) {
  return (
    // Keeps roughly a post's height while it loads, so the footer doesn't jump
    <Suspense fallback={<div aria-hidden className="min-h-[70vh]" />}>
      <BlogPost params={params} />
    </Suspense>
  );
}

/**
 * A blog post, always built the same way: a row with the back button,
 * category, date and reading time; the title; the cover; the excerpt as
 * the lead; the text.
 */
async function BlogPost({ params }: Pick<PageProps<"/[locale]/blog/[slug]">, "params">) {
  const { slug } = await params;
  const { post, locale } = await getPost(slug);
  if (!post) notFound();

  // Opened with the other language's address (e.g. after switching the
  // language): go to this language's address, if the post has one
  const localSlug = post.slugs[locale];
  if (localSlug && localSlug !== decodeURIComponent(slug)) redirect(`/blog/${localSlug}`);

  const [t, format] = await Promise.all([getTranslations("BlogPage"), getFormatter()]);

  // Where the language switch goes: this post's address in each language
  const paths = Object.fromEntries(
    Object.entries(post.slugs).flatMap(([language, value]) => (value ? [[language, `/blog/${value}`]] : [])),
  );

  return (
    // key: a new post (or this post in the other language) mounts fresh and
    // fades in; the old one stays until the new one is ready
    <article key={localSlug ?? post.slugs.de} className="content-in flex flex-col gap-4">
      <LocaleAlternates paths={paths} />
      <SectionHeading
        as="div"
        waitForStreams={false}
        leading={<RoundButton icon={IconArrowLeft} label={t("back")} href="/blog" iconClassName="group-hover/round:-translate-x-0.5" />}
        titleClassName="text-xs leading-none font-normal"
      >
        <MetaLine>
          {post.category.title}
          <time dateTime={post.publishedAt}>
            {format.dateTime(new Date(post.publishedAt), { day: "numeric", month: "short", year: "numeric" })}
          </time>
          {t("readingTime", { minutes: readingMinutes(post.characters) })}
        </MetaLine>
      </SectionHeading>

      <h1 className="-mb-2 text-lg leading-snug font-medium text-balance">{post.title}</h1>

      <div className="relative aspect-16/10 overflow-hidden rounded-2xl bg-muted after:absolute after:inset-0 after:rounded-[inherit] after:ring-1 after:ring-foreground/10 after:ring-inset">
        <SanityImage
          image={post.cover}
          alt={post.cover.alt}
          lqip={post.cover.lqip}
          ratio={COVER_RATIO}
          sizes="(min-width: 640px) 528px, 100vw"
          priority
          className="object-cover"
        />
      </div>

      <p className="text-pretty">{post.excerpt}</p>
      <PostBody value={post.body} />
    </article>
  );
}
