"use client";

/*
 * The Sanity Studio, embedded in the site at /studio
 * (src/app/(studio)/studio/[[...tool]]/page.tsx).
 */
import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";

import { apiVersion, dataset, projectId, studioBasePath } from "@/sanity/env";
import { schemaTypes } from "@/sanity/schema-types";

export default defineConfig({
  name: "portfolio",
  title: "huberdominik.com",
  basePath: studioBasePath,
  projectId,
  dataset,
  schema: { types: schemaTypes },
  plugins: [
    structureTool(),
    // GROQ playground, to try queries against the dataset
    visionTool({ defaultApiVersion: apiVersion }),
  ],
});
