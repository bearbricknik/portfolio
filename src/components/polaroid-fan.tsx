"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useLocale } from "next-intl";

import { Polaroid, type PolaroidPhoto, type PolaroidSize } from "@/components/polaroid";
import { type RevealGateOptions, useRevealGate } from "@/components/scroll-reveal";
import { cn } from "@/lib/utils";
import { useStreamingStore } from "@/stores/streaming-store";

type PolaroidFanProps = Pick<RevealGateOptions, "after"> & {
  /** Any number of photos, laid out as a fan from left to right */
  photos: PolaroidPhoto[];
  /** `lg` (default) for a fan on its own, `sm` next to text (e.g. a CV station) */
  size?: PolaroidSize;
  /** Base rotation in degrees between two neighbouring cards (the fan shape) */
  spread?: number;
  /** Max extra random rotation per card in degrees, so they look casually dropped */
  tilt?: number;
  /** Different seed = a different (but stable) random layout */
  seed?: number;
  /** How much the outer cards drop (px per step², 0 = straight line) */
  arc?: number;
  /** Load the first image right away (e.g. when the fan is above the fold); the rest load lazily */
  priority?: boolean;
  /**
   * While a photo is hovered/focused, softly blur everything around the fan
   * (an oval backdrop blur that fades out at its edges), so the photos pop.
   * `true` = 2px, or pass the blur strength in px.
   */
  blurSurroundings?: boolean | number;
  /**
   * Id under which the fan reports that its cards are being dealt (the locale
   * is appended, like stream ids), so a StreamingText can wait for it with `after`
   */
  revealId?: string;
  className?: string;
};

const SPRING = { type: "spring", stiffness: 320, damping: 24 } as const;
const EASE = [0.23, 1, 0.32, 1] as const;

// Reveal: the cards are dealt from left to right, each settling out of a blur (s)
const FAN_DEAL_STAGGER = 0.08;
const FAN_DEAL_DURATION = 0.7;

/**
 * Deterministic pseudo-random number in [0, 1) (mulberry32). Real randomness
 * would differ between server and client (hydration mismatch) and reshuffle
 * the fan on every load.
 */
function seededRandom(seed: number) {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// Overlap between neighbouring cards per size; more when the cards are smaller
const OVERLAP: Record<PolaroidSize, string> = {
  lg: "-ml-6 sm:-ml-7 md:-ml-8",
  md: "-ml-5 sm:-ml-6",
  sm: "-ml-4 sm:-ml-5",
};

/**
 * A fan of polaroid photos, each casually tilted. Once in view (and after the
 * `after` stream) the cards are dealt in one by one. Hovering (or focusing) a
 * card straightens it, lifts it to the front and writes in its title.
 */
export function PolaroidFan({
  photos,
  size = "lg",
  spread = 3,
  tilt = 5,
  seed = 1,
  arc = 3,
  priority = false,
  blurSurroundings = false,
  after,
  revealId,
  className,
}: PolaroidFanProps) {
  const reducedMotion = useReducedMotion() ?? false;
  const ref = useRef<HTMLUListElement>(null);
  const visible = useRevealGate(ref, { after });
  const locale = useLocale();
  const markSeen = useStreamingStore((state) => state.markSeen);
  useEffect(() => {
    if (visible && revealId) markSeen(`${revealId}-${locale}`);
  }, [visible, revealId, locale, markSeen]);
  const center = (photos.length - 1) / 2;
  const dealtOut = reducedMotion ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.94, filter: "blur(6px)" };
  const dealtIn = { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" };
  // Index of the hovered/focused card (null = none); drives the surrounding blur
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const deactivate = (index: number) =>
    setActiveIndex((current) => (current === index ? null : current));

  return (
    // z-10: its own layer above the page text, so the blur also covers
    // positioned inline elements (badges) that come after it in the DOM
    <ul
      ref={ref}
      className={cn("relative z-10 flex items-start justify-center py-12", className)}
      // Not interactive before the cards are dealt
      inert={!visible}
    >
      {blurSurroundings && (
        <motion.li
          aria-hidden
          // Wide oval around the fan, reaching well past the text column on both
          // sides; the radial mask keeps most of it fully blurred and only fades
          // out at the edges. Behind the cards (earlier in the DOM), in front of
          // the page text.
          className="pointer-events-none absolute"
          style={{
            inset: "-90% -45%",
            // Only a soft blur, no tint or background color
            backdropFilter: `blur(${blurSurroundings === true ? 2 : blurSurroundings}px)`,
            maskImage: "radial-gradient(closest-side, black 78%, transparent)",
          }}
          initial={false}
          animate={{ opacity: activeIndex === null ? 0 : 1 }}
          transition={{ duration: reducedMotion ? 0 : 0.3, ease: "easeOut" }}
        />
      )}
      {photos.map((photo, index) => {
        const offset = index - center;
        // Fan shape plus a stable random tilt and a little vertical jitter
        const rotate = offset * spread + (seededRandom(seed * 1000 + index) * 2 - 1) * tilt;
        const y = offset * offset * arc + (seededRandom(seed * 1000 + index + 500) * 2 - 1) * 4;

        return (
          <motion.li
            key={typeof photo.src === "string" ? photo.src : photo.src.src}
            // Cards overlap; later cards sit on top of earlier ones
            // (not `first:` — the blur layer is the first <li> when enabled)
            // Cards overlap (more when smaller, so the whole fan fits the width)
            className={cn("relative outline-none", index > 0 && OVERLAP[size])}
            tabIndex={0}
            onPointerEnter={() => setActiveIndex(index)}
            onPointerLeave={() => deactivate(index)}
            onFocus={() => setActiveIndex(index)}
            onBlur={() => deactivate(index)}
            initial={false}
            animate="rest"
            whileHover="focus"
            whileFocus="focus"
            variants={{
              rest: { rotate, y, scale: 1, zIndex: 0 },
              focus: { rotate: 0, y: -12, scale: 1.08, zIndex: 20 },
            }}
            transition={reducedMotion ? { duration: 0 } : SPRING}
          >
            {/* Dealt in on reveal; its own layer, so it doesn't fight the hover
                transforms. Plain values, no variant labels: the card's rest/focus
                must still reach the title inside */}
            <motion.div
              initial={dealtOut}
              animate={visible ? dealtIn : dealtOut}
              transition={{ duration: FAN_DEAL_DURATION, ease: EASE, delay: visible && !reducedMotion ? index * FAN_DEAL_STAGGER : 0 }}
            >
              <Polaroid
                photo={photo}
                size={size}
                // Only the first card loads eagerly; the others lazily as they come into view
                priority={priority && index === 0}
                reducedMotion={reducedMotion}
                // The cards overlap: the shadow keeps them apart
                className="shadow-md"
              />
            </motion.div>
          </motion.li>
        );
      })}
    </ul>
  );
}
