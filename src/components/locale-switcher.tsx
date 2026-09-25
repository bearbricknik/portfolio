"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";

import { setLocale } from "@/i18n/actions";
import { cn } from "@/lib/utils";

function FlagDe({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 5 3" preserveAspectRatio="xMidYMid slice" className={className}>
      <rect width="5" height="1" fill="#000" />
      <rect y="1" width="5" height="1" fill="#DD0000" />
      <rect y="2" width="5" height="1" fill="#FFCE00" />
    </svg>
  );
}

function FlagGb({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 60 30" preserveAspectRatio="xMidYMid slice" className={className}>
      <clipPath id="flag-gb-clip">
        <path d="M30 15h30v15zv15H0zH0V0zV0h30z" />
      </clipPath>
      <path d="M0 0v30h60V0z" fill="#012169" />
      <path d="M0 0l60 30m0-30L0 30" stroke="#fff" strokeWidth="6" />
      <path d="M0 0l60 30m0-30L0 30" clipPath="url(#flag-gb-clip)" stroke="#C8102E" strokeWidth="4" />
      <path d="M30 0v30M0 15h60" stroke="#fff" strokeWidth="10" />
      <path d="M30 0v30M0 15h60" stroke="#C8102E" strokeWidth="6" />
    </svg>
  );
}

export function LocaleSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const t = useTranslations("Controls");
  const [isPending, startTransition] = useTransition();

  // Shows the flag of the language you switch to
  const Flag = locale === "de" ? FlagGb : FlagDe;

  return (
    <button
      type="button"
      aria-label={t("switchLocale")}
      disabled={isPending}
      onClick={() => startTransition(() => setLocale(locale === "de" ? "en" : "de"))}
      className={cn(
        "group rounded-md p-1.5 transition-colors hover:bg-muted disabled:opacity-50",
        className,
      )}
    >
      <Flag className="h-3 w-[1.125rem] rounded-[3px] opacity-60 saturate-50 ring-1 ring-border transition group-hover:opacity-100 group-hover:saturate-100" />
    </button>
  );
}
