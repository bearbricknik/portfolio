"use client";

import { type ReactNode, useEffect } from "react";
import Link from "next/link";
import { IconArrowRight } from "@central-icons-react/round-outlined-radius-3-stroke-1.5";
import { useReducedMotion } from "motion/react";

import { resetScroll, scrollToCenter, whenScrollReady } from "@/components/scroll-container";
import { cn } from "@/lib/utils";
import { whenStreamsIdle } from "@/stores/streaming-store";

type AnchorLinkProps = {
  /** Id of the element to jump to (without "#") */
  targetId: string;
  /**
   * Page the target is on, e.g. "/tech-stack"; without it the target is on the
   * same page. That page needs an `<AnchorArrival />` to scroll and light up.
   */
  page?: string;
  /** Small mark in front of the label, e.g. a LetterMark */
  leading?: ReactNode;
  /**
   * Text color class of the chip's accent (usually the mark's color): the
   * border, fill and arrow take it on hover
   */
  accent?: string;
  children: ReactNode;
  className?: string;
};

// A target from another page may only appear after hydration: wait this long at most
const ARRIVAL_TIMEOUT = 5000;
// After the page's stream, what's in view fades in (e.g. the stat tiles:
// 0.15s delay + 2 × 0.1s stagger + 0.6s); the jump waits for that to finish
const REVEAL_SETTLE = 1000;

/**
 * Fired on the target element once the jump has arrived, so the target can
 * react, e.g. a collapsed row opening itself (listen with addEventListener)
 */
export const ANCHOR_ARRIVE_EVENT = "anchor-arrive";

/**
 * Scrolls smoothly to the target; once there, lets it light up
 * (`.anchor-pulse`) and fires `ANCHOR_ARRIVE_EVENT` on it
 */
function arriveAt(target: HTMLElement, reducedMotion: boolean) {
  // Restart the pulse, even if the same target was hit just before
  target.classList.remove("anchor-pulse");
  scrollToCenter(target, {
    immediate: reducedMotion,
    onArrive: () => {
      target.classList.add("anchor-pulse");
      target.addEventListener("animationend", () => target.classList.remove("anchor-pulse"), { once: true });
      target.dispatchEvent(new CustomEvent(ANCHOR_ARRIVE_EVENT));
    },
  });
}

/** The element with this id, as soon as it's in the DOM (null after the timeout) */
function waitForElement(id: string) {
  return new Promise<HTMLElement | null>((resolve) => {
    const found = document.getElementById(id);
    if (found) return resolve(found);
    const observer = new MutationObserver(() => {
      const element = document.getElementById(id);
      if (element) done(element);
    });
    const timeout = window.setTimeout(() => done(null), ARRIVAL_TIMEOUT);
    const done = (element: HTMLElement | null) => {
      observer.disconnect();
      window.clearTimeout(timeout);
      resolve(element);
    };
    observer.observe(document.body, { childList: true, subtree: true });
  });
}

/**
 * A small chip that jumps to another element, on the same page or on another
 * one (`page`): it scrolls there smoothly, lets the target light up once and
 * fires `ANCHOR_ARRIVE_EVENT` on it.
 * Still a real link (#id), so it works without JavaScript and can be opened
 * like any other.
 */
export function AnchorLink({
  targetId,
  page,
  leading,
  accent = "text-violet-500",
  children,
  className,
}: AnchorLinkProps) {
  const reducedMotion = useReducedMotion();
  const chipClassName = cn(
    // The accent is the chip's currentColor; the label keeps the normal text color
    "group/link inline-flex items-center gap-1 rounded-md border bg-muted/40 py-[3px] pr-1.5 pl-[3px] text-xs leading-none",
    "transition-colors hover:border-current/45 hover:bg-current/10",
    accent,
    className,
  );
  const content = (
    <>
      {leading}
      <span className="text-foreground">{children}</span>
      <IconArrowRight
        aria-hidden
        className="size-2.5 text-muted-foreground transition-[translate,color] duration-300 group-hover/link:translate-x-0.5 group-hover/link:text-inherit"
      />
    </>
  );

  if (page) {
    return (
      // Mark + name make no good cursor label: show the pointing hand instead
      <Link href={`${page}#${targetId}`} data-cursor="pointer" className={chipClassName}>
        {content}
      </Link>
    );
  }

  return (
    <a
      href={`#${targetId}`}
      data-cursor="pointer"
      onClick={(event) => {
        const target = document.getElementById(targetId);
        if (!target) return;
        event.preventDefault();
        arriveAt(target, reducedMotion ?? false);
      }}
      className={chipClassName}
    >
      {content}
    </a>
  );
}

/**
 * Put on a page that AnchorLinks from other pages point to: when the page
 * opens with a #hash, it lets the page build up first (target in the DOM,
 * scroller ready, streaming text done and the content in view faded in), then
 * brings the target into view and lets it light up like after a jump on the
 * same page. Renders nothing.
 */
export function AnchorArrival() {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;
    let cancelled = false;

    (async () => {
      // The scroller is set up after every other effect on the page, so by then
      // the page's streams have registered themselves
      const [target] = await Promise.all([waitForElement(id), whenScrollReady()]);
      if (!target || cancelled) return;
      // The browser has already jumped to the #hash: start at the top instead,
      // so the page builds up (the stream only starts once it's in view)
      if (!reducedMotion) {
        resetScroll();
        await whenStreamsIdle();
        await new Promise((resolve) => window.setTimeout(resolve, REVEAL_SETTLE));
      }
      // One frame for the layout to settle
      await new Promise(requestAnimationFrame);
      if (target && !cancelled) arriveAt(target, reducedMotion ?? false);
    })();

    return () => {
      cancelled = true;
    };
    // Only once, when the page opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
