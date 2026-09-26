import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import {
  defaultLocale,
  GERMAN_SPEAKING_COUNTRIES,
  isLocale,
  LOCALE_COOKIE,
  type Locale,
} from "./config";

/**
 * Best supported language from the Accept-Language header, honoring the
 * q-weights, e.g. "fr-FR,fr;q=0.9,de;q=0.8,en;q=0.5" → "de".
 */
function negotiateLocale(acceptLanguage: string | null): Locale | undefined {
  return acceptLanguage
    ?.split(",")
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((param) => param.trim().startsWith("q="));
      return {
        language: tag.trim().slice(0, 2).toLowerCase(),
        weight: q ? Number.parseFloat(q.trim().slice(2)) || 0 : 1,
        index,
      };
    })
    .filter(({ weight }) => weight > 0)
    // Higher weight first; equal weights keep the header order
    .sort((a, b) => b.weight - a.weight || a.index - b.index)
    .map(({ language }) => language)
    .find(isLocale);
}

/** Language from the visitor's country (Vercel geo header), used only as a fallback */
function localeFromCountry(country: string | null): Locale | undefined {
  if (!country) return undefined;
  return GERMAN_SPEAKING_COUNTRIES.includes(country.toUpperCase()) ? "de" : "en";
}

/**
 * Locale resolution (no /[locale] routes, see config.ts):
 * 1. NEXT_LOCALE cookie — the visitor's own choice via the switcher
 * 2. Accept-Language — the browser language, a deliberate user setting
 * 3. Country (x-vercel-ip-country) — rough guess, e.g. for crawlers
 * 4. defaultLocale
 */
export default getRequestConfig(async () => {
  const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value;
  const requestHeaders = await headers();

  const locale = isLocale(cookieLocale)
    ? cookieLocale
    : (negotiateLocale(requestHeaders.get("accept-language")) ??
      localeFromCountry(requestHeaders.get("x-vercel-ip-country")) ??
      defaultLocale);

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
