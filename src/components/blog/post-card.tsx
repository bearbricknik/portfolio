"use client";

import Link from "next/link";
import { useFormatter } from "next-intl";
import { IconPin } from "@central-icons-react/round-outlined-radius-3-stroke-1.5";

import { SanityImage } from "@/components/sanity-image";
import { type BlogPostResult, CATEGORY_ICON, COVER_RATIO } from "@/lib/blog";
import { cn } from "@/lib/utils";

type PostCardProps = {
  post: BlogPostResult;
  /** Accessible name of the pin, e.g. "Angeheftet" */
  pinnedLabel: string;
  /** Load the cover right away (the first cards on the page) */
  priority?: boolean;
  className?: string;
};

/**
 * One post in the overview, always built the same way: category and date,
 * the title (at most three lines), the cover. The cover sits inside the
 * card's padding, its corner plus that padding is the card's corner, so both
 * curves run parallel. Hovering zooms into the picture; its frame stays.
 */
export function PostCard({ post, pinnedLabel, priority = false, className }: PostCardProps) {
  const Icon = CATEGORY_ICON[post.category.icon] ?? CATEGORY_ICON.all;
  const format = useFormatter();

  return (
    <Link
      href={`/blog/${post.slug}`}
      // Not just the post page's shell: the post itself (prerendered) is
      // loaded once the card is in view, so opening it is instant
      prefetch
      // The card's text makes no good cursor label: show the pointing hand instead
      data-cursor="pointer"
      className={cn(
        // Cover corner 16px + padding 16/20px = card corner 32/36px
        "group/card flex flex-col gap-2 rounded-[32px] border bg-card p-4 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:rounded-[36px] sm:p-5",
        className,
      )}
    >
      {/* leading-none: exactly as tall as its icon, so the padding above it
          looks the same as beside it */}
      <span className="mb-1 flex items-center gap-1.5 text-xs leading-none text-muted-foreground">
        <Icon className="size-3.5" />
        {post.category.title}
        <span aria-hidden className="opacity-50">
          ·
        </span>
        <time dateTime={post.publishedAt}>
          {format.dateTime(new Date(post.publishedAt), { day: "numeric", month: "short", year: "numeric" })}
        </time>
        {post.pinned && <IconPin aria-label={pinnedLabel} className="ml-auto size-3.5" />}
      </span>
      <h2 className="line-clamp-3 font-medium text-balance">{post.title}</h2>
      <div className="relative mt-1 aspect-16/10 overflow-hidden rounded-2xl bg-muted after:absolute after:inset-0 after:rounded-[inherit] after:ring-1 after:ring-foreground/10 after:ring-inset">
        <SanityImage
          image={post.cover}
          alt={post.cover.alt}
          lqip={post.cover.lqip}
          ratio={COVER_RATIO}
          sizes="(min-width: 640px) 264px, 100vw"
          priority={priority}
          className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover/card:scale-105 motion-reduce:transition-none"
        />
      </div>
    </Link>
  );
}
