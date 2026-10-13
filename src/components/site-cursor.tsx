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
 * `data-cursor="pointer"` instead shows no label and turns the arrow into a
 * pointing hand, for clickable areas whose text makes no good label (e.g. a
 * whole row that opens). `data-cursor-pointer` shows the hand together with
 * the label (e.g. an icon button whose label says what it opens).
 */
const POINTER_VALUE = "pointer";
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
// Arrow ⇄ hand cross-fade
const SHAPE_TRANSITION = { duration: 0.15, ease: "easeOut" } as const;

const ARROW_PATH = "M1.8 4.4 7 36.2c.3 1.8 2.6 2.3 3.6.8l3.9-5.7c1.7-2.5 4.5-4.1 7.5-4.3l6.9-.5c1.8-.1 2.5-2.4 1.1-3.5L5 2.5c-1.4-1.1-3.5 0-3.3 1.9Z";
const HAND_PATH =
  "M13 3c1.1 0 2 .9 2 2v8h.2c.2-1.1 1.1-2 2.3-2s2.1.9 2.3 2h.2c.2-1 1.1-1.7 2.2-1.7 1.2 0 2.1.9 2.2 2.1.3-.2.7-.3 1.1-.3 1.4 0 2.5 1.1 2.5 2.5v4.9c0 5.2-3.7 9-9 9h-1.4c-2.7 0-5-1.2-6.6-3.3l-5.4-7c-.8-1-.6-2.4.4-3.2 1-.8 2.5-.6 3.3.4l1.7 2V5c0-1.1.9-2 2-2Z";

/** A shape as a CSS mask (for the part of the cursor over an image) */
const maskOf = (path: string, viewBox: string) =>
  `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}"><path d="${path}"/></svg>`)}")`;
const ARROW_MASK = maskOf(ARROW_PATH, "0 0 40 40");
const HAND_MASK = maskOf(HAND_PATH, "0 0 32 32");

const HIDDEN = "inset(100%)";

/**
 * Over an image, the cursor turns black or white, whichever contrasts with the
 * pixels beneath it (a backdrop filter: grayscale, invert, then a contrast so
 * strong that only black and white remain). Only the part of the cursor that
 * is actually over the image changes; elsewhere it stays as it is. Every frame
 * the cursor's box is intersected with the image beneath it: that part shows
 * the black-and-white version, and the normal cursor gets a hole there.
 */
function useCursorOverImages(
  enabled: boolean,
  box: React.RefObject<HTMLSpanElement | null>,
  base: React.RefObject<HTMLSpanElement | null>,
  onImage: React.RefObject<(HTMLSpanElement | null)[]>,
) {
  useEffect(() => {
    if (!enabled) return;
    let frame = 0;
    const setClip = (clipBase: string, clipOnImage: string) => {
      if (base.current) base.current.style.clipPath = clipBase;
      for (const element of onImage.current) if (element) element.style.clipPath = clipOnImage;
    };
    const tick = () => {
      frame = requestAnimationFrame(tick);
      const element = box.current;
      if (!element) return;
      const r = element.getBoundingClientRect();
      // The image under any corner or the middle of the cursor
      const points = [
        [r.left + r.width / 2, r.top + r.height / 2],
        [r.left, r.top],
        [r.right, r.top],
        [r.left, r.bottom],
        [r.right, r.bottom],
      ];
      let image: DOMRect | undefined;
      for (const [x, y] of points) {
        image = document.elementsFromPoint(x, y).find((el) => el.tagName === "IMG")?.getBoundingClientRect();
        if (image) break;
      }
      if (!image) return setClip("none", HIDDEN);
      const top = Math.max(0, image.top - r.top);
      const left = Math.max(0, image.left - r.left);
      const right = Math.max(0, r.right - image.right);
      const bottom = Math.max(0, r.bottom - image.bottom);
      const [x2, y2] = [r.width - right, r.height - bottom];
      setClip(
        // Everything except the part over the image (even-odd: a hole)
        `polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${left}px ${top}px, ${x2}px ${top}px, ${x2}px ${y2}px, ${left}px ${y2}px, ${left}px ${top}px)`,
        `inset(${top}px ${right}px ${bottom}px ${left}px)`,
      );
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [enabled, box, base, onImage]);
}

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
  const [pointer, setPointer] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const boxRef = useRef<HTMLSpanElement>(null);
  const baseRef = useRef<HTMLSpanElement>(null);
  const onImageRefs = useRef<(HTMLSpanElement | null)[]>([]);
  useCursorOverImages(hasFinePointer, boxRef, baseRef, onImageRefs);

  useEffect(() => {
    if (!hasFinePointer) return;

    const handlePointerOver = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const interactive = target?.closest(INTERACTIVE_SELECTOR);
      const isPointer = interactive?.getAttribute("data-cursor") === POINTER_VALUE;
      const text = interactive && !isPointer ? getLabel(interactive) : "";

      setPointer(isPointer || Boolean(interactive?.hasAttribute("data-cursor-pointer")));
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
        {/* Arrow and hand share one box and cross-fade, so the size never jumps */}
        <span ref={boxRef} className="relative block size-6">
          {/* Over images: black or white per pixel (see useCursorOverImages).
              Behind the normal cursor, so its backdrop doesn't include it. */}
          {[ARROW_MASK, HAND_MASK].map((mask, index) => (
            <motion.span
              key={mask}
              ref={(element) => {
                onImageRefs.current[index] = element;
              }}
              aria-hidden
              className="cursor-on-image absolute inset-0"
              style={{ maskImage: mask, WebkitMaskImage: mask, clipPath: HIDDEN }}
              initial={false}
              animate={index === 0 ? { opacity: pointer ? 0 : 1, scale: pointer ? 0.85 : 1 } : { opacity: pointer ? 1 : 0, scale: pointer ? 1 : 0.85 }}
              transition={SHAPE_TRANSITION}
            />
          ))}
          <span ref={baseRef} className="absolute inset-0">
            <motion.svg
              className="absolute inset-0 size-6 text-foreground"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 40 40"
              animate={{ opacity: pointer ? 0 : 1, scale: pointer ? 0.85 : 1 }}
              transition={SHAPE_TRANSITION}
            >
              <path
                fill="currentColor"
                d={ARROW_PATH}
              />
            </motion.svg>
            <motion.svg
              className="absolute inset-0 size-6 text-foreground"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 32 32"
              initial={false}
              animate={{ opacity: pointer ? 1 : 0, scale: pointer ? 1 : 0.85 }}
              transition={SHAPE_TRANSITION}
            >
              {/* Pointing hand: filled like the arrow, with a thin outline in the
                  background color so it reads on light and dark content */}
              <path
                fill="currentColor"
                stroke="var(--background)"
                strokeWidth="1.2"
                strokeLinejoin="round"
                d={HAND_PATH}
              />
              <path
                fill="none"
                stroke="var(--background)"
                strokeWidth="1.2"
                strokeLinecap="round"
                d="M15 13v4.5M19.8 13v4.5M24.4 13.4v4"
              />
            </motion.svg>
          </span>
        </span>
      </Cursor>
      <CursorLabel
        label={label}
        visible={visible && !overlayOpen}
        transition={reducedMotion ? { stiffness: 1000, damping: 100 } : LABEL_SPRING}
      />
    </CursorProvider>
  );
}
