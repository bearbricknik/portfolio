import { create } from "zustand";

import type { Locale } from "@/i18n/config";

/**
 * Pages whose address depends on the language (e.g. a blog post with a slug
 * per language) register their address in each language here, so the
 * language switch can go straight to it instead of reloading the old one.
 */
type LocaleAlternatesStore = {
  paths: Partial<Record<Locale, string>> | null;
  setPaths: (paths: Partial<Record<Locale, string>> | null) => void;
};

export const useLocaleAlternatesStore = create<LocaleAlternatesStore>()((set) => ({
  paths: null,
  setPaths: (paths) => set({ paths }),
}));
