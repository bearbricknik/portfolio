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
   * "hello" intro ends.
   */
  notBefore?: number;
  /** Start only after the stream with this id has finished (see StreamingText) */
  after?: string;
  /** Milliseconds to wait before streaming (with `after`: after that stream) */
  delay?: number;
};

/**
 * The streamed opening text of a page, with the same timing, pace and
 * typography everywhere: left-aligned, with balanced lines and hyphenation.
 */
export function PageIntro({ id, content, notBefore = INTRO_TIMING.streamStart, after, delay }: PageIntroProps) {
  const locale = useLocale();

  return (
    <StreamingText
      // A language switch remounts and streams the other language once
      key={locale}
      id={`${id}-${locale}`}
      notBefore={notBefore}
      after={after ? `${after}-${locale}` : undefined}
      delay={delay}
      interval={30}
      className="flex flex-col gap-4"
      // Hyphenation (uses <html lang>) keeps the ragged edge calm, especially in German
      textClassName="text-pretty hyphens-auto"
      content={content}
    />
  );
}
