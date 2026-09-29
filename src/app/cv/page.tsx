import type { Metadata } from "next";
import { useLocale, useTranslations } from "next-intl";

import { CvEntry } from "@/components/cv/cv-entry";
import { CvRegister } from "@/components/cv/cv-register";
import { CvYear } from "@/components/cv/cv-year";
import { PageHeading } from "@/components/page-heading";
import { PageIntro } from "@/components/page-intro";
import { PageJsonLd } from "@/components/page-json-ld";
import { Tag } from "@/components/tag";
import { ProjectLink, ToolLink } from "@/components/tech-stack/tech-links";
import type { Locale } from "@/i18n/config";
import { cvAnchor, type CvEntry as CvEntryData, cvEntryOfProject, CV_ENTRIES, CV_ROWS } from "@/lib/cv";
import { pageMetadata } from "@/lib/metadata";
import { PAGES } from "@/lib/pages";
import { projectByKey, projectImage } from "@/lib/tech-stack";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({ namespace: "CvPage", path: "/cv" });
}

// Entries with a photo, in order: their photos tilt alternately, like photos laid down by hand
const PHOTO_ENTRIES: string[] = CV_ENTRIES.filter((entry) => "project" in entry || "image" in entry).map(
  (entry) => entry.key,
);

export default function CV() {
  const t = useTranslations("CvPage");
  const tStack = useTranslations("TechStackPage");
  const locale = useLocale() as Locale;

  const photo = (entry: CvEntryData) => {
    if ("project" in entry) {
      const image = projectImage(projectByKey(entry.project), locale);
      const caption = tStack(`projects.${entry.project}.title`);
      return image && { ...image, alt: caption, caption };
    }
    if ("image" in entry) {
      const caption = t(`entries.${entry.key}.caption`);
      return { src: entry.image, alt: caption, caption };
    }
    return undefined;
  };

  // Only coding entries carry badges: related projects (jump to their entry
  // here), then the project's tools (to /tech-stack) and plain tags
  const footer = (entry: CvEntryData) => {
    const related = "related" in entry ? entry.related : [];
    const project = "project" in entry ? projectByKey(entry.project) : undefined;
    if (!related.length && !project) return undefined;

    return (
      <>
        {related.map((key) => {
          const home = cvEntryOfProject(key);
          return (
            home && (
              <ProjectLink key={key} project={key} mark={projectByKey(key).mark} targetId={cvAnchor(home.key)}>
                {tStack(`projects.${key}.title`)}
              </ProjectLink>
            )
          );
        })}
        {project?.tools.map((tool) => (
          <ToolLink key={tool} tool={tool} page={PAGES.stack.href}>
            {tStack(`tools.${tool}.name`)}
          </ToolLink>
        ))}
        {project &&
          "tags" in project &&
          project.tags.map((tag) => <Tag key={tag}>{tStack(`tags.${tag}`)}</Tag>)}
      </>
    );
  };

  return (
    <section className="flex flex-col gap-6">
      <h1 className="sr-only">{t("title")}</h1>
      <PageJsonLd namespace="CvPage" path="/cv" />
      <PageHeading page="cv" />
      <PageIntro
        id="cv-intro"
        content={t.rich("intro", {
          strong: (chunks) => <strong className="font-medium">{chunks}</strong>,
        })}
      />

      <CvRegister>
        {CV_ROWS.map(({ year, until, entries }) => (
          <CvYear
            key={`${year}-${until ?? ""}`}
            year={year}
            until={until === "today" ? t("today") : until}
          >
            {entries.map((entry) => (
              <CvEntry
                key={entry.key}
                id={cvAnchor(entry.key)}
                title={t(`entries.${entry.key}.title`)}
                description={t(`entries.${entry.key}.description`)}
                photo={photo(entry)}
                photoLabel={t("hasPhoto")}
                tilt={PHOTO_ENTRIES.indexOf(entry.key) % 2 ? 1.5 : -1.5}
                footer={footer(entry)}
              />
            ))}
          </CvYear>
        ))}
      </CvRegister>

    </section>
  );
}
