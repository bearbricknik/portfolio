"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";

import { cn } from "@/lib/utils";

// The page's scroller (one per page, in the root layout), for scrolling from outside
let activeLenis: Lenis | null = null;
const readyListeners = new Set<() => void>();

/** Resolves once the page's smooth scroller is set up (right away if it is) */
export function whenScrollReady() {
  return new Promise<void>((resolve) => {
    if (activeLenis) resolve();
    else readyListeners.add(resolve);
  });
}

// Longest a smooth jump takes (Lenis, lerp 0.08) before the target counts as reached
const ARRIVE_FALLBACK = 1500;

/** Puts the page back at the top, without animation */
export function resetScroll() {
  activeLenis?.scrollTo(0, { immediate: true, force: true });
}

/**
 * Scrolls the page so the element sits in the middle of the view, with the
 * same easing as the wheel (Lenis); `onArrive` runs once it's there
 */
export function scrollToCenter(element: HTMLElement, { immediate = false, onArrive }: { immediate?: boolean; onArrive?: () => void } = {}) {
  const lenis = activeLenis;
  if (!lenis) {
    element.scrollIntoView({ behavior: immediate ? "auto" : "smooth", block: "center" });
    onArrive?.();
    return;
  }
  // Once: Lenis may drop onComplete when something interrupts the glide (e.g.
  // content revealing on the way), so a fallback arrives after it at the latest
  let arrived = false;
  const arrive = () => {
    if (arrived) return;
    arrived = true;
    window.clearTimeout(fallback);
    onArrive?.();
  };
  const fallback = window.setTimeout(arrive, ARRIVE_FALLBACK);
  const viewport = (lenis.options.wrapper as HTMLElement).clientHeight;
  lenis.scrollTo(element, {
    // Negative: stop this far before the element's top, which centers it
    offset: -Math.max(0, (viewport - element.offsetHeight) / 2),
    immediate,
    onComplete: arrive,
  });
}

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);

/**
 * Scrolls in one smooth move so the element, once it has grown by `growth` px
 * at its bottom, fits in view with `margin` below it; never so far that its
 * top leaves the view (`topGap` above it). The room for the growth has to
 * exist already (e.g. a spacer), the page can't scroll past its end.
 */
export function scrollForGrowth(
  element: HTMLElement,
  growth: number,
  { margin = 0, topGap = 24, duration = 1 }: { margin?: number; topGap?: number; duration?: number } = {},
) {
  const lenis = activeLenis;
  const viewport = lenis
    ? (lenis.options.wrapper as HTMLElement).getBoundingClientRect()
    : { top: 0, bottom: window.innerHeight };
  const rect = element.getBoundingClientRect();
  const delta = Math.min(rect.bottom + growth + margin - viewport.bottom, rect.top - viewport.top - topGap);
  if (delta <= 0) return;
  if (!lenis) {
    window.scrollBy({ top: delta, behavior: "smooth" });
    return;
  }
  // The page may just have grown (spacer), so Lenis measures again first
  lenis.resize();
  lenis.scrollTo(lenis.scroll + delta, { duration, easing: easeInOutCubic });
}

/**
 * Scrollable area with smooth, eased scrolling (Lenis) and a blurred edge at the
 * top/bottom whenever content is hidden there. Edge state is written to data
 * attributes (no re-renders on scroll).
 */
export function ScrollContainer({
  className,
  edgeClassName,
  children,
}: {
  className?: string;
  /**
   * Classes for the blurred top/bottom edges, e.g. `mx-auto max-w-xl` to limit
   * them to the content width (they span the whole container by default)
   */
  edgeClassName?: string;
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
    activeLenis = lenis;
    readyListeners.forEach((resolve) => resolve());
    readyListeners.clear();

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
      if (activeLenis === lenis) activeLenis = null;
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
      <div aria-hidden className={cn("scroll-edge scroll-edge-top", edgeClassName)} />
      <div aria-hidden className={cn("scroll-edge scroll-edge-bottom", edgeClassName)} />
    </div>
  );
}
