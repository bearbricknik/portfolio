"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";

import { cn } from "@/lib/utils";

/**
 * Scrollable area with smooth, eased scrolling (Lenis) and a blurred edge at the
 * top/bottom whenever content is hidden there. Edge state is written to data
 * attributes (no re-renders on scroll).
 */
export function ScrollContainer({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const scroller = scrollerRef.current;
    const content = contentRef.current;
    if (!wrapper || !scroller || !content) return;

    // Lower lerp = slower, softer scrolling. Disabled automatically for prefers-reduced-motion.
    const lenis = new Lenis({ wrapper: scroller, content, lerp: 0.08, autoRaf: true });

    const update = () => {
      const { scrollTop, scrollHeight, clientHeight } = scroller;
      wrapper.toggleAttribute("data-overflow-top", scrollTop > 0);
      wrapper.toggleAttribute("data-overflow-bottom", scrollTop + clientHeight < scrollHeight - 1);
    };

    // Also re-check when the viewport or the content changes size
    const observer = new ResizeObserver(update);
    observer.observe(scroller);
    observer.observe(content);

    scroller.addEventListener("scroll", update, { passive: true });
    return () => {
      observer.disconnect();
      scroller.removeEventListener("scroll", update);
      lenis.destroy();
    };
  }, []);

  return (
    // The page starts at the top, so the bottom edge is on in the server HTML
    // already; otherwise it would only appear after hydration.
    <div ref={wrapperRef} className="relative flex min-h-0 flex-1 flex-col" data-overflow-bottom>
      <div ref={scrollerRef} className={cn("min-h-0 flex-1 overflow-y-auto", className)}>
        <div ref={contentRef} className="flex flex-1 flex-col">
          {children}
        </div>
      </div>
      <div aria-hidden className="scroll-edge scroll-edge-top" />
      <div aria-hidden className="scroll-edge scroll-edge-bottom" />
    </div>
  );
}
