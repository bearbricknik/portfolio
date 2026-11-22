import type { Metadata } from "next";

import { HiPage, hiMetadata } from "@/components/hi/hi-page";
import { parseHiName } from "@/lib/hi";

/**
 * /hi/<name>: greets by name ("anna-lena" → "Anna-Lena"). Names aren't known
 * at build time: one placeholder is prerendered for validation, every other
 * name is rendered on its first visit and cached from then on. Anything that
 * isn't a plausible first name gets the generic page.
 */
// Only ever opened from a shared link or QR code, never navigated to within
// the site: nothing to prefetch, so the page may wait for its name and arrive
// complete (no placeholder flashing first)
export const instant = false;

export function generateStaticParams() {
  return [{ name: "_" }];
}

export async function generateMetadata({ params }: PageProps<"/[locale]/hi/[name]">): Promise<Metadata> {
  const { name } = await params;
  return hiMetadata(parseHiName(name));
}

export default async function HiNamed({ params }: PageProps<"/[locale]/hi/[name]">) {
  const { name } = await params;
  return <HiPage name={parseHiName(name)} />;
}
