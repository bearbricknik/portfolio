"use client";

import { useState } from "react";
import Image, { type StaticImageData } from "next/image";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";

export type PolaroidPhoto = {
  /** Prefer a static import (`import photo from "@/assets/…jpg"`): size and blur placeholder come for free */
  src: StaticImageData | string;
  alt: string;
  /** Optional title, written in above the photo while it's focused (needs a PolaroidFan around it) */
  title?: string;
  /** Optional handwritten caption in the frame's wide bottom edge */
  caption?: string;
  /**
   * `square` for photos (default), `landscape` (16:10) for screenshots,
   * banners and logos, which a square crop would cut too much
   */
  aspect?: "square" | "landscape";
  /** Which part stays visible when the crop cuts the photo, e.g. "left" (default: center) */
  focus?: "center" | "left" | "right";
};

export type PolaroidSize = "sm" | "md" | "lg";

/**
 * Photo sizes per size × aspect. `lg` is the fan on /about-me (grows over three
 * breakpoints), `md` sits next to a text block (e.g. a project), `sm` fits
 * inline with text. `sizes` tells next/image which width to load at each breakpoint.
 */
const PHOTO = {
  lg: {
    square: {
      className: "size-14 sm:size-24 md:size-32",
      sizes: "(min-width: 768px) 128px, (min-width: 640px) 96px, 56px",
    },
    landscape: {
      className: "aspect-16/10 w-24 sm:w-40 md:w-52",
      sizes: "(min-width: 768px) 208px, (min-width: 640px) 160px, 96px",
    },
  },
  md: {
    square: { className: "size-28 sm:size-32", sizes: "(min-width: 640px) 128px, 112px" },
    landscape: { className: "aspect-16/10 w-52 sm:w-46", sizes: "(min-width: 640px) 184px, 208px" },
  },
  sm: {
    square: { className: "size-20 sm:size-24", sizes: "(min-width: 640px) 96px, 80px" },
    landscape: { className: "aspect-16/10 w-36 sm:w-44", sizes: "(min-width: 640px) 176px, 144px" },
  },
} as const;

/** Title that writes itself in letter by letter (driven by the parent's `focus` variant) */
function PolaroidTitle({ text, reducedMotion }: { text: string; reducedMotion: boolean }) {
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

type PolaroidProps = {
  photo: PolaroidPhoto;
  size?: PolaroidSize;
  /** Load right away (above the fold / first image on the page); otherwise lazy */
  priority?: boolean;
  /**
   * Reveal the photo once it has loaded: it resolves out of a bright blur
   * (`.image-reveal`), instead of just appearing
   */
  reveal?: boolean;
  reducedMotion?: boolean;
  className?: string;
};

/**
 * One polaroid: white frame with the wider bottom edge, the photo inside and
 * an optional title. The single source of the frame for every photo on the
 * site (about page fan, CV stations), so they all look the same.
 */
export function Polaroid({
  photo,
  size = "lg",
  priority = false,
  reveal = false,
  reducedMotion = false,
  className,
}: PolaroidProps) {
  const { className: photoClassName, sizes } = PHOTO[size][photo.aspect ?? "square"];
  const [loaded, setLoaded] = useState(false);

  return (
    <figure
      className={cn(
        "relative rounded-lg bg-white shadow-md ring-1 ring-black/5",
        size === "lg" ? "p-1.5 pb-6 sm:p-2 sm:pb-8" : "p-1.5 pb-6",
        className,
      )}
    >
      <div className={cn("relative overflow-hidden rounded-sm bg-neutral-200", photoClassName)}>
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          sizes={sizes}
          className={cn(
            "object-cover",
            photo.focus === "left" && "object-left",
            photo.focus === "right" && "object-right",
            // Hidden until loaded, then revealed (lazy images reveal as they arrive)
            reveal && !reducedMotion && (loaded ? "image-reveal" : "opacity-0"),
          )}
          onLoad={reveal ? () => setLoaded(true) : undefined}
          placeholder={typeof photo.src === "string" ? "empty" : "blur"}
          priority={priority}
        />
      </div>
      {photo.caption && (
        // leading-none: the 16px handwriting fits the frame's 24px bottom edge
        <span className="pointer-events-none absolute inset-x-0 bottom-1 text-center font-handwriting text-base leading-none text-neutral-500">
          {photo.caption}
        </span>
      )}
      {photo.title && <PolaroidTitle text={photo.title} reducedMotion={reducedMotion} />}
    </figure>
  );
}
