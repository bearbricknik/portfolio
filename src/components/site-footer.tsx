import Link from "next/link";
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
                const icon = <Icon className="size-4" />;
                return (
                  <li key={key}>
                    {href.startsWith("/") ? (
                      // Internal page (e.g. /cv): client-side navigation
                      <Link href={href} aria-label={tSocials(key)} className={iconLinkClassName}>
                        {icon}
                      </Link>
                    ) : (
                      <a
                        href={href}
                        aria-label={tSocials(key)}
                        // mailto: opens the mail app, everything else a new tab
                        {...(href.startsWith("http") && { target: "_blank", rel: "noreferrer" })}
                        className={iconLinkClassName}
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
        <HandwrittenNote waitForStreams delay={0.5} tilt={0} className="text-2xl">
          {t("name")}
        </HandwrittenNote>
      </footer>
    </ScrollReveal>
  );
}
