/*
 * Sanity connection, from the environment. Project ID and dataset are public
 * (they're in every request the browser makes), so NEXT_PUBLIC_ is fine.
 */
function required(value: string | undefined, name: string) {
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export const projectId = required(process.env.NEXT_PUBLIC_SANITY_PROJECT_ID, "NEXT_PUBLIC_SANITY_PROJECT_ID");
export const dataset = required(process.env.NEXT_PUBLIC_SANITY_DATASET, "NEXT_PUBLIC_SANITY_DATASET");

// Pinned API version (the date it was set up); bump it on purpose, never use "today"
export const apiVersion = "2026-10-01";

/** Where the Studio lives inside the site */
export const studioBasePath = "/studio";
