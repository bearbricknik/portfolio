export const locales = ["de", "en"] as const;
export type Locale = (typeof locales)[number];

// Last fallback (no cookie, no usable browser language, unknown region):
// English, since the portfolio is read internationally
export const defaultLocale: Locale = "en";

// Visitors from these countries get German when their browser language doesn't decide
export const GERMAN_SPEAKING_COUNTRIES = ["DE", "AT", "CH", "LI"];

// Locale is stored in a cookie instead of the URL (no /[locale] segment)
export const LOCALE_COOKIE = "NEXT_LOCALE";

export function isLocale(value: string | undefined): value is Locale {
  return locales.includes(value as Locale);
}
