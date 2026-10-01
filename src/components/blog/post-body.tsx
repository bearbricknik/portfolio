import type { ReactNode } from "react";
import Link from "next/link";
import { PortableText, type PortableTextComponents } from "next-sanity";

import { CodeBlock } from "@/components/blog/code-block";
import { SanityImage } from "@/components/sanity-image";

type BodyImage = {
  asset: { _ref: string };
  alt?: string;
  caption?: string;
  lqip?: string;
  dimensions?: { width: number; height: number };
};

// The text column is at most this wide (content width of the site)
const TEXT_WIDTH = 528;

const components: PortableTextComponents = {
  block: {
    normal: ({ children }) => <p>{children}</p>,
    h2: ({ children }) => <h2 className="mt-4 font-medium text-foreground">{children}</h2>,
    h3: ({ children }) => <h3 className="mt-2 font-medium text-muted-foreground">{children}</h3>,
    blockquote: ({ children }) => <blockquote className="border-l-2 pl-4 text-muted-foreground">{children}</blockquote>,
  },
  list: {
    bullet: ({ children }) => <ul className="flex list-disc flex-col gap-1 pl-5 marker:text-muted-foreground">{children}</ul>,
    number: ({ children }) => <ol className="flex list-decimal flex-col gap-1 pl-5 marker:text-muted-foreground">{children}</ol>,
  },
  marks: {
    strong: ({ children }) => <strong className="font-medium text-foreground">{children}</strong>,
    code: ({ children }) => <code className="rounded-md border bg-muted/60 px-1 py-px font-mono text-[0.85em]">{children}</code>,
    link: ({ value, children }) => (
      // External: a new tab
      <a href={value?.href} target="_blank" rel="noopener noreferrer" data-cursor-pointer className={LINK}>
        {children}
      </a>
    ),
    postLink: ({ value, children }) =>
      value?.slug ? (
        <Link href={`/blog/${value.slug}`} data-cursor-pointer className={LINK}>
          {children}
        </Link>
      ) : (
        <>{children}</>
      ),
  },
  types: {
    image: ({ value }: { value: BodyImage }) => {
      const { width = 1600, height = 1000 } = value.dimensions ?? {};
      return (
        <figure className="my-2 flex flex-col gap-2">
          <SanityImage
            image={value}
            alt={value.alt ?? ""}
            lqip={value.lqip}
            width={width}
            height={height}
            sizes={`(min-width: 640px) ${TEXT_WIDTH}px, 100vw`}
            className="h-auto w-full rounded-2xl border"
          />
          {value.caption && <figcaption className="text-sm text-muted-foreground">{value.caption}</figcaption>}
        </figure>
      );
    },
    code: ({ value }: { value: { code?: string; language?: string; filename?: string } }) =>
      value.code ? <CodeBlock code={value.code} language={value.language} filename={value.filename} /> : null,
  },
};

// Links show the pointing hand next to their cursor label (data-cursor-pointer)
const LINK =
  "underline decoration-muted-foreground/50 underline-offset-4 transition-colors hover:decoration-foreground";

/**
 * The text of a post (Portable Text) in the site's type: 16px with relaxed
 * leading, headings in medium weight, the same spacing between all blocks
 */
export function PostBody({ value }: { value: unknown }): ReactNode {
  return (
    <div className="flex flex-col gap-4 text-pretty">
      <PortableText value={value as Parameters<typeof PortableText>[0]["value"]} components={components} />
    </div>
  );
}
