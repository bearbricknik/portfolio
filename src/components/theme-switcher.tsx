"use client";

import { IconCloudy, IconSunrise } from "@central-icons-react/round-outlined-radius-3-stroke-1.5";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";

import {
  type Resolved,
  type ThemeSelection,
  ThemeToggler,
} from "@/components/animate-ui/primitives/effects/theme-toggler";
import { cn } from "@/lib/utils";

/**
 * Toggles light/dark with the Animate UI view-transition wipe: the whole page
 * snapshots the old theme and the new one is revealed left to right.
 */
export function ThemeSwitcher({ className }: { className?: string }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const t = useTranslations("Controls");

  return (
    <ThemeToggler
      // next-themes only knows the theme after mount; dark is our default
      theme={(theme ?? "dark") as ThemeSelection}
      resolvedTheme={(resolvedTheme ?? "dark") as Resolved}
      setTheme={setTheme}
      direction="ltr"
    >
      {({ resolved, toggleTheme }) => (
        <button
          type="button"
          aria-label={t("toggleTheme")}
          onClick={() => toggleTheme(resolved === "dark" ? "light" : "dark")}
          className={cn(
            "inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            className,
          )}
        >
          {/* Icons switch via CSS, so server and client render the same markup */}
          <IconSunrise className="size-4 dark:hidden" />
          <IconCloudy className="hidden size-4 dark:block" />
        </button>
      )}
    </ThemeToggler>
  );
}
