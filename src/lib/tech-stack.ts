import type { StaticImageData } from "next/image";

import nexosProxiesImage from "@/assets/cv/nexosproxies.png";
import nexosSolutionsImage from "@/assets/cv/nexossolutions.jpeg";
import profitGoImage from "@/assets/cv/profitgo.png";
import profitPathImage from "@/assets/cv/profitpath.png";
import type { Locale } from "@/i18n/config";
import { OG_IMAGES } from "@/lib/og-images";

/*
 * TECH STACK — the single source for /tech-stack.
 * Tools and projects live here; names and texts come from the
 * `TechStackPage` messages (by key). Everything derived from this data
 * (e.g. the stats at the top) updates on its own when entries are added.
 */

/** How well I know a tool, from first steps to daily professional use */
export type SkillLevel = "beginner" | "basic" | "intermediate" | "professional";

/** Areas the tools are grouped into, in display order */
export const TOOL_GROUPS = ["interface", "languages", "backend", "databases", "services"] as const;
export type ToolGroup = (typeof TOOL_GROUPS)[number];

/** Bars filled in the skill meter per level (out of `SKILL_LEVEL_MAX`) */
export const SKILL_LEVEL_STEPS: Record<SkillLevel, number> = {
  beginner: 1,
  basic: 1,
  intermediate: 2,
  professional: 3,
};
export const SKILL_LEVEL_MAX = 3;

type ToolDefinition = {
  key: string;
  group: ToolGroup;
  level: SkillLevel;
  /** One or two letters for the tool's mark */
  mark: string;
  /** Text color class of the mark (its fill and border are derived from it) */
  color: string;
};

export const TOOLS = [
  { key: "nextjs", group: "interface", level: "professional", mark: "N", color: "text-foreground" },
  { key: "react", group: "interface", level: "intermediate", mark: "Re", color: "text-cyan-500" },
  { key: "reactNative", group: "interface", level: "intermediate", mark: "RN", color: "text-cyan-500" },
  { key: "chromeExtensions", group: "interface", level: "intermediate", mark: "Ex", color: "text-violet-500" },
  { key: "typescript", group: "languages", level: "intermediate", mark: "TS", color: "text-blue-500" },
  { key: "javascript", group: "languages", level: "professional", mark: "JS", color: "text-yellow-500" },
  { key: "python", group: "languages", level: "basic", mark: "Py", color: "text-sky-500" },
  { key: "go", group: "languages", level: "intermediate", mark: "Go", color: "text-teal-500" },
  { key: "nodejs", group: "backend", level: "professional", mark: "No", color: "text-green-500" },
  { key: "orpc", group: "backend", level: "beginner", mark: "oR", color: "text-pink-500" },
  { key: "tanstack", group: "backend", level: "intermediate", mark: "TQ", color: "text-orange-500" },
  { key: "postgresql", group: "databases", level: "intermediate", mark: "Pg", color: "text-blue-400" },
  { key: "mongodb", group: "databases", level: "intermediate", mark: "Mo", color: "text-green-600" },
  { key: "supabase", group: "services", level: "professional", mark: "Sb", color: "text-emerald-500" },
  { key: "stripe", group: "services", level: "professional", mark: "St", color: "text-indigo-500" },
  { key: "betterAuth", group: "services", level: "intermediate", mark: "BA", color: "text-foreground" },
] as const satisfies readonly ToolDefinition[];

export type ToolKey = (typeof TOOLS)[number]["key"];

/** Plain tags on projects (platforms etc.); names in `TechStackPage.tags` */
export const PROJECT_TAGS = ["chromeExtension", "ios", "android", "proxyServers", "networking"] as const;
export type ProjectTag = (typeof PROJECT_TAGS)[number];

type ProjectDefinition = {
  key: string;
  /** Two letters for the project's mark in links, e.g. "PP" */
  mark: string;
  /** Tools used in the project; each links to the tool (and back) */
  tools: readonly ToolKey[];
  /** Plain tags, e.g. platforms, for projects without tools to link */
  tags?: readonly ProjectTag[];
  /** A picture, or "og" for the site's Open Graph image in the visitor's language */
  image?: StaticImageData | "og";
  /** Has a detail modal: shows the round "more" button */
  hasDetails?: boolean;
};

/** Newest first */
export const PROJECTS = [
  { key: "portfolio", mark: "HD", tools: ["nextjs", "react", "typescript", "tanstack"], image: "og" },
  {
    key: "profitpath",
    mark: "PP",
    tools: ["nextjs", "react", "typescript", "tanstack", "supabase", "stripe"],
    image: profitPathImage,
    hasDetails: true,
  },
  {
    key: "profitgo",
    mark: "PG",
    tools: [],
    tags: ["chromeExtension", "ios", "android"],
    image: profitGoImage,
    hasDetails: true,
  },
  {
    key: "nexossolutions",
    mark: "NS",
    tools: ["javascript", "reactNative", "nodejs", "mongodb"],
    image: nexosSolutionsImage,
    hasDetails: true,
  },
  {
    key: "nexosproxies",
    mark: "NP",
    tools: [],
    tags: ["proxyServers", "networking"],
    image: nexosProxiesImage,
    hasDetails: true,
  },
] as const satisfies readonly ProjectDefinition[];

export type ProjectKey = (typeof PROJECTS)[number]["key"];

export type Tool = (typeof TOOLS)[number];
export type Project = (typeof PROJECTS)[number];

/** Projects are marked in the tech stack page's color (violet, like its heading icon) */
export const PROJECT_MARK_COLOR = "text-violet-500";

/** Anchor ids, so tools and projects can link to each other */
export const toolAnchor = (key: ToolKey) => `tool-${key}`;
export const projectAnchor = (key: ProjectKey) => `project-${key}`;

/**
 * A project's picture in the visitor's language ("og": the site's Open Graph
 * image, whose content sits on the left, so that side stays when cropped)
 */
export function projectImage(project: Project, locale: Locale) {
  if (!("image" in project)) return undefined;
  return project.image === "og"
    ? { src: OG_IMAGES[locale], focus: "left" as const }
    : { src: project.image, focus: undefined };
}

/** Looks up a project by key */
export const projectByKey = (key: ProjectKey): Project => PROJECTS.find((project) => project.key === key)!;

/** Looks up a tool by key (every key in PROJECTS is checked against TOOLS by the types) */
export const toolByKey = (key: ToolKey): Tool => TOOLS.find((tool) => tool.key === key)!;

/** The projects that use a tool, in project order */
export const projectsUsingTool = (key: ToolKey): Project[] =>
  PROJECTS.filter((project) => (project.tools as readonly ToolKey[]).includes(key));

/** The numbers at the top of the page, always in sync with the lists above */
export const TECH_STACK_STATS = {
  tools: TOOLS.length,
  projects: PROJECTS.length,
  professional: TOOLS.filter((tool) => tool.level === "professional").length,
} as const;
