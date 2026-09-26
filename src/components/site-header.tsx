import Link from "next/link";
import { useTranslations } from "next-intl";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeSwitcher } from "@/components/theme-switcher";

/** Shared header on every page (rendered by the root layout) */
export function SiteHeader() {
  const t = useTranslations("Site");

  return (
    <header className="flex items-center justify-between gap-4">
      <div>
        {/* Not an <h1>: each page brings its own heading */}
        <Link href="/" className="font-medium">
          {t("name")}
        </Link>
        <p className="text-muted-foreground">{t("role")}</p>
      </div>
      <div className="flex items-center gap-1">
        <LocaleSwitcher />
        <ThemeSwitcher />
      </div>
    </header>
  );
}
