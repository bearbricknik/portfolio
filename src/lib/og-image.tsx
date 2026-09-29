import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

import { OpenGraphImage } from "@/components/og-image";
import type { Locale } from "@/i18n/config";
import { siteConfig } from "@/lib/site";
import de from "../../messages/de.json";
import en from "../../messages/en.json";

const MESSAGES = { de, en } satisfies Record<Locale, unknown>;

export const OG_IMAGE_SIZE = { width: siteConfig.ogImage.width, height: siteConfig.ogImage.height };

// Committed to the repo (not read from node_modules), so the files are always available
const fontDir = join(process.cwd(), "src/assets/fonts");

/**
 * The site's Open Graph image in one language, rendered by the /og/[locale]
 * route. That's the template: `pnpm og:export` saves it as the static files in
 * src/assets/og, which metadata and pages use (see lib/og-images.ts). Texts
 * come straight from the messages, so it renders without a request.
 */
export async function renderOgImage(locale: Locale) {
  const messages = MESSAGES[locale];
  const [regular, medium] = await Promise.all([
    readFile(join(fontDir, "Geist-Regular.ttf")),
    readFile(join(fontDir, "Geist-Medium.ttf")),
  ]);

  return new ImageResponse(
    (
      <OpenGraphImage
        title={messages.Metadata.siteName}
        description={messages.Metadata.description}
        domain={siteConfig.productionHost}
      />
    ),
    {
      ...OG_IMAGE_SIZE,
      fonts: [
        { name: "Geist", data: regular, style: "normal", weight: 400 },
        { name: "Geist", data: medium, style: "normal", weight: 500 },
      ],
    },
  );
}
