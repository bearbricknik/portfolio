import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";

import { AboutIntro } from "@/components/about-intro";
import { PolaroidFan } from "@/components/polaroid-fan";
import golf1 from "@/assets/photos/golf/golf-1.jpg";
import golf2 from "@/assets/photos/golf/golf-2.jpg";
import golf3 from "@/assets/photos/golf/golf-3.jpg";
import golf4 from "@/assets/photos/golf/golf-4.jpg";
import golf5 from "@/assets/photos/golf/golf-5.jpg";
import golf6 from "@/assets/photos/golf/golf-6.jpg";
import { PageJsonLd } from "@/components/page-json-ld";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({ namespace: "AboutPage", path: "/about-me" });
}

// When the page was rendered: the age counter starts here on the server and in
// the browser alike (no hydration mismatch), and its first tick rolls the
// numbers on to the current time. The prerendered page is renewed daily.
async function renderTime() {
  "use cache";
  cacheLife("days");
  return Date.now();
}

// The story streams up to the golf paragraph, then the golf photos are dealt
// in, then the last paragraph streams on (each waits for the one before)
const INTRO_ID = "about-intro";
const FAN_ID = "about-golf-fan";
// Head start for the photos before the last paragraph streams (ms): the six
// cards are dealt 80ms apart (PolaroidFan), so it begins as the last one
// settles and photos and text flow into each other
const AFTER_FAN_DELAY = 700;

// Static imports: content-hashed URLs (cached immutably), known sizes and a blur placeholder
// Order matches `AboutPage.golfPhotos` in the messages (the photo of me sits in the middle)
const GOLF_PHOTOS = [golf2, golf3, golf1, golf4, golf5, golf6];

export default async function AboutMe() {
  const [t, locale] = await Promise.all([getTranslations("AboutPage"), getLocale()]);

  return (
    <section className="flex flex-col gap-6">
      <h1 className="sr-only">{t("title")}</h1>
      <PageJsonLd namespace="AboutPage" path="/about-me" type="ProfilePage" />

      {/* Server render time: the age counter starts from the same moment (no hydration mismatch) */}
      <AboutIntro id={INTRO_ID} withAge story={["p1", "p2", "p3"]} renderedAt={await renderTime()} />

      {/* Golf photos right below the golf paragraph, dealt in once it has streamed */}
      <PolaroidFan
        blurSurroundings
        after={`${INTRO_ID}-${locale}`}
        revealId={FAN_ID}
        photos={GOLF_PHOTOS.map((src, index) => ({
          src,
          ...(t.raw("golfPhotos") as { alt: string; title: string }[])[index],
        }))}
      />

      <AboutIntro id="about-outro" story={["p4"]} after={FAN_ID} delay={AFTER_FAN_DELAY} />
    </section>
  );
}
