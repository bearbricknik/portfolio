import { queryOptions } from "@tanstack/react-query";

import type { ContributionCalendar } from "@/lib/github/types";

/*
 * The contribution calendar through TanStack Query. The tokens stay on the
 * server: a page prefetches with the server function (same key, see
 * prefetchContributions), the browser only ever asks the site's own route,
 * which returns the combined dates and counts.
 */

export const githubKeys = {
  all: ["github"] as const,
  contributions: () => [...githubKeys.all, "contributions"] as const,
};

// Matches the server's cache: no point asking more often
const STALE_TIME = 60 * 60 * 1000;

/** For client components (useSuspenseQuery / useQuery) */
export const contributionsOptions = () =>
  queryOptions({
    queryKey: githubKeys.contributions(),
    queryFn: async (): Promise<ContributionCalendar> => {
      const response = await fetch("/api/github/contributions");
      if (!response.ok) throw new Error(`Contributions unavailable (${response.status})`);
      return response.json();
    },
    staleTime: STALE_TIME,
  });
