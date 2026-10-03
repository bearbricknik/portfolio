import {
  IconChart1,
  IconCodeBrackets,
  IconGraduateCap,
  IconJavascript,
  IconLinkedin,
  IconPuzzle,
  IconReact,
  IconServer,
  IconTypescript,
  IconVercel,
} from "@central-icons-react/round-outlined-radius-3-stroke-1.5";
import type { ReactNode } from "react";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getLocale, getTranslations } from "next-intl/server";

import { ContributionGraph } from "@/components/contribution-graph";
import { Badge, ExternalBadge } from "@/components/inline-badge";
import { PageIntro } from "@/components/page-intro";
import { prefetchContributions } from "@/lib/github/prefetch.server";
import { getQueryClient } from "@/lib/query-client";
import { SOCIALS } from "@/lib/socials";

// The intro streams first, then the commit calendar fades in, then the rest of
// the text streams on (each waits for the one before)
const INTRO_ID = "home-intro";
// Time for the calendar to fade in before the next paragraph starts (ms)
const AFTER_GRAPH_DELAY = 700;

export default async function Home() {
  const [t, tSite, locale] = await Promise.all([
    getTranslations("HomePage"),
    getTranslations("Site"),
    getLocale(),
  ]);

  // The calendar's data is loaded on the server (the GitHub tokens never leave
  // it) but not awaited: the page doesn't wait for GitHub, the data streams in
  // with it (the calendar only appears after the intro anyway)
  const queryClient = getQueryClient();
  // Off while the calendar is commented out below (no data streamed for nothing)
  // void prefetchContributions(queryClient);

  // Inline badges in the bio, shared by both parts of it
  const badges = {
    uni: (chunks: ReactNode) => (
      <Badge icon={IconGraduateCap} color="text-indigo-500">
        {chunks}
      </Badge>
    ),
    extensions: (chunks: ReactNode) => (
      <Badge icon={IconPuzzle} color="text-violet-500">
        {chunks}
      </Badge>
    ),
    js: (chunks: ReactNode) => (
      <Badge icon={IconJavascript} color="text-yellow-500">
        {chunks}
      </Badge>
    ),
    python: (chunks: ReactNode) => (
      <Badge icon={IconCodeBrackets} color="text-sky-600">
        {chunks}
      </Badge>
    ),
    node: (chunks: ReactNode) => (
      <Badge icon={IconServer} color="text-green-600">
        {chunks}
      </Badge>
    ),
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
    profitpath: (chunks: ReactNode) => (
      <ExternalBadge
        href="https://profitpath.com/en"
        icon={IconChart1}
        color="text-emerald-500"
        cursorLabel="profitpath.com ↗"
      >
        {chunks}
      </ExternalBadge>
    ),
    linkedin: (chunks: ReactNode) => (
      <ExternalBadge
        href={SOCIALS.find((social) => social.key === "linkedin")!.href}
        icon={IconLinkedin}
        color="text-blue-700 dark:text-blue-400"
        cursorLabel="LinkedIn ↗"
      >
        {chunks}
      </ExternalBadge>
    ),
  };

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <section className="flex flex-col gap-6">
        {/* Page heading for screen readers and SEO; the visible name sits in the shared header */}
        <h1 className="sr-only">
          {tSite("name")} – {tSite("role")}
        </h1>

        {/* Streams in once the intro overlay is gone; "\n\n" in the message starts a new paragraph */}
        <PageIntro id={INTRO_ID} content={t.rich("bio", badges)} />

        {/*<ContributionGraph after={`${INTRO_ID}-${locale}`} />*/}

        <PageIntro
          id="home-after-graph"
          content={t.rich("bioAfterGraph", badges)}
          after={INTRO_ID}
          delay={AFTER_GRAPH_DELAY}
        />
      </section>
    </HydrationBoundary>
  );
}
