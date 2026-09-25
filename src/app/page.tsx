import {
  IconArrowUpRight,
  IconChart1,
  IconCodeBrackets,
  IconGraduateCap,
  IconJavascript,
  IconLinkedin,
  IconPuzzle,
  IconReact,
  IconServer,
  IconTypescript,
  IconVercel,
} from "@central-icons-react/round-outlined-radius-3-stroke-1.5";
import { useLocale, useTranslations } from "next-intl";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { StreamingText } from "@/components/streaming-text";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { cn } from "@/lib/utils";

type Icon = React.ComponentType<{ className?: string }>;

const badgeClassName =
  "inline-flex items-center gap-1 rounded-md border bg-muted/60 px-1.5 py-0.5 text-sm leading-none";

/** Inline badge with a colored icon, e.g. for a technology */
function Badge({ icon: Icon, color, children }: { icon: Icon; color: string; children: React.ReactNode }) {
  return (
    <span className={badgeClassName}>
      <Icon className={cn("size-3.5", color)} />
      {children}
    </span>
  );
}

/** Badge that links to an external page; the cursor shows `cursorLabel` on hover */
function ExternalBadge({
  href,
  icon: Icon,
  color,
  cursorLabel,
  children,
}: {
  href: string;
  icon: Icon;
  color: string;
  cursorLabel: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      data-cursor={cursorLabel}
      className={cn(badgeClassName, "transition-colors hover:bg-muted")}
    >
      <Icon className={cn("size-3.5", color)} />
      {children}
      <IconArrowUpRight className="size-3 text-muted-foreground" />
    </a>
  );
}

export default function Home() {
  const t = useTranslations("HomePage");
  const locale = useLocale();

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-20 px-6 py-12">
      <section className="flex flex-col gap-6 leading-relaxed">
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-medium">
            {t("name")} – {t("role")}
          </h1>
          <div className="flex items-center gap-1">
            <LocaleSwitcher />
            <ThemeSwitcher />
          </div>
        </div>

        {/*
          Streams in once the intro overlay is gone; "\n\n" in the message starts a new paragraph.
          key: a language switch remounts and streams the other language once;
          id: each language only animates once until the next page refresh.
        */}
        <StreamingText
          key={locale}
          id={`home-intro-${locale}`}
          notBefore={3800}
          interval={30}
          className="flex flex-col gap-6"
          // Justified text; hyphenation (uses <html lang>) avoids wide gaps, especially in German
          textClassName="text-justify hyphens-auto"
          content={t.rich("bio", {
            uni: (chunks) => (
              <Badge icon={IconGraduateCap} color="text-indigo-500">
                {chunks}
              </Badge>
            ),
            extensions: (chunks) => (
              <Badge icon={IconPuzzle} color="text-violet-500">
                {chunks}
              </Badge>
            ),
            js: (chunks) => (
              <Badge icon={IconJavascript} color="text-yellow-500">
                {chunks}
              </Badge>
            ),
            python: (chunks) => (
              <Badge icon={IconCodeBrackets} color="text-sky-600">
                {chunks}
              </Badge>
            ),
            node: (chunks) => (
              <Badge icon={IconServer} color="text-green-600">
                {chunks}
              </Badge>
            ),
            next: (chunks) => (
              <Badge icon={IconVercel} color="text-foreground">
                {chunks}
              </Badge>
            ),
            react: (chunks) => (
              <Badge icon={IconReact} color="text-cyan-500">
                {chunks}
              </Badge>
            ),
            ts: (chunks) => (
              <Badge icon={IconTypescript} color="text-blue-600">
                {chunks}
              </Badge>
            ),
            profitpath: (chunks) => (
              <ExternalBadge
                href="https://profitpath.com/en"
                icon={IconChart1}
                color="text-emerald-500"
                cursorLabel="profitpath.com ↗"
              >
                {chunks}
              </ExternalBadge>
            ),
            linkedin: (chunks) => (
              <ExternalBadge
                href="https://www.linkedin.com/in/dominik-huber-7a4394227"
                icon={IconLinkedin}
                color="text-blue-700 dark:text-blue-400"
                cursorLabel="LinkedIn ↗"
              >
                {chunks}
              </ExternalBadge>
            ),
          })}
        />
      </section>
    </div>
  );
}
