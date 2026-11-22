"use client";

import { useEffect, useRef, useState } from "react";
import Image, { type StaticImageData } from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { heartBurst } from "@/components/hi/celebrate";
import { useHiState } from "@/components/hi/hi-state";
import { cn } from "@/lib/utils";

export type PhotoMatchLabels = {
  /** Caption under my photo */
  me: string;
  /** Alt text of my photo */
  meAlt: string;
  /** Caption of the empty frame */
  you: string;
  /** Accessible name of the empty frame (opens the photo picker) */
  pick: string;
  /** Accessible name once a photo is in (picks another one) */
  change: string;
  /** Alt text of the chosen photo */
  youAlt: string;
  /** Handwritten caption of the merged polaroid once both photos are in */
  matched: string;
  /** Small print: the photo stays on the device */
  privacy: string;
};

const SPRING = { type: "spring", stiffness: 260, damping: 22 } as const;
const EASE = [0.23, 1, 0.32, 1] as const;
// Seconds the chosen photo takes to "develop", like a real polaroid
const DEVELOP = 1.8;
// Casual tilt while apart; once matched the two straighten up and merge
const TILT = 5;
// Corner radius of a card (rounded-lg); the inner corners go square when merged
const RADIUS = 8;

// The frame's photo area, the same size as a `md` Polaroid
const PHOTO_SIZE = "size-28 sm:size-32";

/**
 * My polaroid next to an empty frame: the visitor picks a photo of herself
 * (it stays in the browser, nothing is uploaded), it develops like a real
 * polaroid, then the two slide together into one wide polaroid captioned
 * "this could be us", a heart pops up on the seam and hearts burst out of
 * it. Worth a plus point.
 */
export function PhotoMatch({ photo, labels }: { photo: StaticImageData; labels: PhotoMatchLabels }) {
  const { name, collect } = useHiState();
  const reducedMotion = useReducedMotion() ?? false;
  const inputRef = useRef<HTMLInputElement>(null);
  const heartRef = useRef<HTMLSpanElement>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [matched, setMatched] = useState(false);

  // The photo only lives as an object URL in this tab; freed when replaced or gone
  useEffect(() => {
    if (!url) return;
    return () => URL.revokeObjectURL(url);
  }, [url]);

  const choose = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Same file again must fire `change` next time too
    event.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;
    setMatched(false);
    setUrl(URL.createObjectURL(file));
  };

  const developed = () => {
    setMatched(true);
    collect("match");
    // Hearts burst out of the heart once it has popped up
    window.setTimeout(() => {
      const rect = heartRef.current?.getBoundingClientRect();
      if (rect) heartBurst((rect.left + rect.width / 2) / window.innerWidth, (rect.top + rect.height / 2) / window.innerHeight);
    }, 250);
  };

  return (
    <div className="flex flex-col items-center gap-3 py-8">
      <div className={cn("relative flex items-center justify-center", matched ? "gap-0" : "gap-4 sm:gap-6")}>
        {/* Me */}
        <motion.figure
          layout
          className={cn(
            "relative bg-white p-1.5 pb-7",
            // Merged: one frame, so no shadow or ring cutting through the middle
            matched ? "pr-[3px]" : "shadow-md ring-1 ring-black/5",
          )}
          initial={false}
          animate={{
            rotate: matched ? 0 : -TILT,
            borderTopLeftRadius: RADIUS,
            borderBottomLeftRadius: RADIUS,
            borderTopRightRadius: matched ? 0 : RADIUS,
            borderBottomRightRadius: matched ? 0 : RADIUS,
          }}
          transition={reducedMotion ? { duration: 0 } : SPRING}
        >
          <div className={cn("relative overflow-hidden rounded-sm bg-neutral-200", PHOTO_SIZE)}>
            <Image src={photo} alt={labels.meAlt} fill sizes="(min-width: 640px) 128px, 112px" placeholder="blur" className="object-cover object-[50%_35%]" />
          </div>
          <motion.figcaption
            className="pointer-events-none absolute inset-x-0 bottom-1.5 text-center font-handwriting text-base leading-none text-neutral-500"
            animate={{ opacity: matched ? 0 : 1 }}
          >
            {labels.me}
          </motion.figcaption>
        </motion.figure>

        {/* The heart between the two, once matched */}
        <div aria-hidden className="pointer-events-none absolute top-1/2 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
          <AnimatePresence>
            {matched && (
              <motion.span
                ref={heartRef}
                className="block text-4xl drop-shadow-md"
                initial={reducedMotion ? false : { scale: 0, rotate: -20 }}
                animate={reducedMotion ? { scale: 1 } : { scale: [0, 1.35, 1], rotate: 0 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.6, ease: EASE }}
              >
                <motion.span
                  className="block"
                  animate={reducedMotion ? undefined : { scale: [1, 1.12, 1, 1.08, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 0.6, delay: 0.8 }}
                >
                  ❤️
                </motion.span>
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* You: an empty frame to tap, then the chosen photo */}
        <motion.button
          type="button"
          onClick={() => inputRef.current?.click()}
          aria-label={url ? labels.change : labels.pick}
          data-cursor={url ? labels.change : labels.pick}
          layout
          className={cn(
            "relative bg-white p-1.5 pb-7 outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            matched ? "pl-[3px]" : "shadow-md ring-1 ring-black/5",
          )}
          initial={false}
          animate={{
            rotate: matched ? 0 : TILT,
            borderTopLeftRadius: matched ? 0 : RADIUS,
            borderBottomLeftRadius: matched ? 0 : RADIUS,
            borderTopRightRadius: RADIUS,
            borderBottomRightRadius: RADIUS,
          }}
          // Merged it's one picture: lifting half of it would tear it apart
          whileHover={reducedMotion || matched ? undefined : { y: -6 }}
          whileTap={reducedMotion ? undefined : { scale: 0.97 }}
          transition={reducedMotion ? { duration: 0 } : SPRING}
        >
          <div
            className={cn(
              "relative overflow-hidden rounded-sm",
              PHOTO_SIZE,
              // Dark film only until the photo has developed: on the tilted,
              // rounded frame it would otherwise show as a thin edge around it
              !matched && "bg-[#1c1f24]",
            )}
          >
            {url ? (
              // A blob URL from the picker: plain <img>, next/image can't optimize it
              <motion.img
                key={url}
                src={url}
                alt={labels.youAlt}
                className="absolute inset-0 size-full object-cover"
                // Develops out of the dark film into full color, like a real polaroid
                initial={
                  reducedMotion
                    ? false
                    : { opacity: 0, filter: "sepia(0.7) brightness(0.35) contrast(0.7) blur(5px)" }
                }
                animate={{ opacity: 1, filter: "sepia(0) brightness(1) contrast(1) blur(0px)" }}
                transition={{ duration: reducedMotion ? 0 : DEVELOP, ease: "easeOut" }}
                onAnimationComplete={developed}
              />
            ) : (
              // Empty: an undeveloped polaroid, dark film with a sheen gliding over it
              <span className="absolute inset-0 overflow-hidden bg-linear-to-br from-[#3a3f47] to-[#1c1f24]">
                {!reducedMotion && (
                  <motion.span
                    aria-hidden
                    className="absolute inset-y-0 -left-full w-full bg-linear-to-r from-transparent via-white/12 to-transparent"
                    animate={{ x: ["0%", "200%"] }}
                    transition={{ duration: 1.6, ease: "easeInOut", repeat: Infinity, repeatDelay: 2.2 }}
                  />
                )}
                <span className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <span className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/30">
                    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                  <span className="text-[11px] font-medium text-white/60">{labels.youAlt}</span>
                </span>
              </span>
            )}
          </div>
          <motion.span
            className="pointer-events-none absolute inset-x-0 bottom-1.5 text-center font-handwriting text-base leading-none text-neutral-500"
            animate={{ opacity: matched ? 0 : 1 }}
          >
            {url && name ? name : labels.you}
          </motion.span>
        </motion.button>

        {/* One caption across the merged polaroid */}
        <AnimatePresence>
          {matched && (
            <motion.span
              key={url}
              className="pointer-events-none absolute inset-x-0 bottom-1.5 z-10 text-center font-handwriting text-lg leading-none text-neutral-600"
              initial={reducedMotion ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, delay: reducedMotion ? 0 : 0.35, ease: EASE }}
            >
              {labels.matched}
            </motion.span>
          )}
        </AnimatePresence>

        <input ref={inputRef} type="file" accept="image/*" onChange={choose} className="hidden" tabIndex={-1} aria-hidden />
      </div>

      <span className="text-center text-xs text-muted-foreground">{labels.privacy}</span>
    </div>
  );
}
