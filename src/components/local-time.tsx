"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";

import { cn } from "@/lib/utils";

function formatTime(date: Date, locale: string, timeZone: string) {
  if (locale === "en") {
    // "12:36 AM" → "12:36am"
    return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone })
      .format(date)
      .replace(/\s*(AM|PM)$/i, (match) => match.trim().toLowerCase());
  }
  return new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit", timeZone }).format(date);
}

// Same width as a real time, so nothing shifts when the clock appears
const PLACEHOLDER = { de: "00:00", en: "12:00am" } as Record<string, string>;

/**
 * Live clock for a fixed time zone, formatted for the active locale. The page
 * is prerendered, so the time is only known in the browser: until then an
 * invisible placeholder keeps its space.
 */
export function LocalTime({ timeZone, className }: { timeZone: string; className?: string }) {
  const locale = useLocale();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const interval = setInterval(tick, 10_000);
    return () => clearInterval(interval);
  }, []);

  if (!now) {
    return (
      <span aria-hidden className={cn("invisible", className)}>
        {PLACEHOLDER[locale] ?? PLACEHOLDER.de}
      </span>
    );
  }

  return (
    <time dateTime={now.toISOString()} className={className}>
      {formatTime(now, locale, timeZone)}
    </time>
  );
}
