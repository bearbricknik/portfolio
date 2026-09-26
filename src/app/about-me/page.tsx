import { Fragment } from "react";
import type { Metadata } from "next";
import { IconApple, IconEarth, IconGolfBall } from "@central-icons-react/round-outlined-radius-3-stroke-1.5";
import { getTranslations } from "next-intl/server";
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

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("AboutPage");
  // Rendered as "About me — Dominik Huber" via the title template in the layout
  return { title: t("title"), alternates: { canonical: "/about-me" } };
}

// Outside the component on purpose: reading the clock is a side effect. The
// page is rendered per request (cookie-based locale), so this is the request time.
const renderTime = () => Date.now();

// Paragraph keys in `AboutPage.story`, in reading order
const STORY = ["p1", "p2", "p3", "p4", "p5", "p6"] as const;

// Static imports: content-hashed URLs (cached immutably), known sizes and a blur placeholder
const GOLF_PHOTOS = [golf1, golf2, golf3, golf4, golf5, golf6];

export default function AboutMe() {
  const t = useTranslations("AboutPage");

  return (
    // Justified with hyphenation, like the bio on the home page
    <section className="flex flex-col gap-6 text-justify hyphens-auto">
      <h1 className="sr-only">{t("title")}</h1>
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
