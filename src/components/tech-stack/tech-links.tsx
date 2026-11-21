import type { ReactNode } from "react";
import { IconArrowUpRight, IconGlobe } from "@central-icons-react/round-outlined-radius-3-stroke-1.5";

import { AnchorLink } from "@/components/anchor-link";
import { LetterMark } from "@/components/letter-mark";
import { cn } from "@/lib/utils";
import { PROJECT_MARK_COLOR, projectAnchor, projectHost, type ProjectKey, toolAnchor, toolByKey, type ToolKey } from "@/lib/tech-stack";

type TechLinkProps = {
  /** Page the target is on, e.g. "/tech-stack" when linking from another page */
  page?: string;
  /** The label, e.g. the translated name */
  children: ReactNode;
};

/** Chip for a tool: its letter mark in its color, jumps to the tool's row */
export function ToolLink({ tool, page, children }: TechLinkProps & { tool: ToolKey }) {
  const { mark, color } = toolByKey(tool);

  return (
    <AnchorLink
      targetId={toolAnchor(tool)}
      page={page}
      accent={color}
      leading={<LetterMark label={mark} color={color} size="sm" />}
    >
      {children}
    </AnchorLink>
  );
}

/**
 * Chip for a project: its letter mark in the project color, jumps to the
 * project's card (or to `targetId`, e.g. the project's entry on /cv)
 */
export function ProjectLink({
  project,
  mark,
  targetId = projectAnchor(project),
  page,
  children,
}: TechLinkProps & { project: ProjectKey; mark: string; targetId?: string }) {
  return (
    <AnchorLink
      targetId={targetId}
      page={page}
      accent={PROJECT_MARK_COLOR}
      leading={<LetterMark label={mark} color={PROJECT_MARK_COLOR} size="sm" />}
    >
      {children}
    </AnchorLink>
  );
}

/**
 * Chip for a project's live site, labeled with its host. Opens in a new tab;
 * a plain, followed link (no nofollow, referrer kept), so the site gets the
 * backlink and sees the visits come from here.
 */
export function ProjectSiteLink({ url }: { url: string }) {
  const host = projectHost(url);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener"
      data-cursor={`${host} ↗`}
      className={cn(
        "group/link inline-flex items-center gap-1 rounded-md border bg-muted/40 py-[3px] pr-1.5 pl-1 text-xs leading-none",
        "transition-colors hover:border-current/45 hover:bg-current/10",
        PROJECT_MARK_COLOR,
      )}
    >
      <IconGlobe aria-hidden className="size-3.5" />
      <span className="text-foreground">{host}</span>
      <IconArrowUpRight
        aria-hidden
        className="size-2.5 text-muted-foreground transition-[translate,color] duration-300 group-hover/link:-translate-y-px group-hover/link:translate-x-px group-hover/link:text-inherit"
      />
    </a>
  );
}
