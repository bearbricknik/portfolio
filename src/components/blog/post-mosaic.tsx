"use client";

import { type ReactNode, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { useLocale } from "next-intl";

import { ALL, useBlogFilter } from "@/components/blog/blog-filter";
import { PostCard } from "@/components/blog/post-card";
import { ScrollReveal, useRevealGate } from "@/components/scroll-reveal";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";
import { blogPostsOptions } from "@/lib/blog-queries";

const EASE = [0.23, 1, 0.32, 1] as const;
const GAP = 12;
// The right column starts lower, so the mosaic doesn't read as a grid; the
// toolbar (e.g. the filter, 24px tall) sits in that space
const TOOLBAR_HEIGHT = 24;
const RIGHT_OFFSET = TOOLBAR_HEIGHT + GAP;

type PostMosaicProps = {
  /** `empty`: no posts in the selected category; `noPosts`: no posts at all yet */
  labels: { pinned: string; empty: string; noPosts: string };
  /**
   * Controls for the posts, e.g. the category filter: from sm on in the space
   * above the right column, on phones right-aligned above the first card.
   * Appears together with the cards.
   */
  toolbar?: ReactNode;
};

/**
 * The overview: two columns from sm on (one on phones), each card placed in
 * the currently shorter column, in reading order. When the filter changes,
 * leaving cards fade out, the rest glide to their new places and new ones
 * fade in. Appears once the page's streaming text is done.
 */
export function PostMosaic({ labels, toolbar }: PostMosaicProps) {
  const locale = useLocale() as Locale;
  const { data: results } = useSuspenseQuery(blogPostsOptions(locale));
  const posts = useMemo(() => results.map(({ _id, ...post }) => ({ ...post, id: _id })), [results]);
  const { filter } = useBlogFilter();
  const ref = useRef<HTMLDivElement>(null);
  const visible = useRevealGate(ref, { waitForStreams: true });
  const reducedMotion = useReducedMotion();

  const shown = useMemo(
    () => (filter === ALL ? posts : posts.filter((post) => post.category.key === filter)),
    [posts, filter],
  );

  // Column per post: alternating until the cards are measured, then balanced
  const [columns, setColumns] = useState<Record<string, 0 | 1>>({});
  useLayoutEffect(() => {
    const container = ref.current;
    if (!container) return;
    const balance = () => {
      const heights = [0, RIGHT_OFFSET];
      const next: Record<string, 0 | 1> = {};
      for (const post of shown) {
        const card = container.querySelector<HTMLElement>(`[data-post="${post.id}"]`);
        const column: 0 | 1 = heights[0] <= heights[1] ? 0 : 1;
        next[post.id] = column;
        heights[column] += (card?.offsetHeight ?? 0) + GAP;
      }
      setColumns((current) => (shown.every((post) => current[post.id] === next[post.id]) ? current : next));
    };
    balance();
    const observer = new ResizeObserver(balance);
    observer.observe(container);
    return () => observer.disconnect();
  }, [shown]);

  const columnOf = (post: { id: string }, index: number) => columns[post.id] ?? ((index % 2) as 0 | 1);
  // The first appearance staggers through all cards; later (filter) changes are quicker
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    if (!visible) return;
    const timer = window.setTimeout(() => setSettled(true), 1200);
    return () => window.clearTimeout(timer);
  }, [visible]);

  // Nothing published yet: just say so (a filter over nothing makes no sense)
  // (appears after the intro has streamed, like the posts would)
  if (!posts.length)
    return (
      <ScrollReveal waitForStreams>
        <p className="text-muted-foreground">{labels.noPosts}</p>
      </ScrollReveal>
    );

  return (
    <LayoutGroup>
      {/* Phones: one column, the column wrappers dissolve (contents) and
          `order` keeps the reading order. From sm: two columns. */}
      <div ref={ref} className="flex flex-col gap-3 sm:grid sm:grid-cols-2 sm:items-start">
        {[0, 1].map((column) => (
          <div
            key={column}
            // Without a toolbar the right column still starts lower (same offset)
            className={cn("contents sm:flex sm:flex-col sm:gap-3", column === 1 && !toolbar && "sm:mt-9")}
          >
            {column === 1 && toolbar && (
              // Phones: first in the single column (order), right-aligned
              <motion.div
                className="flex items-center justify-end max-sm:order-first"
                style={{ height: TOOLBAR_HEIGHT }}
                initial="hidden"
                animate={visible ? "shown" : "hidden"}
                variants={{
                  hidden: reducedMotion ? { opacity: 0 } : { opacity: 0, filter: "blur(4px)" },
                  shown: { opacity: 1, filter: "blur(0px)", transition: { duration: 0.5, ease: EASE } },
                }}
                inert={!visible}
              >
                {toolbar}
              </motion.div>
            )}
            {column === 0 && !shown.length && <p className="text-sm text-muted-foreground">{labels.empty}</p>}
            <AnimatePresence mode="popLayout" initial={false}>
              {shown.map((post, index) =>
                columnOf(post, index) === column ? (
                  <motion.div
                    key={post.id}
                    layoutId={post.id}
                    layout={!reducedMotion}
                    data-post={post.id}
                    style={{ order: index }}
                    initial="hidden"
                    animate={visible ? "shown" : "hidden"}
                    exit="leaving"
                    variants={{
                      hidden: reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98, filter: "blur(4px)" },
                      shown: {
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        filter: "blur(0px)",
                        transition: { duration: 0.5, ease: EASE, delay: settled ? index * 0.04 : 0.08 + index * 0.06 },
                      },
                      leaving: { opacity: 0, scale: 0.96, filter: "blur(4px)", transition: { duration: 0.22 } },
                    }}
                    transition={{ layout: { duration: 0.52, ease: EASE } }}
                  >
                    <PostCard post={{ ...post, _id: post.id }} pinnedLabel={labels.pinned} priority={index < 2} />
                  </motion.div>
                ) : null,
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </LayoutGroup>
  );
}
