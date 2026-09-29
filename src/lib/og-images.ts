import type { StaticImageData } from "next/image";

import ogDe from "@/assets/og/og-de.png";
import ogEn from "@/assets/og/og-en.png";
import type { Locale } from "@/i18n/config";

/**
 * The site's Open Graph image per language, as static files (exported from
 * the /og/[locale] route with `pnpm og:export`). Static imports come with
 * their dimensions and a blur placeholder, like every other image; metadata
 * (og:image, twitter:image, JSON-LD) and the page itself use them.
 */
export const OG_IMAGES: Record<Locale, StaticImageData> = { de: ogDe, en: ogEn };

/** og:image / twitter:image entry for a language */
export const ogImageMetadata = (locale: Locale, alt: string) => {
  const image = OG_IMAGES[locale];
  return { url: image.src, width: image.width, height: image.height, type: "image/png", alt };
};
