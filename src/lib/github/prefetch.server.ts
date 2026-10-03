import "server-only";

import type { QueryClient } from "@tanstack/react-query";

import { getContributions } from "@/lib/github/contributions.server";
import { contributionsOptions } from "@/lib/github/queries";

/**
 * Server-side prefetch of the contribution calendar: same key as the client
 * options, but reads GitHub directly (with the tokens). Put the page under a
 * HydrationBoundary and client components read it without a request.
 */
export function prefetchContributions(queryClient: QueryClient) {
  return queryClient.prefetchQuery({ ...contributionsOptions(), queryFn: getContributions });
}
