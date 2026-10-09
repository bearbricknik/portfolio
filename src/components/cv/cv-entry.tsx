"use client";

import type { ReactNode } from "react";
import { IconCamera1 } from "@central-icons-react/round-outlined-radius-3-stroke-1.5";
import { motion, useReducedMotion } from "motion/react";

import { usePhotoPeek } from "@/components/photo-peek";
import { Polaroid, type PolaroidPhoto } from "@/components/polaroid";

export type CvEntryProps = {
  /** Anchor id, e.g. for links from other entries */
  id?: string;
  title: string;
  description: ReactNode;
  /**
   * Optional photo (landscape, with a handwritten caption): follows the cursor
   * while the entry is hovered, or sits in the entry on phones and touch screens
   */
  photo?: PolaroidPhoto;
  /** Screen reader hint next to the title when there's a photo, e.g. "mit Foto" */
  photoLabel?: string;
  /** Rotation of the hover peek in degrees; alternate it between entries */
  tilt?: number;
  /** Chips and tags below the text (ToolLink, ProjectLink, Tag) */
  footer?: ReactNode;
};

/**
 * One CV entry: title, description, badges and an
 * optional photo. Lives in a `CvYear` inside a `CvRegister`.
 */
export function CvEntry({ id, title, description, photo, photoLabel, tilt = -1.5, footer }: CvEntryProps) {
  const peek = usePhotoPeek();
  const reducedMotion = useReducedMotion();
  const peeks = Boolean(photo) && peek.enabled;

  return (
    <motion.article
      id={id}
      // Negative margin + padding: room for the pulse when a link jumps here
      className="group/entry -mx-2.5 scroll-mt-24 rounded-lg px-2.5 pt-0.5 pb-3.5"
      // The photo follows the cursor over the entry, but steps aside over the
      // badge row (gaps included), so it never covers what is about to be clicked
      onPointerOver={
        peeks
          ? (event) => {
              const overBadges = event.target instanceof Element && event.target.closest("[data-cv-badges]") !== null;
              if (overBadges) peek.hide();
              else peek.show(photo!, tilt * 2);
            }
          : undefined
      }
      onPointerLeave={peeks ? peek.hide : undefined}
      // Drives the inline photo's lift (same as the project cards on /tech-stack)
      initial="rest"
      animate="rest"
      whileHover="hover"
    >
      <h3 className="flex items-center gap-2 font-medium text-balance">
        {title}
        {photo && (
          <>
            {/* Hints at the photo where it follows the cursor */}
            <IconCamera1 aria-hidden className="hidden size-3.5 shrink-0 text-muted-foreground/70 pointer-fine:md:block" />
            {photoLabel && <span className="sr-only">({photoLabel})</span>}
          </>
        )}
      </h3>
      <p className="mt-0.5 text-sm leading-relaxed text-pretty text-muted-foreground hyphens-auto">
        {description}
      </p>
      {photo && (
        // Phones and touch screens: the photo sits in the entry, straight (only
        // the hover peek is tilted)
        <motion.div
          className="mt-3 mb-1 w-fit pointer-fine:md:hidden"
          // Lifts a little while the entry is hovered
          variants={{ rest: { y: 0, scale: 1 }, hover: reducedMotion ? { y: 0, scale: 1 } : { y: -3, scale: 1.03 } }}
          transition={{ type: "spring", stiffness: 320, damping: 24 }}
        >
          <Polaroid
            photo={{ ...photo, aspect: "landscape" }}
            size="md"
            reveal
            reducedMotion={reducedMotion ?? false}
            // Flat until the entry is hovered
            className="transition-shadow duration-300 ease-out group-hover/entry:shadow-sm"
          />
        </motion.div>
      )}
      {footer && (
        <div data-cv-badges className="mt-3 flex flex-wrap items-center gap-1.5">
          {footer}
        </div>
      )}
    </motion.article>
  );
}
