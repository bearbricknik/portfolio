import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { IconArrowLeft } from "@central-icons-react/round-outlined-radius-3-stroke-1.5";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";

import { PostBody } from "@/components/blog/post-body";
import { LocaleAlternates } from "@/components/locale-alternates";
import { RoundButton } from "@/components/round-button";
import { SanityImage } from "@/components/sanity-image";
import { SectionHeading } from "@/components/section-heading";
import type { Locale } from "@/i18n/config";
import { CATEGORY_ICON, COVER_RATIO, readingMinutes } from "@/lib/blog";
import { blogPostOptions } from "@/lib/blog-queries";
import { postAlternates } from "@/lib/blog-urls";
import { getQueryClient } from "@/lib/query-client";
import { urlFor } from "@/sanity/lib/image";

// Read through TanStack Query: generateMetadata and the page share the
// request's query client, so the post is fetched once
async function getPost(slug: string) {
  const locale = (await getLocale()) as Locale;
  const post = await getQueryClient().fetchQuery(blogPostOptions(decodeURIComponent(slug), locale));
  return { post, locale };
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
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
 * A blog post, always built the same way: a row with the back button,
 * category, date and reading time; the title; the cover; the excerpt as
 * the lead; the text.
 */
export default async function BlogPostPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const { post, locale } = await getPost(slug);
  if (!post) notFound();

  // Opened with the other language's address (e.g. after switching the
  // language): go to this language's address, if the post has one
  const localSlug = post.slugs[locale];
  if (localSlug && localSlug !== decodeURIComponent(slug)) redirect(`/blog/${localSlug}`);

  const [t, format] = await Promise.all([getTranslations("BlogPage"), getFormatter()]);
  const Icon = CATEGORY_ICON[post.category.icon] ?? CATEGORY_ICON.all;

  // Where the language switch goes: this post's address in each language
  const paths = Object.fromEntries(
    Object.entries(post.slugs).flatMap(([language, value]) => (value ? [[language, `/blog/${value}`]] : [])),
  );

  return (
    // key: a new post (or this post in the other language) mounts fresh and
    // fades in; the old one stays until the new one is ready
    <article key={localSlug ?? post.slugs.de} className="content-in flex flex-col gap-6">
      <LocaleAlternates paths={paths} />
      <SectionHeading
        as="div"
        waitForStreams={false}
        leading={<RoundButton icon={IconArrowLeft} label={t("back")} href="/blog" iconClassName="group-hover/round:-translate-x-0.5" />}
        titleClassName="flex items-center gap-1.5 text-xs leading-none font-normal text-muted-foreground"
      >
        <Icon className="size-3.5" />
        {post.category.title}
        <span aria-hidden className="opacity-50">
          ·
        </span>
        <time dateTime={post.publishedAt}>
          {format.dateTime(new Date(post.publishedAt), { day: "numeric", month: "short", year: "numeric" })}
        </time>
        <span aria-hidden className="opacity-50">
          ·
        </span>
        {t("readingTime", { minutes: readingMinutes(post.characters) })}
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
