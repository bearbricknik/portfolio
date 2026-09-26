"use client";

import Image, { type StaticImageData } from "next/image";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

export type Polaroid = {
  /** Prefer a static import (`import photo from "@/assets/…jpg"`): size and blur placeholder come for free */
  src: StaticImageData | string;
  alt: string;
  /** Optional title, written in above the photo while it's focused */
  title?: string;
};

type PolaroidFanProps = {
  /** Any number of photos, laid out as a fan from left to right */
  photos: Polaroid[];
  /** Base rotation in degrees between two neighbouring cards (the fan shape) */
  spread?: number;
  /** Max extra random rotation per card in degrees, so they look casually dropped */
  tilt?: number;
  /** Different seed = a different (but stable) random layout */
  seed?: number;
  /** How much the outer cards drop (px per step², 0 = straight line) */
  arc?: number;
  /** Load the images eagerly (e.g. when the fan is above the fold) */
  priority?: boolean;
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

/** Title that writes itself in letter by letter (driven by the card's hover variants) */
function Title({ text, reducedMotion }: { text: string; reducedMotion: boolean }) {
  return (
    <motion.figcaption
      className="pointer-events-none absolute inset-x-0 bottom-full mb-2 flex justify-center"
      variants={{
        rest: { opacity: 0, y: 4 },
        focus: {
          opacity: 1,
          y: 0,
          transition: reducedMotion
            ? { duration: 0 }
            : { duration: 0.15, ease: "easeOut", staggerChildren: 0.025, delayChildren: 0.05 },
        },
      }}
    >
      <span className="whitespace-nowrap rounded-full bg-background px-2.5 py-1 text-xs font-medium text-foreground shadow-sm ring-1 ring-border">
        {/* Full text for screen readers; the animated letters are decorative */}
        <span className="sr-only">{text}</span>
        <span aria-hidden>
          {Array.from(text).map((char, index) => (
            <motion.span
              key={index}
              className="inline-block whitespace-pre"
              variants={{
                rest: { opacity: 0, filter: "blur(3px)" },
                focus: { opacity: 1, filter: "blur(0px)", transition: { duration: 0.2 } },
              }}
            >
              {char}
            </motion.span>
          ))}
        </span>
      </span>
    </motion.figcaption>
  );
}

/**
 * A fan of polaroid photos, each casually tilted. Hovering (or focusing) a card
 * straightens it, lifts it to the front and writes in its title.
 */
export function PolaroidFan({
  photos,
  spread = 3,
  tilt = 5,
  seed = 1,
  arc = 3,
  priority = false,
  className,
}: PolaroidFanProps) {
  const reducedMotion = useReducedMotion() ?? false;
  const center = (photos.length - 1) / 2;

  return (
    <ul className={cn("flex items-start justify-center py-12", className)}>
      {photos.map((photo, index) => {
        const offset = index - center;
        // Fan shape plus a stable random tilt and a little vertical jitter
        const rotate = offset * spread + (seededRandom(seed * 1000 + index) * 2 - 1) * tilt;
        const y = offset * offset * arc + (seededRandom(seed * 1000 + index + 500) * 2 - 1) * 4;

        return (
          <motion.li
            key={typeof photo.src === "string" ? photo.src : photo.src.src}
            // Cards overlap; later cards sit on top of earlier ones
            className="relative -ml-7 outline-none first:ml-0 sm:-ml-8"
            tabIndex={0}
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
            <figure className="relative rounded-lg bg-white p-1.5 pb-6 shadow-md ring-1 ring-black/5 sm:p-2 sm:pb-8">
              <div className="relative size-20 overflow-hidden rounded-sm bg-neutral-200 sm:size-32">
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(min-width: 640px) 128px, 80px"
                  className="object-cover"
                  placeholder={typeof photo.src === "string" ? "empty" : "blur"}
                  priority={priority}
                />
              </div>
              {photo.title && <Title text={photo.title} reducedMotion={reducedMotion} />}
            </figure>
          </motion.li>
        );
      })}
    </ul>
  );
}
