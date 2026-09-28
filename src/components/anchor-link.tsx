"use client";

import type { ReactNode } from "react";
import { IconArrowRight } from "@central-icons-react/round-outlined-radius-3-stroke-1.5";
import { useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

type AnchorLinkProps = {
  /** Id of the element on the same page to jump to (without "#") */
  targetId: string;
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

// Wait for the smooth scroll to arrive before the target lights up
const PULSE_DELAY = 450;

/**
 * Fired on the target element once the jump has arrived, so the target can
 * react, e.g. a collapsed row opening itself (listen with addEventListener)
 */
export const ANCHOR_ARRIVE_EVENT = "anchor-arrive";

/**
 * A small chip that jumps to another element on the same page: it scrolls
 * there smoothly, lets the target light up once (`.anchor-pulse`) and fires
 * `ANCHOR_ARRIVE_EVENT` on it.
 * Still a real link (#id), so it works without JavaScript and can be opened
 * like any other.
 */
export function AnchorLink({ targetId, leading, accent = "text-violet-500", children, className }: AnchorLinkProps) {
  const reducedMotion = useReducedMotion();

  return (
    <a
      href={`#${targetId}`}
      // Mark + name make no good cursor label: show the pointing hand instead
      data-cursor="pointer"
      onClick={(event) => {
        const target = document.getElementById(targetId);
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });
        // Restart the pulse, even if the same target was hit just before
        target.classList.remove("anchor-pulse");
        window.setTimeout(
          () => {
            target.classList.add("anchor-pulse");
            target.dispatchEvent(new CustomEvent(ANCHOR_ARRIVE_EVENT));
          },
          reducedMotion ? 0 : PULSE_DELAY,
        );
        target.addEventListener("animationend", () => target.classList.remove("anchor-pulse"), { once: true });
      }}
      className={cn(
        // The accent is the chip's currentColor; the label keeps the normal text color
        "group/link inline-flex items-center gap-1 rounded-md border bg-muted/40 py-[3px] pr-1.5 pl-[3px] text-xs leading-none",
        "transition-colors hover:border-current/45 hover:bg-current/10",
        accent,
        className,
      )}
    >
      {leading}
      <span className="text-foreground">{children}</span>
      <IconArrowRight
        aria-hidden
        className="size-2.5 text-muted-foreground transition-[translate,color] duration-300 group-hover/link:translate-x-0.5 group-hover/link:text-inherit"
      />
    </a>
  );
}
