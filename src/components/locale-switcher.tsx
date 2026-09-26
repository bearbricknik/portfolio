"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";

import { setLocale } from "@/i18n/actions";
import { cn } from "@/lib/utils";

export function LocaleSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const t = useTranslations("Controls");
  const [isPending, startTransition] = useTransition();

  // Shows the language you switch to
  const target = locale === "de" ? "en" : "de";

  return (
    <button
      type="button"
      aria-label={t("switchLocale")}
      disabled={isPending}
      onClick={() => startTransition(() => setLocale(target))}
      className={cn(
        "inline-flex h-7 items-center justify-center rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50",
        className,
      )}
    >
      {target.toUpperCase()}
    </button>
  );
}
