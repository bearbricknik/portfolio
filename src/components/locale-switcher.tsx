"use client";

import { useEffect, useRef, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { LOCALE_COOKIE } from "@/i18n/config";
import { HI_DEFAULT_LOCALE, HI_LOCALE_PARAM, isHiPath } from "@/lib/hi";
import { cn } from "@/lib/utils";
import { useLocaleAlternatesStore } from "@/stores/locale-alternates-store";

// The proxy reads this cookie and serves the prerendered page in that language
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function LocaleSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const t = useTranslations("Controls");
  const router = useRouter();
  const pathname = usePathname();
  const alternates = useLocaleAlternatesStore((state) => state.paths);
  const [isPending, startTransition] = useTransition();
  // The address we're switching to, until we've arrived there
  const arriving = useRef<string | null>(null);

  // Shows the language you switch to
  const target = locale === "de" ? "en" : "de";
  const alternatePath = alternates?.[target];

  // Arrived at the other language's address: the page is already in the new
  // language; refresh the shared layout (header, footer, this switch) too.
  // A refresh updates it in place, nothing remounts (no intro, no flash).
  useEffect(() => {
    if (arriving.current !== pathname) return;
    arriving.current = null;
    startTransition(() => router.refresh());
  }, [pathname, router]);

  const switchLocale = () => {
    // /hi has its own rule (always German unless ?lang=en, see lib/hi.ts): the
    // language lives in the address there, the site-wide cookie stays untouched
    if (isHiPath(pathname)) {
      const href = target === HI_DEFAULT_LOCALE ? pathname : `${pathname}?${HI_LOCALE_PARAM}=${target}`;
      startTransition(() => {
        router.replace(href, { scroll: false });
        // The shared layout (header, footer, this switch) follows the new language too
        router.refresh();
      });
      return;
    }
    document.cookie = `${LOCALE_COOKIE}=${target}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
    if (!alternatePath || alternatePath === pathname) {
      // Same address in both languages (also a post without a translation of
      // its address): fetch the current route again; with the new cookie the
      // proxy serves the other language's version (and the router's cache of
      // the old language is dropped)
      startTransition(() => router.refresh());
      return;
    }
    // The page has its own address in the other language (e.g. a post): go
    // there. The navigation is a transition: the old post stays until the new
    // one is ready, which then fades in (no blank page).
    arriving.current = alternatePath;
    startTransition(() => router.replace(alternatePath, { scroll: false }));
  };

  return (
    <button
      type="button"
      aria-label={t("switchLocale")}
      disabled={isPending}
      onClick={switchLocale}
      className={cn(
        "inline-flex h-7 items-center justify-center rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50",
        className,
      )}
    >
      {target.toUpperCase()}
    </button>
  );
}
