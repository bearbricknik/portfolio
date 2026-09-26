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
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { HandwrittenNote } from "@/components/handwritten-note";
import { LocalTime } from "@/components/local-time";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ScrollReveal } from "@/components/scroll-reveal";
import { StreamingText } from "@/components/streaming-text";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { INTRO_TIMING } from "@/lib/intro-timing";
import { SOCIALS } from "@/lib/socials";
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
  const tSocials = useTranslations("Socials");
  const locale = useLocale();
  // Everything below the intro waits for this stream to finish (see ScrollReveal)
  const introStreamId = `home-intro-${locale}`;

  return (
    <section className="flex flex-col gap-6 leading-relaxed">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-medium">{t("name")}</h1>
          <p className="text-muted-foreground">{t("role")}</p>
        </div>
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
        id={introStreamId}
        // Starts shortly before "hello" is written, see src/lib/intro-timing.ts
        notBefore={INTRO_TIMING.streamStart}
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
              href={SOCIALS.find((social) => social.key === "linkedin")!.href}
              icon={IconLinkedin}
              color="text-blue-700 dark:text-blue-400"
              cursorLabel="LinkedIn ↗"
            >
              {chunks}
            </ExternalBadge>
          ),
        })}
      />

      {/* Appears once the intro has streamed and it is in view; later sections work the same way */}
      <ScrollReveal after={introStreamId}>
        <footer className="flex flex-col items-start gap-1 text-sm">
          {/* Row 1: time and icons on one line */}
          <div className="flex w-full items-center justify-between gap-4">
            <p>
              <LocalTime timeZone="Europe/Berlin" />{" "}
              <span className="text-muted-foreground">{t("location")}</span>
            </p>
            <nav aria-label={tSocials("label")}>
              <ul className="flex items-center gap-1">
                {SOCIALS.map(({ key, href, icon: Icon }) => {
                  const className =
                    "flex rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";
                  const icon = <Icon className="size-4" />;
                  return (
                    <li key={key}>
                      {href.startsWith("/") ? (
                        // Internal page (e.g. /cv): client-side navigation
                        <Link href={href} aria-label={tSocials(key)} className={className}>
                          {icon}
                        </Link>
                      ) : (
                        <a
                          href={href}
                          aria-label={tSocials(key)}
                          // mailto: opens the mail app, everything else a new tab
                          {...(href.startsWith("http") && { target: "_blank", rel: "noreferrer" })}
                          className={className}
                        >
                          {icon}
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
          {/* Row 2: signature below, written once the footer has faded in */}
          <HandwrittenNote after={introStreamId} delay={0.5} tilt={0} className="text-2xl">
            {t("name")}
          </HandwrittenNote>
        </footer>
      </ScrollReveal>
    </section>
  );
}
