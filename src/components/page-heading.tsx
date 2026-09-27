import { useLocale, useTranslations } from "next-intl";

import { StreamingText } from "@/components/streaming-text";
import { INTRO_TIMING } from "@/lib/intro-timing";
import { PAGES, type PageKey } from "@/lib/pages";
import { cn } from "@/lib/utils";

type PageHeadingProps = {
  page: PageKey;
  /**
   * Stream the heading in like the intro text (pages that open with a
   * StreamingText); otherwise it's there right away
   */
  stream?: boolean;
};

/**
 * Small heading at the top of a page that says where you are: the page's icon
 * (same color as in the navigation) and its title. Put it first in the page.
 * Decorative for screen readers, since every page brings its own <h1>.
 */
export function PageHeading({ page, stream = false }: PageHeadingProps) {
  const t = useTranslations("Nav.pages");
  const locale = useLocale();
  const { icon: Icon, color } = PAGES[page];

  return (
    // -mb-3: closer to the text below than the page's usual gap-6.
    // Flex keeps the icon centered on the title with an exact gap; only the
    // title streams, the icon is there from the start.
    <div aria-hidden className="-mb-3 flex items-center gap-1 font-medium">
      <Icon className={cn("size-4 shrink-0", color)} />
      {stream ? (
        <StreamingText
          // Same as the intro streams: once per language until the next refresh
          key={locale}
          id={`page-heading-${page}-${locale}`}
          notBefore={INTRO_TIMING.streamStart}
          interval={30}
          content={t(page)}
        />
      ) : (
        <p>{t(page)}</p>
      )}
    </div>
  );
}
