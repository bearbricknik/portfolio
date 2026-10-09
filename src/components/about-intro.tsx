"use client";

import { useEffect, useState } from "react";
import { IconApple, IconGolfBall, IconEarth } from "@central-icons-react/round-outlined-radius-3-stroke-1.5";
import { useTranslations } from "next-intl";

import { AnimatedNumber, AnimatedNumberGroup } from "@/components/animated-number";
import { BirthdayBadge } from "@/components/birthday-badge";
import { Badge } from "@/components/inline-badge";
import { PageIntro } from "@/components/page-intro";
import { getAge, isBirthday } from "@/lib/age";

/** Paragraph keys in `AboutPage.story`, in reading order */
export type StoryKey = "p1" | "p2" | "p3" | "p4";

/** Inline badges in the story paragraphs */
const storyBadges = {
  apple: (chunks: React.ReactNode) => (
    <Badge icon={IconApple} color="text-foreground">
      {chunks}
    </Badge>
  ),
  golf: (chunks: React.ReactNode) => (
    <Badge icon={IconGolfBall} color="text-emerald-500">
      {chunks}
    </Badge>
  ),
  latam: (chunks: React.ReactNode) => (
    <Badge icon={IconEarth} color="text-orange-500">
      {chunks}
    </Badge>
  ),
};

type AboutIntroProps = {
  /** Stream id (see PageIntro) */
  id: string;
  /** Open with the live age sentence and where I'm from */
  withAge?: boolean;
  /** Story paragraphs to stream (after the age sentence, if any) */
  story: StoryKey[];
  /** Server render time (ms), so server and client start from the same age */
  renderedAt?: number;
  /** Start after this stream or reveal (see PageIntro) */
  after?: string;
  delay?: number;
};

/**
 * The about page's text, streamed like every page intro. Optionally opens with
 * a live age counter (updates every second, digits roll via NumberFlow): its
 * numbers stream in as part of the sentence and keep counting afterwards.
 */
export function AboutIntro({ id, withAge = false, story, renderedAt = 0, after, delay }: AboutIntroProps) {
  const t = useTranslations("AboutPage");
  const [now, setNow] = useState(() => new Date(renderedAt));

  useEffect(() => {
    if (!withAge) return;
    const tick = () => setNow(new Date());
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [withAge]);

  const age = getAge(now);
  // Always counts up, so e.g. seconds 86.399 → 0 still roll upwards
  const number = (value: number) => (
    <span className="tabular-nums">
      <AnimatedNumber value={value} trend={1} />
    </span>
  );

  const ageSentence = withAge
    ? [
        t.rich("intro", {
          ...age,
          // Adds " (heute ist mein [Geburtstag])" via ICU select in the message;
          // only on 14 October (German time)
          birthday: isBirthday(now) ? "yes" : "no",
          cake: (chunks) => <BirthdayBadge label={chunks} />,
          years: () => number(age.years),
          days: () => number(age.days),
          seconds: () => number(age.seconds),
          // Units (Jahre, Tage, Sekunden) are muted, the numbers are not
          muted: (chunks) => <span className="text-muted-foreground">{chunks}</span>,
        }),
        ` ${t("origin")}`,
      ]
    : [];

  // One flat list of words and elements; "\n\n" starts a new paragraph
  const content = [...ageSentence, ...story.flatMap((key) => ["\n\n", t.rich(`story.${key}`, storyBadges)])];
  if (!withAge) content.shift();

  return (
    // Numbers that change together (e.g. at midnight) roll in sync
    <AnimatedNumberGroup>
      <PageIntro id={id} content={content} after={after} delay={delay} />
    </AnimatedNumberGroup>
  );
}
