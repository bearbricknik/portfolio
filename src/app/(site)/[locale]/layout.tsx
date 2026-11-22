import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { Nothing_You_Could_Do } from "next/font/google";
import { CommandHint } from "@/components/command-hint";
import { HiddenOnHi } from "@/components/hidden-on-hi";
import { IntroOverlay } from "@/components/intro-overlay";
import { JsonLd } from "@/components/json-ld";
import { Providers } from "@/components/providers";
import { ScrollContainer } from "@/components/scroll-container";
import { ServiceWorkerCleanup } from "@/components/service-worker-cleanup";
import { SiteCursor } from "@/components/site-cursor";
import { SiteControls } from "@/components/site-controls";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { locales } from "@/i18n/config";
import { ogLocales } from "@/lib/metadata";
import { ogImageMetadata } from "@/lib/og-images";
import { siteConfig } from "@/lib/site";
import { siteGraph } from "@/lib/structured-data";
import "../../globals.css";

// Handwriting for HandwrittenNote (`font-handwriting`); swap the font here to change it everywhere
const handwriting = Nothing_You_Could_Do({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-nothing-you-could-do",
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("Metadata");
  const siteName = t("siteName");
  const title = t("title");
  const description = t("description");

  return {
    // Resolves relative URLs (og:image, canonical, …) to absolute ones
    metadataBase: new URL(siteConfig.url),
    title: {
      default: title,
      // Subpages set `title: "Projekte"` → "Projekte — Dominik Huber"
      template: `%s | ${siteName}`,
    },
    description,
    applicationName: siteName,
    authors: [{ name: siteName, url: siteConfig.url }],
    creator: siteName,
    alternates: {
      canonical: "/",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
    openGraph: {
      type: "website",
      url: "/",
      siteName,
      title,
      description,
      // Language comes from a cookie, not the URL: both locales share one URL
      locale: ogLocales[locale],
      alternateLocale: locales.filter((other) => other !== locale).map((other) => ogLocales[other]),
      // Static preview image in the visitor's language (lib/og-images.ts)
      images: [ogImageMetadata(locale, title)],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageMetadata(locale, title)],
    },
  };
}

// The only message namespaces client components read (useTranslations in a
// "use client" file); everything else is rendered on the server and stays out
// of the page's payload. Add a namespace here when a client component needs it.
const CLIENT_NAMESPACES = ["Controls", "Nav", "AboutPage", "ContributionGraph", "BlogPage", "BlogDemos"] as const;

// Every page exists once per language; the proxy picks the visitor's (src/proxy.ts)
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  // Browser UI color, matches the dark (default) and light background
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: LayoutProps<"/[locale]">) {
  const locale = await getLocale();
  const tSite = await getTranslations("Site");
  const tMeta = await getTranslations("Metadata");
  const messages = await getMessages();
  const clientMessages = Object.fromEntries(CLIENT_NAMESPACES.map((namespace) => [namespace, messages[namespace]]));

  return (
    // next-themes sets the theme class on <html> before hydration
    <html
      lang={locale}
      className={`${GeistSans.variable} ${GeistMono.variable} ${handwriting.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      {/* Browser extensions (e.g. ColorZilla) inject attributes into <body> before hydration */}
      <body className="overflow-hidden bg-background" suppressHydrationWarning>
        <ServiceWorkerCleanup />
        {/* The person and the site, for search engines; pages add their own page + breadcrumb */}
        <JsonLd data={siteGraph({ locale, role: tSite("role"), description: tMeta("description") })} />
        <NextIntlClientProvider messages={clientMessages}>
          <Providers>
            {/* Viewport-sized frame, independent of the body's height */}
            <div
              className={
                // /hi on phones: less frame at the sides, so the story and the
                // boarding pass get the width (the page marks itself with data-hi)
                "fixed inset-0 flex flex-col p-6 max-sm:has-[[data-hi]]:px-3"
              }
            >
              {/* Fixed sheet inside the padded viewport; only its content scrolls */}
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <ScrollContainer
                  // overflow-x-hidden: wide content (e.g. the polaroid fan) never adds a horizontal scrollbar
                  className="flex flex-col overflow-x-hidden overscroll-none"
                >
                  {/* Header and footer are shared by every page; pages only bring their content */}
                  <div className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 py-12 leading-relaxed max-sm:has-[[data-hi]]:px-2">
                    {/* /hi stands on its own: no header, footer, corner controls, ⌘K hint or intro there */}
                    <HiddenOnHi>
                      <SiteHeader />
                    </HiddenOnHi>
                    <main className="flex flex-col">{children}</main>
                    <HiddenOnHi>
                      <SiteFooter />
                    </HiddenOnHi>
                  </div>
                </ScrollContainer>
              </div>
              {/* Language and theme in the top right corner, mirroring the ⌘K hint
                  below; on phones they sit next to the navigation instead */}
              {/* z-20: above the scroll fades (z-10) */}
              <HiddenOnHi>
                <SiteControls className="absolute top-4 right-4 z-20 hidden sm:flex" />
              </HiddenOnHi>
              {/* ⌘K / Ctrl+K hint in the bottom right corner: same 4px offset to the
                  right and bottom, so it fits the 24px padding exactly (Kbd = 20px) */}
              {/* z-20: above the scroll fades (z-10), which it overlaps at this offset */}
              <HiddenOnHi>
                <CommandHint className="absolute right-4 bottom-4 z-20" />
              </HiddenOnHi>
            </div>
            <HiddenOnHi>
              <IntroOverlay />
            </HiddenOnHi>
            <SiteCursor />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
