import type { Metadata } from "next";
import { useLocale, useTranslations } from "next-intl";

import { AnchorArrival } from "@/components/anchor-link";
import { PageHeading } from "@/components/page-heading";
import { PageIntro } from "@/components/page-intro";
import { PageJsonLd } from "@/components/page-json-ld";
import { SectionHeading } from "@/components/section-heading";
import { StatTiles } from "@/components/stat-tiles";
import { ProjectList } from "@/components/tech-stack/project-list";
import { ProjectLink } from "@/components/tech-stack/tech-links";
import { ToolGroup } from "@/components/tech-stack/tool-group";
import { ToolRow } from "@/components/tech-stack/tool-row";
import type { Locale } from "@/i18n/config";
import { pageMetadata } from "@/lib/metadata";
import {
  PROJECTS,
  projectImage,
  projectsUsingTool,
  SKILL_LEVEL_MAX,
  SKILL_LEVEL_STEPS,
  TECH_STACK_STATS,
  TOOL_GROUPS,
  toolAnchor,
  TOOLS,
} from "@/lib/tech-stack";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({ namespace: "TechStackPage", path: "/tech-stack" });
}

export default function TechStack() {
  const t = useTranslations("TechStackPage");
  const locale = useLocale() as Locale;

  return (
    <section className="flex flex-col gap-6">
      <h1 className="sr-only">{t("title")}</h1>
      <PageJsonLd namespace="TechStackPage" path="/tech-stack" />
      {/* Opened from a link on another page (e.g. a tool on /cv): jump to it */}
      <AnchorArrival />
      <PageHeading page="stack" />
      <PageIntro
        id="tech-stack-intro"
        content={t.rich("intro", {
          strong: (chunks) => <strong className="font-medium">{chunks}</strong>,
        })}
      />
      {/* Derived from the tool and project lists: they update when entries are added */}
      <StatTiles
        items={[
          { value: TECH_STACK_STATS.tools, label: t("stats.tools", { count: TECH_STACK_STATS.tools }) },
          { value: TECH_STACK_STATS.projects, label: t("stats.projects", { count: TECH_STACK_STATS.projects }) },
          { value: TECH_STACK_STATS.professional, label: t("stats.professional") },
        ]}
      />

      {/* gap-6: same space above and below the section heading as between the page blocks */}
      <div className="flex flex-col gap-6">
        <SectionHeading id="tools" count={TECH_STACK_STATS.tools}>
          {t("sections.tools")}
        </SectionHeading>
        {TOOL_GROUPS.map((group) => (
          <ToolGroup key={group} label={t(`groups.${group}`)}>
            {TOOLS.filter((tool) => tool.group === group).map((tool) => {
              const usedIn = projectsUsingTool(tool.key);
              return (
                <ToolRow
                  key={tool.key}
                  id={toolAnchor(tool.key)}
                  name={t(`tools.${tool.key}.name`)}
                  summary={t(`tools.${tool.key}.summary`)}
                  description={t(`tools.${tool.key}.description`)}
                  mark={{ label: tool.mark, color: tool.color }}
                  skill={{ value: SKILL_LEVEL_STEPS[tool.level], max: SKILL_LEVEL_MAX, label: t(`levels.${tool.level}`) }}
                  footer={
                    usedIn.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="mr-0.5 text-[13px] text-muted-foreground/70">{t("usedIn")}</span>
                        {usedIn.map((project) => (
                          <ProjectLink key={project.key} project={project.key} mark={project.mark}>
                            {t(`projects.${project.key}.title`)}
                          </ProjectLink>
                        ))}
                      </div>
                    )
                  }
                />
              );
            })}
          </ToolGroup>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <SectionHeading id="projects" count={TECH_STACK_STATS.projects}>
          {t("sections.projects")}
        </SectionHeading>
        <ProjectList
          projects={PROJECTS.map((project) => {
            const title = t(`projects.${project.key}.title`);
            const image = projectImage(project, locale);
            return {
              key: project.key,
              title,
              period: t(`projects.${project.key}.period`),
              description: t(`projects.${project.key}.description`),
              image: image && { ...image, alt: title },
              tags: "tags" in project ? project.tags.map((tag) => t(`tags.${tag}`)) : undefined,
              tools: project.tools.map((key) => ({ key, name: t(`tools.${key}.name`) })),
              hasDetails: "hasDetails" in project && project.hasDetails,
              moreLabel: t("more", { project: title }),
            };
          })}
        />
      </div>
    </section>
  );
}
