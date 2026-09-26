import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

import { OpenGraphImage } from "@/components/og-image";
import { siteConfig } from "@/lib/site";
import messages from "../../messages/en.json";

/*
 * Generated once at build time (static): no next-intl request APIs here, the
 * texts come straight from the default-locale (English) messages. Link-preview
 * crawlers send no locale cookie and rarely a German Accept-Language, so the
 * page they see is English too.
 */
export const alt = messages.Metadata.title;
export const size = { width: siteConfig.ogImage.width, height: siteConfig.ogImage.height };
export const contentType = siteConfig.ogImage.type;

// Committed to the repo (not read from node_modules), so the files are always available
const fontDir = join(process.cwd(), "src/assets/fonts");

export default async function Image() {
  const [regular, medium] = await Promise.all([
    readFile(join(fontDir, "Geist-Regular.ttf")),
    readFile(join(fontDir, "Geist-Medium.ttf")),
  ]);

  return new ImageResponse(
    (
      <OpenGraphImage
        title={messages.Metadata.siteName}
        description={messages.Metadata.description}
        domain={new URL(siteConfig.url).host}
      />
    ),
    {
      ...size,
      fonts: [
        { name: "Geist", data: regular, style: "normal", weight: 400 },
        { name: "Geist", data: medium, style: "normal", weight: 500 },
      ],
    },
  );
}
