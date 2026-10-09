import { IconBrackets2, IconReact, IconStorage, IconTypescript, IconVercel } from "@central-icons-react/round-outlined-radius-3-stroke-1.5";
import type { ReactNode } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getLocale, getTranslations } from "next-intl/server";

import { ContributionGraph } from "@/components/contribution-graph";
import { contactBadges } from "@/components/contact-badges";
import { Badge } from "@/components/inline-badge";
import { PageIntro } from "@/components/page-intro";
import { GITHUB_TAG } from "@/lib/github/contributions.server";
import { prefetchContributions } from "@/lib/github/prefetch.server";
import { makeQueryClient } from "@/lib/query-client";

// The intro streams first, then the commit calendar fades in, then the rest of
// the text streams on (each waits for the one before)
const INTRO_ID = "home-intro";
// Head start for the calendar before the next paragraph streams (ms): the text
// begins while the calendar is still fading in and its squares fill in
// alongside, so there's no idle moment between the two
const AFTER_GRAPH_DELAY = 300;
const AFTER_GRAPH_ID = "home-after-graph";

export default async function Home() {
  const [t, tSite, tContact, locale] = await Promise.all([
    getTranslations("HomePage"),
    getTranslations("Site"),
    getTranslations("Contact"),
    getLocale(),
  ]);

  // Inline badges in the bio, shared by both parts of it
  const badges = {
    next: (chunks: ReactNode) => (
      <Badge icon={IconVercel} color="text-foreground">
        {chunks}
      </Badge>
    ),
    react: (chunks: ReactNode) => (
      <Badge icon={IconReact} color="text-cyan-500">
        {chunks}
      </Badge>
    ),
    ts: (chunks: ReactNode) => (
      <Badge icon={IconTypescript} color="text-blue-600">
        {chunks}
      </Badge>
    ),
    go: (chunks: ReactNode) => (
      <Badge icon={IconBrackets2} color="text-sky-500">
        {chunks}
      </Badge>
    ),
    postgres: (chunks: ReactNode) => (
      <Badge icon={IconStorage} color="text-indigo-500">
        {chunks}
      </Badge>
    ),
  };

  return (
    <section className="flex flex-col gap-6">
      {/* Page heading for screen readers and SEO; the visible name sits in the shared header */}
      <h1 className="sr-only">
        {tSite("name")} | {tSite("role")}
      </h1>

      {/* Streams in once the intro overlay is gone; "\n\n" in the message starts a new paragraph */}
      <PageIntro id={INTRO_ID} content={t.rich("bio", badges)} />

      <ContributionData>
        <ContributionGraph after={`${INTRO_ID}-${locale}`} />
      </ContributionData>

      {/* Text after text: the paragraph spacing (gap-4), not the section's */}
      <div className="flex flex-col gap-4">
        <PageIntro
          id={AFTER_GRAPH_ID}
          content={t.rich("bioAfterGraph", badges)}
          after={INTRO_ID}
          delay={AFTER_GRAPH_DELAY}
        />

        {/* How to reach me, last (the same paragraph as on /locations) */}
        <PageIntro id="home-contact" content={tContact.rich("text", contactBadges)} after={AFTER_GRAPH_ID} />
      </div>
    </section>
  );
}

/**
 * The calendar's data, prerendered into the page (GitHub is read on the
 * server, the tokens never leave it; cached hourly, see
 * contributions.server.ts). If GitHub fails, the calendar asks the site's
 * own API route in the browser instead, or stays hidden.
 */
async function ContributionData({ children }: { children: ReactNode }) {
  "use cache";
  cacheLife("hours");
  cacheTag(GITHUB_TAG);

  const queryClient = makeQueryClient();
  await prefetchContributions(queryClient);
  return <HydrationBoundary state={dehydrate(queryClient)}>{children}</HydrationBoundary>;
}
