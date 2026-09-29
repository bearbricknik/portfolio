import { notFound } from "next/navigation";

import { isLocale, locales } from "@/i18n/config";
import { renderOgImage } from "@/lib/og-image";

// Both languages are rendered once at build time
export const dynamic = "force-static";
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

/**
 * The Open Graph image in a language (/og/de, /og/en): the template for the
 * static files in src/assets/og (`pnpm og:export`)
 */
export async function GET(_request: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return renderOgImage(locale);
}
