import type { ReactNode } from "react";

import { AnchorLink } from "@/components/anchor-link";
import { LetterMark } from "@/components/letter-mark";
import { PROJECT_MARK_COLOR, projectAnchor, type ProjectKey, toolAnchor, toolByKey, type ToolKey } from "@/lib/tech-stack";

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
