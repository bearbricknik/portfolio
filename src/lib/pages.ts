import {
  IconFileText,
  IconHand5Finger,
  IconHome,
  IconLayersThree,
  IconMapPin,
  IconPencil,
} from "@central-icons-react/round-outlined-radius-3-stroke-1.5";

/**
 * The pages in the navigation, with the icon and color that stand for them
 * (menu badges and the page heading). Titles: `Nav.pages.<key>` in the messages.
 */
export const PAGES = {
  about: { href: "/about-me", icon: IconHand5Finger, color: "text-amber-500" },
  cv: { href: "/cv", icon: IconFileText, color: "text-sky-500" },
  stack: { href: "/tech-stack", icon: IconLayersThree, color: "text-violet-500" },
  blog: { href: "/blog", icon: IconPencil, color: "text-emerald-500" },
  locations: { href: "/locations", icon: IconMapPin, color: "text-red-500" },
  home: { href: "/", icon: IconHome, color: "text-foreground" },
} as const;

export type PageKey = keyof typeof PAGES;

/** The page at `pathname`, or null (e.g. a 404) */
export function pageAt(pathname: string): PageKey | null {
  return (Object.keys(PAGES) as PageKey[]).find((key) => PAGES[key].href === pathname) ?? null;
}
