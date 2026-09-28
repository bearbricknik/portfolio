"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";

import { Polaroid, type PolaroidPhoto, type PolaroidSize } from "@/components/polaroid";
import { cn } from "@/lib/utils";

type PolaroidFanProps = {
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
  className?: string;
};

const SPRING = { type: "spring", stiffness: 320, damping: 24 } as const;

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
 * A fan of polaroid photos, each casually tilted. Hovering (or focusing) a card
 * straightens it, lifts it to the front and writes in its title.
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
  className,
}: PolaroidFanProps) {
  const reducedMotion = useReducedMotion() ?? false;
  const center = (photos.length - 1) / 2;
  // Index of the hovered/focused card (null = none); drives the surrounding blur
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const deactivate = (index: number) =>
    setActiveIndex((current) => (current === index ? null : current));

  return (
    <ul className={cn("relative flex items-start justify-center py-12", className)}>
      {blurSurroundings && (
        <motion.li
          aria-hidden
          // Oval larger than the fan; the radial mask fades the blur out softly.
          // Behind the cards (earlier in the DOM), in front of the page text.
          className="pointer-events-none absolute"
          style={{
            inset: "-90% -25%",
            // Only a soft blur, no tint or background color
            backdropFilter: `blur(${blurSurroundings === true ? 2 : blurSurroundings}px)`,
            maskImage: "radial-gradient(closest-side, black 65%, transparent)",
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
            <Polaroid
              photo={photo}
              size={size}
              // Only the first card loads eagerly; the others lazily as they come into view
              priority={priority && index === 0}
              reducedMotion={reducedMotion}
            />
          </motion.li>
        );
      })}
    </ul>
  );
}
