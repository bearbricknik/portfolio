import { type Locale, locales } from "@/i18n/config";

/** The site's languages, for the Studio's translated fields (same list as the app) */
const LANGUAGE_TITLES: Record<Locale, string> = { de: "Deutsch", en: "English" };

export const SANITY_LANGUAGES = locales.map((id) => ({ id, title: LANGUAGE_TITLES[id] }));

/** Content is written in German first; English falls back to it until translated */
export const PRIMARY_LANGUAGE: Locale = "de";

type TranslatedValue = { language?: string; value?: unknown }[] | undefined;

/** Validation: a translated field needs at least the primary language */
export const requirePrimaryLanguage = (value: TranslatedValue) =>
  value?.some((item) => item.language === PRIMARY_LANGUAGE && item.value)
    ? true
    : `${LANGUAGE_TITLES[PRIMARY_LANGUAGE]} fehlt`;
