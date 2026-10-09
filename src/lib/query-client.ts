import {
  QueryClient,
  defaultShouldDehydrateQuery,
  isServer,
} from "@tanstack/react-query";
import { cache } from "react";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, set a staleTime above 0 to avoid refetching immediately on the client
        staleTime: 60 * 1000,
      },
      dehydrate: {
        // Also dehydrate pending queries so they can be streamed from Server Components
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

// Server: one query client per request, shared by generateMetadata and the
// page, so a query they both need runs once
const getRequestQueryClient = cache(makeQueryClient);

export function getQueryClient() {
  if (isServer) return getRequestQueryClient();
  // Browser: reuse the client so it isn't recreated if React suspends during the initial render
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}
