"use client";

import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { IconPlusLarge } from "@central-icons-react/round-outlined-radius-3-stroke-1.5";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { SkillMeter } from "@/components/tech-stack/skill-meter";
import { ANCHOR_ARRIVE_EVENT } from "@/components/anchor-link";
import { LetterMark } from "@/components/letter-mark";

type ToolRowProps = {
  /** Anchor id, e.g. for links from a project to this tool */
  id?: string;
  name: string;
  /** One line under the name */
  summary: string;
  mark: { label: string; color: string };
  skill: { value: number; max: number; label: string };
  /** Shown when the row is opened */
  description: ReactNode;
  /** Extra content below the description, e.g. links to the projects using the tool */
  footer?: ReactNode;
};

const EASE = [0.23, 1, 0.32, 1] as const;

/**
 * One tool: mark, name, summary and skill level in a row that opens to show
 * the full description, on click or when a link jumps to it. Rendered inside
 * a ToolGroup, which reveals the rows.
 */
export function ToolRow({ id, name, summary, mark, skill, description, footer }: ToolRowProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const ref = useRef<HTMLLIElement>(null);

  // Opens when a link jumps here (e.g. from a project); an open row stays open
  useEffect(() => {
    const row = ref.current;
    if (!row) return;
    const openRow = () => setOpen(true);
    row.addEventListener(ANCHOR_ARRIVE_EVENT, openRow);
    return () => row.removeEventListener(ANCHOR_ARRIVE_EVENT, openRow);
  }, []);
  const reducedMotion = useReducedMotion();

  return (
    <motion.li
      ref={ref}
      id={id}
      className="border-b"
      variants={{
        hidden: reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8, filter: "blur(4px)" },
        shown: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.6, ease: EASE } },
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        // The row's text makes no good cursor label: show the pointing hand instead
        data-cursor="pointer"
        // The mark sits on the name's line; skill and toggle center on the whole row.
        // Phones: name and summary get the full width, the skill moves below them
        // and the toggle centers on both lines (explicit grid placement)
        className="group grid w-full cursor-pointer grid-cols-[auto_1fr_auto] items-start gap-x-3.5 py-3 text-left sm:grid-cols-[auto_1fr_auto_auto]"
      >
        <LetterMark label={mark.label} color={mark.color} className="col-start-1 row-start-1 mt-0.5" />
        <span className="col-start-2 row-start-1 min-w-0">
          <span className="block leading-6.5 font-medium">{name}</span>
          <span className="block text-sm leading-snug text-muted-foreground">{summary}</span>
        </span>
        <SkillMeter
          value={skill.value}
          max={skill.max}
          label={skill.label}
          className="col-start-2 row-start-2 mt-2 justify-self-start sm:col-start-3 sm:row-start-1 sm:mt-0 sm:self-center"
        />
        <IconPlusLarge
          aria-hidden
          className="col-start-3 row-span-2 row-start-1 size-4 self-center text-muted-foreground transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] group-aria-expanded:rotate-45 group-aria-expanded:text-foreground sm:col-start-4 sm:row-span-1"
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            role="region"
            aria-label={name}
            className="overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.45, ease: EASE }}
          >
            {/* pl-9: text lines up with the name, past the 22px mark and gap */}
            <div className="flex flex-col gap-2.5 pb-4 pl-9 text-sm leading-relaxed text-muted-foreground">
              <p className="text-pretty">{description}</p>
              {footer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}
