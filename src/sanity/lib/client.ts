import { createClient } from "next-sanity";

import { apiVersion, dataset, projectId } from "@/sanity/env";

/** Reads published content (cached by Sanity's CDN) */
export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
});
