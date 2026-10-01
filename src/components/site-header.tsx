import Link from "next/link";
import { useTranslations } from "next-intl";

import { HandwrittenNote } from "@/components/handwritten-note";
import { SiteNav } from "@/components/site-nav";

/**
 * Shared header on every page (rendered by the root layout): name, role and
 * the navigation. Language and theme controls live in the top right corner of
 * the layout instead.
 */
export function SiteHeader() {
  const t = useTranslations("Site");

  return (
    // relative: the navigation opens below it, right-aligned
    <header className="relative flex items-start justify-between gap-4">
      <div>
        {/* Not an <h1>: each page brings its own heading */}
        {/* relative: the note hangs off to the left of the name */}
        <span className="relative inline-block">
          {/* Handwritten "open for work" in the left margin, its arrow pointing
              at the name; only from lg on, where the margin is wide enough */}
          <HandwrittenNote
            arrow="right"
            arrowPosition="below"
            waitForStreams
            delay={1}
            tilt={-4}
            // Half-size arrow, tucked up under the text; its tip sits ~5px above the
            // note's bottom, so bottom-2 puts it on the middle of the name's 26px line
            arrowClassName="-mt-1 h-6 w-8 translate-x-1"
            className="pointer-events-none absolute right-full bottom-2 mr-1 hidden whitespace-nowrap lg:inline-flex"
          >
            {t("openForWork")}
          </HandwrittenNote>
          {/* The name itself is the label: show the pointing hand, no bubble */}
          <Link href="/" data-cursor="pointer" className="font-medium">
            {t("name")}
          </Link>
        </span>
        <p className="text-muted-foreground">{t("role")}</p>
      </div>
      <SiteNav />
    </header>
  );
}
