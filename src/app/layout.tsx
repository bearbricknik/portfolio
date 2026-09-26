import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { IntroOverlay } from "@/components/intro-overlay";
import { Providers } from "@/components/providers";
import { ScrollContainer } from "@/components/scroll-container";
import { ServiceWorkerCleanup } from "@/components/service-worker-cleanup";
import { SiteCursor } from "@/components/site-cursor";
import { locales } from "@/i18n/config";
import { siteConfig } from "@/lib/site";
import "./globals.css";

const ogLocales = { de: "de_DE", en: "en_US" } as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("Metadata");
  const siteName = t("siteName");
  const title = t("title");
  const description = t("description");

  return {
    // Resolves relative URLs (opengraph-image, canonical, …) to absolute ones
    metadataBase: new URL(siteConfig.url),
    title: {
      default: title,
      // Subpages set `title: "Projekte"` → "Projekte — Dominik Huber"
      template: `%s — ${siteName}`,
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
    // The og:image / twitter:image tags come from app/opengraph-image.tsx automatically
    openGraph: {
      type: "website",
      url: "/",
      siteName,
      title,
      description,
      // Language comes from a cookie, not the URL: both locales share one URL
      locale: ogLocales[locale],
      alternateLocale: locales.filter((other) => other !== locale).map((other) => ogLocales[other]),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
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

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();

  return (
    // next-themes sets the theme class on <html> before hydration
    <html
      lang={locale}
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      {/* Browser extensions (e.g. ColorZilla) inject attributes into <body> before hydration */}
      <body className="overflow-hidden bg-background" suppressHydrationWarning>
        <ServiceWorkerCleanup />
        <NextIntlClientProvider>
          <Providers>
            {/* Viewport-sized frame, independent of the body's height */}
            <div className="fixed inset-0 flex flex-col p-6">
              {/* Fixed sheet inside the padded viewport; only its content scrolls */}
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <ScrollContainer className="flex flex-col overscroll-none">{children}</ScrollContainer>
              </div>
            </div>
            <IntroOverlay />
            <SiteCursor />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
