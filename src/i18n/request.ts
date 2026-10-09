import { locale as rootLocale } from "next/root-params";
import { getRequestConfig } from "next-intl/server";

import { defaultLocale, isLocale, type Locale } from "./config";

/**
 * The language comes from the internal [locale] segment the proxy rewrites
 * every address to (src/proxy.ts), never from cookies or headers here: that
 * keeps every page prerendered. Outside the site's pages (route handlers,
 * the sitemap) the root param doesn't exist; there the caller passes the
 * locale (`getTranslations({ locale })`) or the default applies.
 */
async function pageLocale(): Promise<Locale | undefined> {
  try {
    const value = await rootLocale();
    return isLocale(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

async function explicitLocale(requestLocale: Promise<string | undefined>): Promise<Locale> {
  const requested = await requestLocale;
  return isLocale(requested) ? requested : defaultLocale;
}

export default getRequestConfig(async ({ requestLocale }) => {
  // `requestLocale` is only read without a root param: next-intl falls back to
  // request headers there, which would make the page dynamic
  const locale = (await pageLocale()) ?? (await explicitLocale(requestLocale));

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
