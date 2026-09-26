"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";

function formatTime(date: Date, locale: string, timeZone: string) {
  if (locale === "en") {
    // "12:36 AM" → "12:36am"
    return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone })
      .format(date)
      .replace(/\s*(AM|PM)$/i, (match) => match.trim().toLowerCase());
  }
  return new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit", timeZone }).format(date);
}

/** Live clock for a fixed time zone, formatted for the active locale. */
export function LocalTime({ timeZone, className }: { timeZone: string; className?: string }) {
  const locale = useLocale();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 10_000);
    return () => clearInterval(interval);
  }, []);

  return (
    // Server and client render a few ms apart; around a minute change the text can differ
    <time dateTime={now.toISOString()} className={className} suppressHydrationWarning>
      {formatTime(now, locale, timeZone)}
    </time>
  );
}
