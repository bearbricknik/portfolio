import Link from "next/link";
import { useTranslations } from "next-intl";

/**
 * Shared header on every page (rendered by the root layout). Language and
 * theme controls live in the top right corner of the layout instead.
 */
export function SiteHeader() {
  const t = useTranslations("Site");

  return (
    <header>
      {/* Not an <h1>: each page brings its own heading */}
      <Link href="/" className="font-medium">
        {t("name")}
      </Link>
      <p className="text-muted-foreground">{t("role")}</p>
    </header>
  );
}
