"use client";

/*
 * The Sanity Studio, embedded in the site at /studio
 * (src/app/(studio)/studio/[[...tool]]/page.tsx).
 */
import { codeInput } from "@sanity/code-input";
import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { internationalizedArray } from "sanity-plugin-internationalized-array";
import { structureTool } from "sanity/structure";

import { apiVersion, dataset, projectId, studioBasePath } from "@/sanity/env";
import { PRIMARY_LANGUAGE, SANITY_LANGUAGES } from "@/sanity/languages";
import { schemaTypes } from "@/sanity/schema-types";
import { structure } from "@/sanity/structure";

export default defineConfig({
  name: "portfolio",
  title: "huberdominik.com",
  basePath: studioBasePath,
  projectId,
  dataset,
  schema: { types: schemaTypes },
  plugins: [
    structureTool({ structure }),
    // Translated fields: DE and EN side by side in one document
    internationalizedArray({
      languages: SANITY_LANGUAGES,
      defaultLanguages: [PRIMARY_LANGUAGE],
      fieldTypes: ["string", "text", "blockContent"],
    }),
    codeInput(),
    // GROQ playground, to try queries against the dataset
    visionTool({ defaultApiVersion: apiVersion }),
  ],
});
