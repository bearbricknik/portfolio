import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";

import { OpenGraphImage } from "@/components/og-image";
import { defaultLocale } from "@/i18n/config";
import { siteConfig } from "@/lib/site";
import messages from "../../messages/de.json";

// Must be a static value, so it comes straight from the default-locale messages
export const alt = messages.Metadata.title;
export const size = { width: siteConfig.ogImage.width, height: siteConfig.ogImage.height };
export const contentType = siteConfig.ogImage.type;

const fontDir = join(process.cwd(), "node_modules/geist/dist/fonts/geist-sans");

export default async function Image() {
  // Explicit locale: no cookies/headers, so the image is generated once at build time
  const t = await getTranslations({ locale: defaultLocale, namespace: "Metadata" });
  const [regular, medium] = await Promise.all([
    readFile(join(fontDir, "Geist-Regular.ttf")),
    readFile(join(fontDir, "Geist-Medium.ttf")),
  ]);

  return new ImageResponse(
    (
      <OpenGraphImage
        title={t("title")}
        description={t("description")}
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
