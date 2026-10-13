"use client";

import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { useLocale } from "next-intl";

import { ALL, useBlogFilter } from "@/components/blog/blog-filter";
import { PostCard } from "@/components/blog/post-card";
import { ScrollReveal, useRevealGate } from "@/components/scroll-reveal";
import type { Locale } from "@/i18n/config";
import { blogPostsOptions } from "@/lib/blog-queries";

const EASE = [0.23, 1, 0.32, 1] as const;

type PostMosaicProps = {
  /** `empty`: no posts in the selected category; `noPosts`: no posts at all yet */
  labels: { pinned: string; empty: string; noPosts: string };
  /** Controls above the posts, e.g. the category filter; appears together with them */
  toolbar?: ReactNode;
};

/**
 * The overview: one post per row, fine lines in between. When the filter
 * changes, leaving posts fade out, the rest glide to their new places and new
 * ones fade in. Appears once the page's streaming text is done.
 */
export function PostMosaic({ labels, toolbar }: PostMosaicProps) {
  const locale = useLocale() as Locale;
  const { data: results } = useSuspenseQuery(blogPostsOptions(locale));
  const posts = useMemo(() => results.map(({ _id, ...post }) => ({ ...post, id: _id })), [results]);
  const { filter } = useBlogFilter();
  const ref = useRef<HTMLDivElement>(null);
  const gateOpen = useRevealGate(ref, { waitForStreams: true });
  const reducedMotion = useReducedMotion();

  const shown = useMemo(
    () => (filter === ALL ? posts : posts.filter((post) => post.category.key === filter)),
    [posts, filter],
  );

  // Next.js keeps /blog alive in the background (<Activity>) while a post is
  // open. When it's shown again, Motion puts the posts (layout) back to their
  // initial state without animating them in. So every time it's shown again,
  // the cards mount fresh, straight in their final state: coming back from a
  // post is just the page's crossfade, no second staggered entrance.
  // Only counts once the cards have actually appeared: React's Strict Mode
  // runs effects twice on the first mount, which must not count as "shown
  // again" (the cards would never animate in).
  const [generation, setGeneration] = useState(0);
  const revealed = useRef(false);
  // Once the cards have appeared they stay: nothing that happens later (the
  // page shown again, Fast Refresh, a remount) can hide them again
  const [everShown, setEverShown] = useState(false);
  if (gateOpen && !everShown) setEverShown(true);
  const visible = gateOpen || everShown;
  useEffect(() => {
    if (visible) revealed.current = true;
  }, [visible]);
  useEffect(() => {
    if (revealed.current) setGeneration((current) => current + 1);
  }, []);

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
      {/* The measured element (ref) stays the same; only the list remounts
          when the page is shown again, so the in-view check keeps observing
          an element that's still there */}
      <div ref={ref} className="flex flex-col gap-4">
        {toolbar && (
          <motion.div
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
        <div key={generation} className="relative flex flex-col">
          {!shown.length && <p className="text-sm text-muted-foreground">{labels.empty}</p>}
          <AnimatePresence mode="popLayout" initial={false}>
            {shown.map((post, index) => (
              <motion.div
                key={post.id}
                layout={!reducedMotion}
                // A line above every post but the first
                className="border-t py-4 first:border-t-0 first:pt-0"
                // Shown again after a post: already in place, no entrance
                initial={generation > 0 ? false : "hidden"}
                animate={visible ? "shown" : "hidden"}
                exit="leaving"
                // Invisible until revealed: not clickable or focusable before
                inert={!visible}
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
            ))}
          </AnimatePresence>
        </div>
      </div>
    </LayoutGroup>
  );
}
