import { createClient } from "next-sanity";

import { apiVersion, dataset, projectId } from "@/sanity/env";

/**
 * Reads published content. No Sanity CDN: Next.js caches the results itself
 * and clears them when content changes (webhook); the CDN could still hand
 * out the old version right after a change and put it back in the cache.
 */
export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
});
