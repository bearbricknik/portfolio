"use client";

import {
  Children,
  createContext,
  Fragment,
  isValidElement,
  useContext,
  useEffect,
  useEffectEvent,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import { cn } from "@/lib/utils";
import { useStreamingStore } from "@/stores/streaming-store";

/*
 * STREAMING TEXT
 * Words resolve out of blur one by one, inline elements (badges, links,
 * buttons, …) pop in at their position, then <StreamingReveal> content
 * (actions, follow-ups, sources, …) fades up once the stream is done.
 *
 * All tokens are rendered from the start (invisible until streamed), so the
 * layout never jumps and the full text is in the server HTML.
 */

type Token =
  | { kind: "word"; text: string; spaceBefore: boolean }
  | { kind: "node"; node: React.ReactElement; spaceBefore: boolean }
  | { kind: "break" };

/** Blank line inside a string = new paragraph */
const PARAGRAPH_BREAK = /\n\s*\n/;

function tokenize(content: React.ReactNode): Token[] {
  const tokens: Token[] = [];
  // Whether the previous string ended with whitespace
  let pendingSpace = false;

  for (const item of Children.toArray(content)) {
    if (typeof item === "string" || typeof item === "number") {
      String(item)
        .split(PARAGRAPH_BREAK)
        .forEach((part, partIndex) => {
          if (partIndex > 0) {
            tokens.push({ kind: "break" });
            pendingSpace = false;
          }
          part
            .split(/\s+/)
            .filter(Boolean)
            .forEach((text, index) => {
              const previous = tokens.at(-1);
              const spaceBefore =
                previous !== undefined &&
                previous.kind !== "break" &&
                (index > 0 || /^\s/.test(part) || pendingSpace);
              tokens.push({ kind: "word", text, spaceBefore });
            });
          if (part) pendingSpace = /\s$/.test(part);
        });
    } else if (isValidElement(item)) {
      const previous = tokens.at(-1);
      tokens.push({
        kind: "node",
        node: item,
        spaceBefore:
          previous !== undefined &&
          previous.kind !== "break" &&
          (pendingSpace || previous.kind === "node"),
      });
      pendingSpace = false;
    }
  }

  return tokens;
}

/** Splits tokens into paragraphs, keeping their global index for the stream position */
function toParagraphs(tokens: Token[]) {
  const paragraphs: { token: Token; index: number }[][] = [[]];
  tokens.forEach((token, index) => {
    if (token.kind === "break") paragraphs.push([]);
    paragraphs.at(-1)!.push({ token, index });
  });
  return paragraphs;
}

type StreamingContextValue = {
  done: boolean;
  started: boolean;
  /** False when the stream was already seen and renders instantly */
  animated: boolean;
};

const StreamingContext = createContext<StreamingContextValue | null>(null);

/** Stream state for custom children, e.g. to disable a button until the text is done. */
export function useStreamingText() {
  const context = useContext(StreamingContext);
  if (!context) throw new Error("useStreamingText must be used inside <StreamingText>");
  return context;
}

type StreamingTextProps = {
  /**
   * Streamed content: strings stream word by word, elements (badges, links,
   * buttons, …) pop in as one unit. Spacing follows the strings like in JSX:
   * `["Built with ", <Badge />, ". Next"]`. A blank line (`"\n\n"`) starts a
   * new paragraph. `t.rich(...)` output can be passed as is.
   */
  content: React.ReactNode;
  /** Element used for each paragraph */
  as?: "p" | "div" | "span" | "h1" | "h2" | "h3" | "blockquote";
  /** Milliseconds between two tokens */
  interval?: number;
  /** Milliseconds to wait before the stream starts */
  delay?: number;
  /**
   * Don't start before this many milliseconds after page load, e.g. to wait
   * for an intro. Unlike `delay`, a stream that mounts later (after a language
   * switch) starts right away.
   */
  notBefore?: number;
  /**
   * Remembers the stream until the next page refresh (global Zustand store):
   * once it has finished, it renders instantly instead of animating again.
   * Use a different id per content (e.g. per locale) so each variant streams once.
   */
  id?: string;
  /** Only start once the component is scrolled into view */
  startOnView?: boolean;
  /** Restart after `holdMs` once the stream is done */
  loop?: boolean;
  /** Milliseconds the finished text stays before a loop restarts */
  holdMs?: number;
  /** Show a caret after the last streamed token */
  caret?: boolean;
  /** Called once the stream has finished (not called while looping) */
  onDone?: () => void;
  /** Wrapper around the text and the children */
  className?: string;
  /** Classes for each paragraph element */
  textClassName?: string;
  /** Rendered below the text; use <StreamingReveal> to show parts once the stream is done */
  children?: React.ReactNode;
};

export function StreamingText({
  content,
  as: Tag = "p",
  interval = 55,
  delay = 0,
  notBefore = 0,
  id,
  startOnView = true,
  loop = false,
  holdMs = 3400,
  caret = true,
  onDone,
  className,
  textClassName,
  children,
}: StreamingTextProps) {
  const tokens = useMemo(() => tokenize(content), [content]);
  const paragraphs = useMemo(() => toParagraphs(tokens), [tokens]);
  const rootRef = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(!startOnView);
  const [count, setCount] = useState(0);
  // Store starts empty on every page load, so server and client render the same
  const seen = useStreamingStore((state) => (id ? state.seen[id] === true : false));
  const markSeen = useStreamingStore((state) => state.markSeen);
  const setActive = useStreamingStore((state) => state.setActive);
  const registryKey = useId();
  const animated = !seen;
  const done = seen || (started && count >= tokens.length);

  // Start when the component enters the viewport
  useEffect(() => {
    if (!startOnView) return;
    const root = rootRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setStarted(true);
        observer.disconnect();
      },
      { threshold: 0.2 },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, [startOnView]);

  // Registered as "active" while it animates, so content with `waitForStreams`
  // (e.g. the footer) waits for it — on any page, without knowing its id
  useEffect(() => {
    if (!animated || done || loop) return;
    setActive(registryKey, true);
    return () => setActive(registryKey, false);
  }, [animated, done, loop, registryKey, setActive]);

  const handleDone = useEffectEvent(() => {
    if (id) markSeen(id);
    onDone?.();
  });

  useEffect(() => {
    if (!started || !animated) return;
    if (done && !loop) {
      handleDone();
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const startWait = Math.max(delay, notBefore - performance.now());
    const wait = count === 0 ? startWait : done ? holdMs : interval;
    const timeout = setTimeout(() => {
      setCount((current) => {
        if (current >= tokens.length) return 0;
        // Without motion, show everything at once
        return reducedMotion ? tokens.length : current + 1;
      });
    }, wait);
    return () => clearTimeout(timeout);
  }, [started, animated, count, done, loop, delay, notBefore, holdMs, interval, tokens.length]);

  const showCaret = caret && animated && started && !done;
  // Already seen: no animation classes, everything visible right away
  const tokenClass = (visible: boolean, animation: string) =>
    !animated ? undefined : visible ? animation : "stream-token";

  return (
    <StreamingContext value={{ done, started, animated }}>
      <div ref={rootRef} className={className}>
        {paragraphs.map((paragraph, paragraphIndex) => (
          <Tag key={paragraphIndex} className={textClassName} aria-busy={started && !done}>
            {showCaret && count === 0 && paragraphIndex === 0 && (
              <span aria-hidden className="stream-caret" />
            )}
            {paragraph.map(({ token, index }, position) => {
              const caretAfter = (tokenIndex: number) =>
                showCaret &&
                tokenIndex === count - 1 && <span aria-hidden className="stream-caret" />;

              if (token.kind === "break") return <Fragment key={index}>{caretAfter(index)}</Fragment>;

              const renderWord = (word: Extract<Token, { kind: "word" }>, wordIndex: number) => (
                <span className={tokenClass(!animated || wordIndex < count, "stream-word")}>
                  {word.spaceBefore ? " " : ""}
                  {word.text}
                </span>
              );

              if (token.kind === "word") {
                // Punctuation glued to an element is rendered together with it (see below)
                const previous = paragraph[position - 1]?.token;
                if (!token.spaceBefore && previous?.kind === "node") return null;
                return (
                  <Fragment key={index}>
                    {renderWord(token, index)}
                    {caretAfter(index)}
                  </Fragment>
                );
              }

              const visible = !animated || index < count;
              const element = (
                <span
                  className={cn("inline-block", tokenClass(visible, "stream-pop"))}
                  // Links/buttons inside are not focusable before they appear
                  inert={!visible}
                >
                  {token.node}
                </span>
              );

              // A word directly after an element (", " / "." without space) must not
              // wrap onto the next line on its own, so both share a nowrap span
              const next = paragraph[position + 1];
              const glued = next?.token.kind === "word" && !next.token.spaceBefore ? next : undefined;

              return (
                <Fragment key={index}>
                  {token.spaceBefore ? " " : ""}
                  {glued && glued.token.kind === "word" ? (
                    <span className="whitespace-nowrap">
                      {element}
                      {caretAfter(index)}
                      {renderWord(glued.token, glued.index)}
                      {caretAfter(glued.index)}
                    </span>
                  ) : (
                    <>
                      {element}
                      {caretAfter(index)}
                    </>
                  )}
                </Fragment>
              );
            })}
          </Tag>
        ))}
        {children}
      </div>
    </StreamingContext>
  );
}

type StreamingRevealProps = {
  /** Position in a staggered group; each index waits `stagger` ms longer */
  index?: number;
  /** Milliseconds between staggered items */
  stagger?: number;
  className?: string;
  children: React.ReactNode;
};

/**
 * Content that fades up once the surrounding <StreamingText> is done
 * (actions, follow-ups, sources, …). It keeps its space while hidden, so
 * nothing jumps when it appears.
 */
export function StreamingReveal({ index = 0, stagger = 90, className, children }: StreamingRevealProps) {
  const { done, animated } = useStreamingText();

  if (!animated) return <div className={className}>{children}</div>;

  return (
    <div
      className={cn(done ? "stream-fade-up" : "stream-token", className)}
      style={done ? { animationDelay: `${index * stagger}ms` } : undefined}
      inert={!done}
    >
      {children}
    </div>
  );
}
