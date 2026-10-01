import type { ComponentType } from "react";
import { IconCode, IconCup, IconFolder1, IconLayoutGrid1 } from "@central-icons-react/round-outlined-radius-3-stroke-1.5";
import type { SanityImageSource } from "@sanity/image-url";

/** Icons a category can pick in the Studio (`category.icon`), plus "all" for the filter */
export const CATEGORY_ICON: Record<string, ComponentType<{ className?: string }>> = {
  all: IconLayoutGrid1,
  folder: IconFolder1,
  code: IconCode,
  coffee: IconCup,
};

/** Every cover is 16:10, in the overview and on the post page */
export const COVER_RATIO = 10 / 16;

export type BlogCategory = { key: string; icon: string; title: string; count: number };

export type BlogCover = SanityImageSource & { alt: string; lqip?: string };

/** One post as the overview needs it (POST_CARDS_QUERY) */
export type BlogPostResult = {
  _id: string;
  slug: string;
  title: string;
  publishedAt: string;
  pinned: boolean;
  category: { key: string; icon: string; title: string };
  cover: BlogCover;
};

/** A post's full content (POST_QUERY) */
export type BlogPost = {
  _id: string;
  _updatedAt: string;
  slugs: { de: string | null; en: string | null };
  title: string;
  excerpt: string;
  publishedAt: string;
  category: { key: string; icon: string; title: string };
  cover: BlogCover;
  /** Length of the text, for the reading time */
  characters: number;
  // Portable Text; its blocks are typed where they're rendered
  body: { _type: string; _key: string }[];
};

// About 5 characters per word, 200 words a minute
const CHARACTERS_PER_MINUTE = 5 * 200;

/** Reading time in whole minutes, at least one */
export const readingMinutes = (characters: number) => Math.max(1, Math.round(characters / CHARACTERS_PER_MINUTE));
