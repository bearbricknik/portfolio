"use client";

import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { IconPin } from "@central-icons-react/round-outlined-radius-3-stroke-1.5";

import { MetaLine } from "@/components/meta-line";
import { SanityImage } from "@/components/sanity-image";
import { type BlogPostResult, COVER_RATIO, readingMinutes } from "@/lib/blog";
import { cn } from "@/lib/utils";

type PostCardProps = {
  post: BlogPostResult;
  /** Accessible name of the pin, e.g. "Angeheftet" */
  pinnedLabel: string;
  /** Load the cover right away (the first posts on the page) */
  priority?: boolean;
  className?: string;
};

/**
 * One post in the overview, as a row: a small cover on the left; category,
 * date and reading time, the title and the excerpt on the right. Hovering
 * zooms into the picture; its frame stays.
 */
export function PostCard({ post, pinnedLabel, priority = false, className }: PostCardProps) {
  const format = useFormatter();
  const t = useTranslations("BlogPage");

  return (
    <Link
      href={`/blog/${post.slug}`}
      // Not just the post page's shell: the post itself (prerendered) is
      // loaded once the row is in view, so opening it is instant
      prefetch
      // The row's text makes no good cursor label: show the pointing hand instead
      data-cursor="pointer"
      className={cn(
        "group/card grid grid-cols-[6rem_1fr] items-start gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:grid-cols-[8.25rem_1fr] sm:gap-4",
        className,
      )}
    >
      <div className="relative aspect-16/10 overflow-hidden rounded-xl bg-muted after:absolute after:inset-0 after:rounded-[inherit] after:ring-1 after:ring-foreground/10 after:ring-inset">
        <SanityImage
          image={post.cover}
          alt={post.cover.alt}
          lqip={post.cover.lqip}
          ratio={COVER_RATIO}
          sizes="(min-width: 640px) 132px, 96px"
          priority={priority}
          className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover/card:scale-105 motion-reduce:transition-none"
        />
      </div>
      <div className="flex min-w-0 flex-col">
        <MetaLine className="text-xs leading-none">
          {post.category.title}
          <time dateTime={post.publishedAt}>
            {format.dateTime(new Date(post.publishedAt), { day: "numeric", month: "short", year: "numeric" })}
          </time>
          {t("readingTime", { minutes: readingMinutes(post.characters) })}
          {post.pinned && <IconPin aria-label={pinnedLabel} className="size-3.5" />}
        </MetaLine>
        <h2 className="mt-2 line-clamp-3 leading-snug font-medium text-balance">{post.title}</h2>
        <p className="mt-0.5 line-clamp-1 text-sm leading-normal text-muted-foreground sm:line-clamp-2">{post.excerpt}</p>
      </div>
    </Link>
  );
}
