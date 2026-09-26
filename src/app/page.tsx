import {
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

import { Badge, ExternalBadge } from "@/components/inline-badge";
import { StreamingText } from "@/components/streaming-text";
import { INTRO_TIMING } from "@/lib/intro-timing";
import { SOCIALS } from "@/lib/socials";

export default function Home() {
  const t = useTranslations("HomePage");
  const tSite = useTranslations("Site");
  const locale = useLocale();
  const introStreamId = `home-intro-${locale}`;

  return (
    <section className="flex flex-col gap-6">
      {/* Page heading for screen readers and SEO; the visible name sits in the shared header */}
      <h1 className="sr-only">
        {tSite("name")} – {tSite("role")}
      </h1>

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

    </section>
  );
}
