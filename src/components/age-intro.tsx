"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { AnimatedNumber, AnimatedNumberGroup } from "@/components/animated-number";
import { getAge } from "@/lib/age";
import { cn } from "@/lib/utils";

/**
 * Sentence with a live age counter (updates every second, digits roll via
 * NumberFlow). Renders inline, so it can share a paragraph with other sentences.
 *
 * @param renderedAt Server render time (ms). The client starts from the same
 *   moment, so server and client HTML match; the first tick then rolls the
 *   numbers forward to the current time.
 */
export function AgeIntro({ renderedAt, className }: { renderedAt: number; className?: string }) {
  const t = useTranslations("AboutPage");
  const [now, setNow] = useState(() => new Date(renderedAt));

  useEffect(() => {
    const tick = () => setNow(new Date());
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const age = getAge(now);
  // Always counts up, so e.g. seconds 86.399 → 0 still roll upwards
  const number = (value: number) => <AnimatedNumber value={value} trend={1} />;

  return (
    // Group: numbers that change together (e.g. at midnight) animate in sync
    <AnimatedNumberGroup>
      <span className={cn("tabular-nums", className)}>
        {t.rich("intro", {
          ...age,
          years: () => number(age.years),
          days: () => number(age.days),
          seconds: () => number(age.seconds),
          // Units (Jahre, Tage, Sekunden) are muted, the numbers are not
          muted: (chunks) => <span className="text-muted-foreground">{chunks}</span>,
        })}
      </span>
    </AnimatedNumberGroup>
  );
}
