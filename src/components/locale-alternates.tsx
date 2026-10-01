"use client";

import { useEffect } from "react";

import type { Locale } from "@/i18n/config";
import { useLocaleAlternatesStore } from "@/stores/locale-alternates-store";

/**
 * Tells the language switch where this page lives in each language (e.g.
 * /blog/<slug-de> and /blog/<slug-en>). Renders nothing.
 */
export function LocaleAlternates({ paths }: { paths: Partial<Record<Locale, string>> }) {
  const setPaths = useLocaleAlternatesStore((state) => state.setPaths);
  const key = JSON.stringify(paths);

  useEffect(() => {
    setPaths(JSON.parse(key));
    return () => setPaths(null);
  }, [key, setPaths]);

  return null;
}
