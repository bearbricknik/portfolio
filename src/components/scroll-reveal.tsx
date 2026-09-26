"use client";

import { type RefObject, useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

import { useStreamingStore, useStreamsIdle } from "@/stores/streaming-store";

export type RevealGateOptions = {
  /** Wait for this specific StreamingText (`id` prop) to finish */
  after?: string;
  /**
   * Wait until no StreamingText on the page is animating. Works on every page
   * without knowing ids (pages without a stream reveal right away) — use it
   * for shared layout parts like the footer.
   */
  waitForStreams?: boolean;
};

/**
 * True once the element is in view AND the stream conditions are met. Shared
 * by ScrollReveal and other reveal-style components.
 */
export function useRevealGate(ref: RefObject<Element | null>, { after, waitForStreams }: RevealGateOptions = {}) {
  // Starts false and only turns true after the first IntersectionObserver
  // callback, i.e. after streams on the page have registered themselves
  const inView = useInView(ref, { once: true, amount: 0.25 });
  const streamDone = useStreamingStore((state) => (after ? state.seen[after] === true : true));
  const streamsIdle = useStreamsIdle();
  return inView && streamDone && (!waitForStreams || streamsIdle);
}

type ScrollRevealProps = RevealGateOptions & {
  /** Extra delay in seconds once the content may appear, e.g. to stagger siblings */
  delay?: number;
  className?: string;
  children: React.ReactNode;
};

/**
 * Fades its content in once it scrolls into view (and, with `after`, only once
 * the given stream has finished). Content stays in the layout and the server
 * HTML while hidden, so nothing jumps and it stays indexable.
 */
export function ScrollReveal({ after, waitForStreams, delay = 0, className, children }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useRevealGate(ref, { after, waitForStreams });
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      // Also hides again while a new stream runs (e.g. after a language switch)
      animate={visible ? "shown" : "hidden"}
      variants={{
        hidden: reducedMotion ? { opacity: 0 } : { opacity: 0, y: 16, filter: "blur(4px)" },
        shown: { opacity: 1, y: 0, filter: "blur(0px)" },
      }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1], delay }}
      // Links inside can't be focused before they are visible
      inert={!visible}
    >
      {children}
    </motion.div>
  );
}
