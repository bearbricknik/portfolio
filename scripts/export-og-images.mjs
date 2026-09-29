/*
 * Exports the Open Graph image in every language as a static PNG
 * (src/assets/og/og-<locale>.png), rendered by the /og/[locale] route.
 * Static files get dimensions and a blur placeholder like every other image,
 * and metadata uses them too. Re-run after changing the OG layout or the
 * `Metadata` texts:
 *
 *   pnpm dev          (in another terminal)
 *   pnpm og:export
 */
import { writeFile } from "node:fs/promises";

const BASE = process.env.OG_BASE_URL ?? "http://localhost:3000";
const LOCALES = ["de", "en"];

for (const locale of LOCALES) {
  const response = await fetch(`${BASE}/og/${locale}`);
  if (!response.ok) throw new Error(`/og/${locale}: ${response.status} (is the dev server running?)`);
  const file = new URL(`../src/assets/og/og-${locale}.png`, import.meta.url);
  await writeFile(file, Buffer.from(await response.arrayBuffer()));
  console.log(`✓ ${file.pathname}`);
}
