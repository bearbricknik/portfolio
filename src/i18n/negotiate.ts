import {
  defaultLocale,
  GERMAN_SPEAKING_COUNTRIES,
  isLocale,
  type Locale,
} from "./config";

/*
 * Picking the visitor's language. Runs in the proxy (src/proxy.ts), which
 * rewrites every address to the prerendered page of that language, so the
 * pages themselves never read cookies or headers and stay static.
 */

/**
 * Best supported language from the Accept-Language header, honoring the
 * q-weights, e.g. "fr-FR,fr;q=0.9,de;q=0.8,en;q=0.5" → "de".
 */
export function negotiateLocale(acceptLanguage: string | null): Locale | undefined {
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
export function localeFromCountry(country: string | null): Locale | undefined {
  if (!country) return undefined;
  return GERMAN_SPEAKING_COUNTRIES.includes(country.toUpperCase()) ? "de" : "en";
}

/**
 * Locale resolution (no locale in the address, see config.ts):
 * 1. NEXT_LOCALE cookie — the visitor's own choice via the switcher
 * 2. Accept-Language — the browser language, a deliberate user setting
 * 3. Country (x-vercel-ip-country) — rough guess, e.g. for crawlers
 * 4. defaultLocale
 */
export function resolveLocale({
  cookie,
  acceptLanguage,
  country,
}: {
  cookie: string | undefined;
  acceptLanguage: string | null;
  country: string | null;
}): Locale {
  if (isLocale(cookie)) return cookie;
  return negotiateLocale(acceptLanguage) ?? localeFromCountry(country) ?? defaultLocale;
}
