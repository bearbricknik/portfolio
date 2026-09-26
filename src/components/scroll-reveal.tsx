"use client";

import { type RefObject, useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

import { useStreamingStore } from "@/stores/streaming-store";

/**
 * True once the element is in view AND (with `after`) the given StreamingText
 * has finished. Shared by ScrollReveal and other reveal-style components.
 */
export function useRevealGate(ref: RefObject<Element | null>, after?: string) {
  const inView = useInView(ref, { once: true, amount: 0.25 });
  const streamDone = useStreamingStore((state) => (after ? state.seen[after] === true : true));
  return inView && streamDone;
}

type ScrollRevealProps = {
  /**
   * Id of a StreamingText (`id` prop) that has to finish first. Until then the
   * content stays hidden, even if it is already in view.
   */
  after?: string;
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
export function ScrollReveal({ after, delay = 0, className, children }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useRevealGate(ref, after);
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
