import { useLocale, useTranslations } from "next-intl";

import { JsonLd } from "@/components/json-ld";
import { pageGraph } from "@/lib/structured-data";

type PageJsonLdProps = {
  /** Messages namespace with `title` and `description` */
  namespace: "AboutPage" | "CvPage" | "LocationsPage" | "BlogPage" | "TechStackPage";
  path: `/${string}`;
  type?: Parameters<typeof pageGraph>[0]["type"];
  extra?: Record<string, unknown>;
};

/** A subpage's structured data: WebPage (about the person) + breadcrumb */
export function PageJsonLd({ namespace, path, type, extra }: PageJsonLdProps) {
  const t = useTranslations(namespace);
  const tPages = useTranslations("Nav.pages");
  const locale = useLocale();

  return (
    <JsonLd
      data={pageGraph({
        path,
        name: t("title"),
        description: t("description"),
        locale,
        homeName: tPages("home"),
        type,
        extra,
      })}
    />
  );
}
