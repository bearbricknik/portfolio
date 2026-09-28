import type { ReactNode } from "react";
import { useLocale } from "next-intl";

import { StreamingText } from "@/components/streaming-text";
import { INTRO_TIMING } from "@/lib/intro-timing";

type PageIntroProps = {
  /** Stream id (the locale is appended): each language streams once until the next refresh */
  id: string;
  /** Streamed content, e.g. `t.rich(...)` with badges; "\n\n" starts a new paragraph */
  content: ReactNode;
  /**
   * When the stream may start (ms after page load), by default right as the
   * "hello" intro ends. Use `INTRO_TIMING.bodyStreamStart` below a streamed heading.
   */
  notBefore?: number;
};

/**
 * The streamed opening text of a page, with the same timing, pace and
 * typography everywhere: left-aligned on phones, justified from `sm`.
 */
export function PageIntro({ id, content, notBefore = INTRO_TIMING.streamStart }: PageIntroProps) {
  const locale = useLocale();

  return (
    <StreamingText
      // A language switch remounts and streams the other language once
      key={locale}
      id={`${id}-${locale}`}
      notBefore={notBefore}
      interval={30}
      className="flex flex-col gap-6"
      // Hyphenation (uses <html lang>) keeps justified lines even, especially in German
      textClassName="text-left text-pretty hyphens-auto sm:text-justify"
      content={content}
    />
  );
}
