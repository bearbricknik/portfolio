"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion, type SpringOptions, useReducedMotion } from "motion/react";

import {
  Cursor,
  CursorFollow,
  CursorProvider,
  useCursor,
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

/**
 * Open overlays (dialogs, menus, dropdowns, popovers): while one is open the
 * label stays hidden, so it never overlaps the overlay. Base UI / shadcn set
 * these roles; add `data-cursor-overlay` to custom ones.
 */
const OVERLAY_SELECTOR = [
  "[data-cursor-overlay]",
  "[role='dialog']",
  "[role='alertdialog']",
  "[role='menu']",
  "[role='listbox']",
  "dialog[open]",
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

// Space kept between the label and the window edge before it flips sides
const EDGE_MARGIN = 8;
const LABEL_GAP = 12;

/**
 * Label bubble next to the cursor. Like a tooltip's collision handling it
 * flips to the left of the cursor when it would leave the window on the
 * right, and above it when it would leave at the bottom.
 */
function CursorLabel({
  label,
  visible,
  transition,
}: {
  label: string;
  visible: boolean;
  transition: SpringOptions;
}) {
  const { cursorPos } = useCursor();
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  // Measure the bubble (the text changes per hovered element)
  useEffect(() => {
    const bubble = bubbleRef.current;
    if (!bubble) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.target.getBoundingClientRect();
      setSize({ width, height });
    });
    observer.observe(bubble);
    return () => observer.disconnect();
  }, [visible]);

  const flipX = cursorPos.x + LABEL_GAP + size.width + EDGE_MARGIN > window.innerWidth;
  const flipY = cursorPos.y + 2 * LABEL_GAP + size.height + EDGE_MARGIN > window.innerHeight;

  return (
    <CursorFollow
      side={flipY ? "top" : "bottom"}
      sideOffset={LABEL_GAP}
      // "end": starts right of the cursor; "start": ends left of it
      align={flipX ? "start" : "end"}
      alignOffset={flipX ? 16 : 0}
      transition={transition}
    >
      <AnimatePresence>
        {visible && (
          <motion.div
            ref={bubbleRef}
            key="cursor-label"
            className="whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs text-background"
            // Grows out of the corner that points at the cursor
            style={{ transformOrigin: `${flipY ? "bottom" : "top"} ${flipX ? "right" : "left"}` }}
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
  );
}

export function SiteCursor() {
  const hasFinePointer = useHasFinePointer();
  const reducedMotion = useReducedMotion();
  // `label` keeps the last text so the bubble can animate out with it
  const [label, setLabel] = useState("");
  const [visible, setVisible] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);

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

  // Watch the page for overlays opening/closing (once per frame at most)
  useEffect(() => {
    if (!hasFinePointer) return;

    let frame = 0;
    const check = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setOverlayOpen(document.querySelector(OVERLAY_SELECTOR) !== null));
    };
    const observer = new MutationObserver(check);
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["role", "open", "data-cursor-overlay"],
    });
    check();
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
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
      <CursorLabel
        label={label}
        visible={visible && !overlayOpen}
        transition={reducedMotion ? { stiffness: 1000, damping: 100 } : LABEL_SPRING}
      />
    </CursorProvider>
  );
}
