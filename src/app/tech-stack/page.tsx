import type { Metadata } from "next";
import { useTranslations } from "next-intl";

import { PageHeading } from "@/components/page-heading";
import { PageIntro } from "@/components/page-intro";
import { PageJsonLd } from "@/components/page-json-ld";
import { SectionHeading } from "@/components/section-heading";
import { StatTiles } from "@/components/stat-tiles";
import { ToolGroup } from "@/components/tech-stack/tool-group";
import { ToolRow } from "@/components/tech-stack/tool-row";
import { pageMetadata } from "@/lib/metadata";
import { SKILL_LEVEL_MAX, SKILL_LEVEL_STEPS, TECH_STACK_STATS, TOOL_GROUPS, TOOLS } from "@/lib/tech-stack";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({ namespace: "TechStackPage", path: "/tech-stack" });
}

export default function TechStack() {
  const t = useTranslations("TechStackPage");

  return (
    <section className="flex flex-col gap-6">
      <h1 className="sr-only">{t("title")}</h1>
      <PageJsonLd namespace="TechStackPage" path="/tech-stack" />
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
            {TOOLS.filter((tool) => tool.group === group).map((tool) => (
              <ToolRow
                key={tool.key}
                id={`tool-${tool.key}`}
                name={t(`tools.${tool.key}.name`)}
                summary={t(`tools.${tool.key}.summary`)}
                description={t(`tools.${tool.key}.description`)}
                mark={{ label: tool.mark, color: tool.color }}
                skill={{ value: SKILL_LEVEL_STEPS[tool.level], max: SKILL_LEVEL_MAX, label: t(`levels.${tool.level}`) }}
              />
            ))}
          </ToolGroup>
        ))}
      </div>
    </section>
  );
}
