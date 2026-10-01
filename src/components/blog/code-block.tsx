import { IconCode } from "@central-icons-react/round-outlined-radius-3-stroke-1.5";
import { getTranslations } from "next-intl/server";
import { codeToHtml } from "shiki";

import { CodeScroll } from "@/components/blog/code-scroll";
import { CollapsibleCode } from "@/components/blog/collapsible-code";
import { CopyButton } from "@/components/copy-button";

type CodeBlockProps = { code: string; language?: string; filename?: string };

const THEMES = { light: "github-light", dark: "github-dark" } as const;

// Longer code is capped at this many lines and opens with "show more"
const MAX_LINES = 10;
// 13px text with relaxed leading, plus the block's top padding
const LINE_HEIGHT = 13 * 1.625;
const PADDING_TOP = 12;

/**
 * A code block of a post, highlighted on the server (Shiki) in a light and a
 * dark theme; CSS switches between them with the site's theme (globals.css).
 * The header shows the file name (or the language) and a copy button.
 */
export async function CodeBlock({ code, language = "text", filename }: CodeBlockProps) {
  const t = await getTranslations("BlogPage");
  // Both themes as CSS variables, no fixed colors; unknown languages as plain text
  const html = await codeToHtml(code, { lang: language, themes: THEMES, defaultColor: false }).catch(() =>
    codeToHtml(code, { lang: "text", themes: THEMES, defaultColor: false }),
  );

  const lines = code.split("\n").length;
  const maxHeight = lines > MAX_LINES ? Math.round(PADDING_TOP + MAX_LINES * LINE_HEIGHT) : undefined;

  return (
    <figure className="overflow-hidden rounded-xl border bg-muted/40">
      <figcaption className="flex items-center justify-between gap-3 border-b py-1 pr-1.5 pl-4">
        <span className="flex min-w-0 items-center gap-1.5 font-mono text-xs leading-none text-muted-foreground">
          <IconCode className="size-3.5 shrink-0" />
          <span className="truncate">{filename ?? language}</span>
        </span>
        <CopyButton value={code} labels={{ copy: t("copy"), copied: t("copied") }} />
      </figcaption>
      <CollapsibleCode maxHeight={maxHeight} labels={{ more: t("showMore"), less: t("showLess") }}>
        <CodeScroll>
          <div
            className="code-block w-max min-w-full px-4 py-3 font-mono text-[13px] leading-relaxed"
            // Shiki's output: escaped code in highlighted spans
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </CodeScroll>
      </CollapsibleCode>
    </figure>
  );
}
