import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PageHeading } from "@/components/page-heading";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("BlogPage");
  // Placeholder page: not indexed until it has content
  return { title: t("title"), alternates: { canonical: "/blog" }, robots: { index: false } };
}

export default async function Blog() {
  const t = await getTranslations("BlogPage");

  return (
    <section className="flex flex-col gap-6">
      <h1 className="sr-only">{t("title")}</h1>
      <PageHeading page="blog" />
      <p className="text-muted-foreground">{t("comingSoon")}</p>
    </section>
  );
}
