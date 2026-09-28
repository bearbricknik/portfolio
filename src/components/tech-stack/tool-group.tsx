"use client";

import { type ReactNode, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";

import { useRevealGate } from "@/components/scroll-reveal";

type ToolGroupProps = {
  /** Name of the area, e.g. "Oberfläche" */
  label: string;
  /** ToolRow elements */
  children: ReactNode;
};

/**
 * An area of the tech stack: its name and its tools. Once in view (after the
 * page's streaming text), the rows come in one after another; their skill
 * bars fill as part of the same reveal.
 */
export function ToolGroup({ label, children }: ToolGroupProps) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useRevealGate(ref, { waitForStreams: true });
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      className="flex flex-col"
      initial="hidden"
      animate={visible ? "shown" : "hidden"}
      variants={{ hidden: {}, shown: { transition: { staggerChildren: reducedMotion ? 0 : 0.06 } } }}
    >
      <motion.h3
        className="mb-0.5 text-sm font-medium text-muted-foreground/70"
        variants={{ hidden: { opacity: 0 }, shown: { opacity: 1, transition: { duration: 0.5 } } }}
      >
        {label}
      </motion.h3>
      <motion.ul variants={{ hidden: {}, shown: { transition: { staggerChildren: reducedMotion ? 0 : 0.06 } } }}>
        {children}
      </motion.ul>
    </motion.div>
  );
}
