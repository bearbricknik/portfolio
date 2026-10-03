import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { type Locale, locales } from "@/i18n/config";
import { ogImageMetadata } from "@/lib/og-images";

/** Open Graph locale codes per app locale */
export const ogLocales = { de: "de_DE", en: "en_US" } as const;

type PageMetadataOptions = {
  /** Messages namespace with `title` and `description`, e.g. "AboutPage" */
  namespace: "AboutPage" | "CvPage" | "LocationsPage" | "BlogPage" | "TechStackPage";
  path: `/${string}`;
  /** Placeholder pages: keep them out of search results until they have content */
  index?: boolean;
};

/**
 * Metadata for a subpage: its own title, description, canonical URL and
 * Open Graph / Twitter tags (which would otherwise repeat the home page's).
 * All pages share the static preview image (lib/og-images.ts), in their language.
 */
export async function pageMetadata({ namespace, path, index = true }: PageMetadataOptions): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations(namespace);
  const tSite = await getTranslations("Metadata");
  const title = t("title");
  const description = t("description");
  // The full title, as the layout's template renders it in <title>
  const fullTitle = `${title} | ${tSite("siteName")}`;
  // The shared preview image, in the page's language
  const image = ogImageMetadata(locale as Locale, tSite("title"));

  return {
    // Rendered as "<title> — Dominik Huber" via the title template in the layout
    title,
    description,
    alternates: { canonical: path },
    ...(!index && { robots: { index: false, follow: true } }),
    openGraph: {
      type: "website",
      url: path,
      siteName: tSite("siteName"),
      title: fullTitle,
      description,
      // Language comes from a cookie, not the URL: both locales share one URL
      locale: ogLocales[locale as keyof typeof ogLocales],
      alternateLocale: locales.filter((other) => other !== locale).map((other) => ogLocales[other]),
      images: [image],
    },
    twitter: { card: "summary_large_image", title: fullTitle, description, images: [image] },
  };
}
