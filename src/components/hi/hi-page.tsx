import type { ReactNode } from "react";
import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";

import amalfi from "@/assets/photos/hi/amalfi.jpg";
import dominik from "@/assets/photos/hi/dominik.png";
import tokyo from "@/assets/photos/hi/tokyo.jpg";
import { BoardingPass } from "@/components/hi/boarding-pass";
import { HiStateProvider } from "@/components/hi/hi-state";
import { PhotoMatch } from "@/components/hi/photo-match";
import { PlusCounter, PlusPoint, PlusTotal } from "@/components/hi/plus-points";
import { TripChoice } from "@/components/hi/trip-choice";
import { PageIntro } from "@/components/page-intro";
import { InstantReveal } from "@/components/scroll-reveal";
import { SectionHeading } from "@/components/section-heading";
import type { Locale } from "@/i18n/config";
import { getAge } from "@/lib/age";
import { HI_PATH } from "@/lib/hi";
import { ogLocales } from "@/lib/metadata";
import { ogImageMetadata } from "@/lib/og-images";

/** ICU arguments for the optional name ("Hey Lena," / "Hey du,") */
const nameArgs = (name: string | null) => ({ name: name ?? "", hasName: name ? "yes" : "no" });

// Age in the text; the prerendered page is renewed daily, like /about-me
async function currentYears() {
  "use cache";
  cacheLife("days");
  return getAge(new Date()).years;
}

/** Not for search engines: the page is only meant for the people it's shared with */
export async function hiMetadata(name: string | null): Promise<Metadata> {
  const [t, tSite, locale] = await Promise.all([
    getTranslations("HiPage"),
    getTranslations("Metadata"),
    getLocale(),
  ]);
  const title = t("metaTitle", nameArgs(name));
  const description = t("metaDescription");
  const image = ogImageMetadata(locale as Locale, tSite("title"));

  return {
    title,
    description,
    robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
    openGraph: {
      type: "website",
      url: name ? `${HI_PATH}/${encodeURIComponent(name.toLowerCase())}` : HI_PATH,
      siteName: tSite("siteName"),
      title,
      description,
      locale: ogLocales[locale as Locale],
      images: [image],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

/**
 * A short story for a first date, to share on dating apps: a hook, a bit
 * about me, a photo experiment (do we look good together?), a trip to choose
 * and a boarding pass to check in with.
 * Plus points are collected along the way and counted at the bottom.
 */
export async function HiPage({ name }: { name: string | null }) {
  const [t, years] = await Promise.all([getTranslations("HiPage"), currentYears()]);

  const rich = {
    plus: (chunks: ReactNode) => <PlusPoint>{chunks}</PlusPoint>,
    total: () => <PlusTotal />,
  };
  // One label per contact channel from `pass.<group>.<channel>`
  const channelLabels = (group: "channels" | "placeholders" | "invalid") => ({
    whatsapp: t(`pass.${group}.whatsapp`),
    instagram: t(`pass.${group}.instagram`),
    email: t(`pass.${group}.email`),
  });

  return (
    // No streaming or entrance animations here: everything is there at once
    <InstantReveal>
      <HiStateProvider name={name}>
        <section className="flex flex-col gap-4 pb-16">
          <h1 className="sr-only">{t("title")}</h1>

          <PageIntro id="hi-intro" content={t.rich("intro", { ...nameArgs(name), ...rich })} />

          <SectionHeading className="mt-6">{t("aboutHeading")}</SectionHeading>
          <PageIntro id="hi-about" content={t.rich("about", { years, ...rich })} />

          <SectionHeading className="mt-6">{t("matchHeading")}</SectionHeading>
          <PageIntro id="hi-match" content={t.rich("match", rich)} />
          <PhotoMatch
            photo={dominik}
            labels={{
              me: t("matchPhoto.me"),
              meAlt: t("matchPhoto.meAlt"),
              you: t("matchPhoto.you"),
              pick: t("matchPhoto.pick"),
              change: t("matchPhoto.change"),
              youAlt: t("matchPhoto.youAlt"),
              matched: t("matchPhoto.matched"),
              privacy: t("matchPhoto.privacy"),
            }}
          />

          <SectionHeading className="mt-2">{t("moreHeading")}</SectionHeading>
          <PageIntro id="hi-about-more" content={t.rich("aboutMore", rich)} />

          <SectionHeading className="mt-6">{t("tripHeading")}</SectionHeading>
          <PageIntro id="hi-trip" content={t.rich("trip", rich)} />
          <TripChoice
            hint={t("tripHint")}
            picked={t("tripPicked")}
            options={[
              { key: "tokyo", src: tokyo, label: t("trips.tokyo.label"), alt: t("trips.tokyo.alt") },
              { key: "amalfi", src: amalfi, label: t("trips.amalfi.label"), alt: t("trips.amalfi.alt") },
            ]}
          />

          <SectionHeading className="mt-2">{t("dateHeading")}</SectionHeading>
          <PageIntro id="hi-date" content={t.rich("date", rich)} />
          <BoardingPass
            labels={{
              title: t("pass.title"),
              subtitle: t("pass.subtitle"),
              origin: t("pass.origin"),
              passenger: t("pass.passenger"),
              namePlaceholder: t("pass.namePlaceholder"),
              nameInvalid: t("pass.nameInvalid"),
              surprise: t("pass.surprise"),
              trips: { tokyo: t("trips.tokyo.label"), amalfi: t("trips.amalfi.label") },
              seat: t("pass.seat"),
              seatValue: t("pass.seatValue"),
              luggage: t("pass.luggage"),
              luggageValue: t("pass.luggageValue"),
              contact: t("pass.contact"),
              channels: channelLabels("channels"),
              placeholders: channelLabels("placeholders"),
              invalid: channelLabels("invalid"),
              privacy: t("pass.privacy"),
              submit: t("pass.submit"),
              sending: t("pass.sending"),
              checkedIn: t("pass.checkedIn"),
              // Raw: {channel} and {contact} are only known in the browser, the pass fills them in
              checkedInText: t.raw("pass.checkedInText") as string,
              secrets: (["date", "place", "dress"] as const).map((key) => ({
                label: t(`pass.secrets.${key}.label`),
                value: t(`pass.secrets.${key}.value`),
              })),
              done: t("pass.done"),
              error: t("pass.error"),
            }}
          />
        </section>

        <PlusCounter one={t("points.one")} other={t("points.other")} />
      </HiStateProvider>
    </InstantReveal>
  );
}
