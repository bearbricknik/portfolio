import Link from "next/link";
import { useTranslations } from "next-intl";

import { SiteNav } from "@/components/site-nav";

/**
 * Shared header on every page (rendered by the root layout): name, role and
 * the navigation. Language and theme controls live in the top right corner of
 * the layout instead.
 */
export function SiteHeader() {
  const t = useTranslations("Site");

  return (
    // relative: the navigation opens below it, right-aligned
    <header className="relative flex items-start justify-between gap-4">
      <div>
        {/* Not an <h1>: each page brings its own heading */}
        <Link href="/" className="font-medium">
          {t("name")}
        </Link>
        <p className="text-muted-foreground">{t("role")}</p>
      </div>
      <SiteNav />
    </header>
  );
}
