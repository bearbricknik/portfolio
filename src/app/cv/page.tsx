import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PageHeading } from "@/components/page-heading";
import { PageJsonLd } from "@/components/page-json-ld";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({ namespace: "CvPage", path: "/cv" });
}

export default async function CV() {
  const t = await getTranslations("CvPage");

  return (
    <section className="flex flex-col gap-6">
      <h1 className="sr-only">{t("title")}</h1>
      <PageJsonLd namespace="CvPage" path="/cv" />
      <PageHeading page="cv" />
      <p className="text-muted-foreground">{t("comingSoon")}</p>
    </section>
  );
}
