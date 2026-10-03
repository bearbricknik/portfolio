import { Fragment } from "react";
import type { Metadata } from "next";
import { IconApple, IconEarth, IconGolfBall } from "@central-icons-react/round-outlined-radius-3-stroke-1.5";
import { useTranslations } from "next-intl";

import { AgeIntro } from "@/components/age-intro";
import { Badge } from "@/components/inline-badge";
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

// Outside the component on purpose: reading the clock is a side effect. The
// page is rendered per request (cookie-based locale), so this is the request time.
const renderTime = () => Date.now();

// Paragraph keys in `AboutPage.story`, in reading order
const STORY = ["p1", "p2", "p3", "p4"] as const;

// Static imports: content-hashed URLs (cached immutably), known sizes and a blur placeholder
// Order matches `AboutPage.golfPhotos` in the messages (the photo of me sits in the middle)
const GOLF_PHOTOS = [golf2, golf3, golf1, golf4, golf5, golf6];

export default function AboutMe() {
  const t = useTranslations("AboutPage");

  return (
    // Hyphenated, like the bio on the home page
    <section className="flex flex-col gap-6 text-pretty hyphens-auto">
      <h1 className="sr-only">{t("title")}</h1>
      <PageJsonLd namespace="AboutPage" path="/about-me" type="ProfilePage" />
      <p>
        {/* Server render time: client starts from the same moment (no hydration mismatch) */}
        <AgeIntro renderedAt={renderTime()} /> {t("origin")}
      </p>
      {STORY.map((key) => (
        <Fragment key={key}>
          <p>
            {t.rich(`story.${key}`, {
              apple: (chunks) => (
                <Badge icon={IconApple} color="text-foreground">
                  {chunks}
                </Badge>
              ),
              golf: (chunks) => (
                <Badge icon={IconGolfBall} color="text-emerald-500">
                  {chunks}
                </Badge>
              ),
              latam: (chunks) => (
                <Badge icon={IconEarth} color="text-orange-500">
                  {chunks}
                </Badge>
              ),
            })}
          </p>
          {/* Golf photos right below the golf paragraph */}
          {key === "p3" && (
            <PolaroidFan
              blurSurroundings
              photos={GOLF_PHOTOS.map((src, index) => ({
                src,
                ...(t.raw("golfPhotos") as { alt: string; title: string }[])[index],
              }))}
            />
          )}
        </Fragment>
      ))}
    </section>
  );
}
