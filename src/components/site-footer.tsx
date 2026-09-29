import { useTranslations } from "next-intl";

import { HandwrittenNote } from "@/components/handwritten-note";
import { LocalTime } from "@/components/local-time";
import { ScrollReveal } from "@/components/scroll-reveal";
import { SOCIALS } from "@/lib/socials";

const iconLinkClassName =
  "flex rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

/**
 * Shared footer on every page (rendered by the root layout). It waits for any
 * StreamingText on the page to finish (`waitForStreams`), then fades in once in
 * view; on pages without a stream it appears right away.
 */
export function SiteFooter() {
  const t = useTranslations("Site");
  const tSocials = useTranslations("Socials");

  return (
    <ScrollReveal waitForStreams>
      {/*
        Left: time with the signature right below. Right: the icons; when space
        runs out, the last ones wrap onto a second line (right-aligned), next to
        the signature, so no empty row appears.
      */}
      <footer className="flex items-start justify-between gap-4 text-sm">
        <div className="flex shrink-0 flex-col items-start">
          {/* py-1: same height as an icon row, so the text stays centered next to it */}
          <p className="whitespace-nowrap py-1">
            <LocalTime timeZone="Europe/Berlin" />{" "}
            <span className="text-muted-foreground">{t("location")}</span>
          </p>
          {/* Written once the footer has faded in */}
          <HandwrittenNote waitForStreams delay={0.5} tilt={0}>
            {t("name")}
          </HandwrittenNote>
        </div>
        <nav aria-label={tSocials("label")} className="min-w-0">
          <ul className="flex flex-wrap items-center justify-end gap-1">
            {SOCIALS.map(({ key, href, icon: Icon }) => (
              <li key={key}>
                <a
                  href={href}
                  aria-label={tSocials(key)}
                  // mailto: opens the mail app, everything else a new tab
                  {...(href.startsWith("http") && { target: "_blank", rel: "noreferrer" })}
                  className={iconLinkClassName}
                >
                  <Icon className="size-4" />
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </footer>
    </ScrollReveal>
  );
}
