"use client";

import { type ReactNode, useEffect, useRef } from "react";

// A gesture ends after this long without wheel events (ms)
const GESTURE_END = 200;

/**
 * Horizontal scroll area for code that keeps its gestures to itself: a
 * gesture that starts sideways only scrolls the code (none of it, not even
 * the small vertical part a trackpad adds, reaches the page and its smooth
 * scroller). One that starts vertically scrolls the page as usual, since the
 * code has nothing to scroll that way.
 */
export function CodeScroll({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let axis: "x" | "y" | null = null;
    let timer: number | undefined;

    // Native listener (not React's): it runs before the page's scroller sees the event
    const onWheel = (event: WheelEvent) => {
      axis ??= Math.abs(event.deltaX) > Math.abs(event.deltaY) ? "x" : "y";
      window.clearTimeout(timer);
      timer = window.setTimeout(() => (axis = null), GESTURE_END);
      if (axis !== "x") return;

      event.preventDefault();
      event.stopPropagation();
      element.scrollLeft += event.deltaX || (event.shiftKey ? event.deltaY : 0);
    };

    element.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      element.removeEventListener("wheel", onWheel);
      window.clearTimeout(timer);
    };
  }, []);

  return (
    // overscroll-x-contain: reaching either end doesn't hand the scroll on (e.g. "back" swipes)
    <div ref={ref} className={`overflow-x-auto overscroll-x-contain ${className ?? ""}`}>
      {children}
    </div>
  );
}
