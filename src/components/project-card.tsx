"use client";

import { type ReactNode, useRef } from "react";
import type { StaticImageData } from "next/image";
import { IconArrowUpRight } from "@central-icons-react/round-outlined-radius-3-stroke-1.5";
import { motion, useReducedMotion } from "motion/react";

import { Polaroid } from "@/components/polaroid";
import { RoundButton } from "@/components/round-button";
import { useRevealGate } from "@/components/scroll-reveal";
import { Tag } from "@/components/tag";
import { cn } from "@/lib/utils";

export type ProjectCardProps = {
  /** Anchor id, e.g. for links from a tool to this project */
  id?: string;
  title: string;
  /** When, e.g. "2023 – heute" */
  period: string;
  description: ReactNode;
  /** Shown as a polaroid next to the text; without it a quiet placeholder keeps the layout */
  image?: { src: StaticImageData | string; alt: string; focus?: "center" | "left" | "right" };
  /** Links, e.g. to the tools used (AnchorLink chips) */
  links?: ReactNode;
  /** Plain tags, e.g. platforms ("iOS", "Android") */
  tags?: string[];
  /** Opens more about the project (e.g. a modal); without it there is no button */
  onMore?: () => void;
  /** Accessible name and cursor label of the "more" button, e.g. "Mehr zu ProfitPath" */
  moreLabel?: string;
  /** Rotation of the polaroid in degrees; alternate it between cards */
  tilt?: number;
  /** Load the image right away (the first card on the page) */
  priority?: boolean;
  className?: string;
};

const EASE = [0.23, 1, 0.32, 1] as const;

/**
 * One project: polaroid on the left, period, title, description, links and
 * tags on the right, and an optional round button for more. Fades in once in
 * view (after the page's streaming text); on hover the polaroid straightens.
 */
export function ProjectCard({
  id,
  title,
  period,
  description,
  image,
  links,
  tags,
  onMore,
  moreLabel,
  tilt = -2,
  priority = false,
  className,
}: ProjectCardProps) {
  const ref = useRef<HTMLElement>(null);
  const visible = useRevealGate(ref, { waitForStreams: true });
  const reducedMotion = useReducedMotion();
  const hasFooter = Boolean(links) || Boolean(tags?.length);

  return (
    <motion.article
      ref={ref}
      id={id}
      className={cn("group/card grid gap-x-5 gap-y-4 border-b py-5 last:border-b-0 sm:grid-cols-[auto_1fr]", className)}
      initial="hidden"
      animate={visible ? "shown" : "hidden"}
      // Not interactive until it has appeared (e.g. links, the back button)
      inert={!visible}
      whileHover="hover"
      variants={{
        hidden: reducedMotion ? { opacity: 0 } : { opacity: 0, y: 10, filter: "blur(5px)" },
        shown: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.7, ease: EASE } },
      }}
    >
      {/* Tilted like a dropped photo; straightens up when the card is hovered */}
      <motion.div
        className={cn("self-start justify-self-start", !image && "hidden sm:block")}
        variants={{
          hidden: { rotate: tilt },
          shown: { rotate: tilt },
          hover: reducedMotion ? { rotate: tilt } : { rotate: 0, y: -3, scale: 1.03 },
        }}
        transition={{ type: "spring", stiffness: 320, damping: 24 }}
      >
        {image ? (
          <Polaroid
            photo={{ src: image.src, alt: image.alt, focus: image.focus, aspect: "landscape", caption: title }}
            reducedMotion={reducedMotion ?? false}
            size="md"
            priority={priority}
            reveal
            // Flat until the card is hovered, then it lifts off the page
            className="transition-shadow duration-300 ease-out group-hover/card:shadow-sm"
          />
        ) : (
          // Same footprint as the polaroid, so the texts line up next to each other;
          // on phones (stacked) there is nothing to line up, so it's left out
          <div
            aria-hidden
            className="hidden aspect-16/10 w-46 place-items-center rounded-lg border border-dashed text-sm text-muted-foreground/70 sm:grid"
          >
            {title}
          </div>
        )}
      </motion.div>

      <div className="relative flex min-w-0 flex-col">
        <span className="text-[13px] text-muted-foreground/70">{period}</span>
        {/* pr-9: room for the round button */}
        <h3 className={cn("mt-0.5 font-medium", onMore && "pr-9")}>{title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-pretty text-muted-foreground">{description}</p>

        {hasFooter && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {links}
            {tags?.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </div>
        )}

        {onMore && (
          <RoundButton
            icon={IconArrowUpRight}
            label={moreLabel ?? ""}
            onClick={onMore}
            iconClassName="group-hover/round:rotate-45"
            className="absolute top-0 right-0"
          />
        )}
      </div>
    </motion.article>
  );
}
