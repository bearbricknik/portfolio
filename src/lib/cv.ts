import type { StaticImageData } from "next/image";

import fkfsImage from "@/assets/cv/fkfs.jpeg";
import type { ProjectKey } from "@/lib/tech-stack";

/*
 * CV — the single source for /cv.
 * Titles, descriptions and captions come from the `CvPage` messages (by key).
 * Coding projects point to their project in the tech stack: tools, tags and
 * picture come from there, so both pages always agree.
 */

type CvEntryDefinition = {
  key: string;
  /** The year it happened, or the start of a time span */
  year: number;
  /** End of a time span: a year, or "today" while it's still going on */
  until?: number | "today";
  /** The entry is this coding project: shows its tools, tags and picture */
  project?: ProjectKey;
  /** Projects it relates to, linked to their entry (only on coding entries) */
  related?: readonly ProjectKey[];
  /** A picture for entries that aren't projects; its caption is in the messages */
  image?: StaticImageData;
};

/** Newest first; an entry with a time span sits in its start year */
export const CV_ENTRIES = [
  { key: "portfolio", year: 2026, until: "today", project: "portfolio" },
  { key: "profitgo", year: 2025, project: "profitgo", related: ["profitpath"] },
  { key: "profitpath", year: 2023, until: 2026, project: "profitpath" },
  { key: "fourbyte", year: 2023 },
  { key: "nexossolutions", year: 2022, project: "nexossolutions" },
  { key: "nexosproxies", year: 2021, project: "nexosproxies" },
  { key: "bachelor", year: 2021 },
  { key: "firstCode", year: 2021 },
  { key: "thesis", year: 2020, image: fkfsImage },
  { key: "firstCompany", year: 2020 },
  { key: "hidria", year: 2018 },
  { key: "studies", year: 2017, until: 2021 },
  { key: "newZealand", year: 2017 },
  { key: "wieland", year: 2016 },
  { key: "abitur", year: 2016 },
  { key: "reisacher", year: 2014 },
  { key: "school", year: 2007, until: 2016 },
  { key: "born", year: 1997 },
] as const satisfies readonly CvEntryDefinition[];

export type CvEntry = (typeof CV_ENTRIES)[number];
export type CvEntryKey = CvEntry["key"];

/** Anchor id of an entry */
export const cvAnchor = (key: CvEntryKey) => `cv-${key}`;

/** The entry that is this project (its "home" on /cv), e.g. for links to it */
export const cvEntryOfProject = (project: ProjectKey) =>
  CV_ENTRIES.find((entry) => "project" in entry && entry.project === project);

/**
 * The rows of the register, newest first: entries with the same period
 * (start year and, for a span, its end) share a row. A span gets its own row,
 * even in a year that also has single-year entries.
 */
export const CV_ROWS = CV_ENTRIES.reduce<{ year: number; until?: number | "today"; entries: CvEntry[] }[]>(
  (rows, entry) => {
    const until = "until" in entry ? entry.until : undefined;
    const last = rows.at(-1);
    if (last && last.year === entry.year && last.until === until) last.entries.push(entry);
    else rows.push({ year: entry.year, until, entries: [entry] });
    return rows;
  },
  [],
);
