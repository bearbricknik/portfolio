import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PageHeading } from "@/components/page-heading";
import { PageJsonLd } from "@/components/page-json-ld";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({ namespace: "BlogPage", path: "/blog" });
}

export default async function Blog() {
  const t = await getTranslations("BlogPage");

  return (
    <section className="flex flex-col gap-6">
      <h1 className="sr-only">{t("title")}</h1>
      <PageJsonLd namespace="BlogPage" path="/blog" />
      <PageHeading page="blog" />
      <p className="text-muted-foreground">{t("comingSoon")}</p>
    </section>
  );
}
