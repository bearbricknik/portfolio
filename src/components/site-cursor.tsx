"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion, type SpringOptions, useReducedMotion } from "motion/react";

import {
  Cursor,
  CursorFollow,
  CursorProvider,
} from "@/components/animate-ui/primitives/animate/cursor";

const FINE_POINTER_QUERY = "(pointer: fine)";

/**
 * Elements that show the label bubble. Add `data-cursor="Text"` to any element
 * (e.g. an image that opens a dialog) to make it interactive and set its label.
 */
const INTERACTIVE_SELECTOR = [
  "[data-cursor]",
  "a[href]",
  "button:not(:disabled)",
  "[role='button']",
  "[role='link']",
  "summary",
  "label[for]",
  "select",
  "input[type='submit']",
  "input[type='button']",
].join(",");

const MAX_LABEL_LENGTH = 40;

// Soft, slightly delayed movement to match the smooth scrolling (Lenis).
// The label trails a bit more than the arrow, so it follows behind it.
const CURSOR_SPRING: SpringOptions = { stiffness: 350, damping: 32, mass: 0.5 };
const LABEL_SPRING: SpringOptions = { stiffness: 220, damping: 28, mass: 0.6 };

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(FINE_POINTER_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

// Only devices with a mouse/trackpad get the custom cursor (not touch screens)
function useHasFinePointer() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(FINE_POINTER_QUERY).matches,
    () => false,
  );
}

function getLabel(element: Element) {
  const text =
    element.getAttribute("data-cursor") ||
    element.getAttribute("aria-label") ||
    element.getAttribute("title") ||
    element.textContent?.trim() ||
    element.querySelector("img[alt]")?.getAttribute("alt") ||
    "";
  const normalized = text.replace(/\s+/g, " ");
  return normalized.length > MAX_LABEL_LENGTH
    ? `${normalized.slice(0, MAX_LABEL_LENGTH - 1)}…`
    : normalized;
}

export function SiteCursor() {
  const hasFinePointer = useHasFinePointer();
  const reducedMotion = useReducedMotion();
  // `label` keeps the last text so the bubble can animate out with it
  const [label, setLabel] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!hasFinePointer) return;

    const handlePointerOver = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const interactive = target?.closest(INTERACTIVE_SELECTOR);
      const text = interactive ? getLabel(interactive) : "";

      if (text) setLabel(text);
      setVisible(Boolean(text));
    };

    document.addEventListener("pointerover", handlePointerOver, { passive: true });
    return () => document.removeEventListener("pointerover", handlePointerOver);
  }, [hasFinePointer]);

  if (!hasFinePointer) return null;

  return (
    <CursorProvider global>
      <Cursor smoothing={reducedMotion ? undefined : CURSOR_SPRING}>
        <svg
          className="size-6 text-foreground"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 40 40"
        >
          <path
            fill="currentColor"
            d="M1.8 4.4 7 36.2c.3 1.8 2.6 2.3 3.6.8l3.9-5.7c1.7-2.5 4.5-4.1 7.5-4.3l6.9-.5c1.8-.1 2.5-2.4 1.1-3.5L5 2.5c-1.4-1.1-3.5 0-3.3 1.9Z"
          />
        </svg>
      </Cursor>
      <CursorFollow
        side="bottom"
        sideOffset={12}
        align="end"
        alignOffset={0}
        transition={reducedMotion ? { stiffness: 1000, damping: 100 } : LABEL_SPRING}
      >
        <AnimatePresence>
          {visible && (
            <motion.div
              key="cursor-label"
              className="origin-top-left whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs text-background"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              {label}
            </motion.div>
          )}
        </AnimatePresence>
      </CursorFollow>
    </CursorProvider>
  );
}
