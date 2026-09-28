"use client";

import { useState } from "react";

import { AnchorLink } from "@/components/anchor-link";
import { LetterMark } from "@/components/letter-mark";
import { ProjectCard, type ProjectCardProps } from "@/components/project-card";
import { projectAnchor, type ProjectKey, toolAnchor, type ToolKey } from "@/lib/tech-stack";

export type ProjectListItem = Omit<ProjectCardProps, "id" | "links" | "onMore" | "tilt" | "priority"> & {
  key: ProjectKey;
  /** Tools used in the project, rendered as links to their rows */
  tools: { key: ToolKey; name: string; mark: string; color: string }[];
  /** Has more to show: renders the round button */
  hasDetails: boolean;
};

/**
 * The projects on /tech-stack: one ProjectCard each, with links to the tools
 * they use. Keeps which project's details are requested, so the project
 * modal can open from here.
 */
export function ProjectList({ projects }: { projects: ProjectListItem[] }) {
  // The project whose details were requested; the detail modal will open from this
  const [, setDetailsFor] = useState<ProjectKey | null>(null);

  return (
    <div className="flex flex-col">
      {projects.map(({ key, tools, hasDetails, ...project }, index) => (
        <ProjectCard
          key={key}
          {...project}
          id={projectAnchor(key)}
          // Alternating tilt, like photos laid down by hand
          tilt={index % 2 ? 2 : -2.5}
          priority={index === 0}
          onMore={hasDetails ? () => setDetailsFor(key) : undefined}
          links={tools.map((tool) => (
            <AnchorLink
              key={tool.key}
              targetId={toolAnchor(tool.key)}
              accent={tool.color}
              leading={<LetterMark label={tool.mark} color={tool.color} size="sm" />}
            >
              {tool.name}
            </AnchorLink>
          ))}
        />
      ))}
    </div>
  );
}
