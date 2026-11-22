import type { Metadata } from "next";

import { HiPage, hiMetadata } from "@/components/hi/hi-page";

/** /hi: the generic version, without a name (see /hi/[name]) */
export async function generateMetadata(): Promise<Metadata> {
  return hiMetadata(null);
}

export default function Hi() {
  return <HiPage name={null} />;
}
