"use client";

import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconBarsTwo } from "@central-icons-react/round-outlined-radius-3-stroke-1.5";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";

import { badgeClassName } from "@/components/inline-badge";
import { pageAt, PAGES, type PageKey } from "@/lib/pages";
import { cn } from "@/lib/utils";

// Seconds between two words streaming in
const STAGGER = 0.04;

// Hand-drawn loop, from the top left once around, ending a bit past the start
// and slightly inside it, like a quick pen stroke
const LOOP_START = 200; // degrees; 0 = right, 90 = bottom
const LOOP_SWEEP = 380;
// Superellipse exponent: 2 = ellipse, higher = squarer; hugs the pill-shaped badge
const LOOP_SQUARENESS = 2.6;

/** SVG path of the loop around a `width` × `height` box, in pixels */
function loopPath(width: number, height: number) {
  const cx = width / 2;
  const cy = height / 2;
  const steps = 96;
  const points: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = ((LOOP_START + LOOP_SWEEP * t) * Math.PI) / 180;
    // Starts a little outside, ends a little inside, with a gentle wobble
    const radius = 1 + 0.035 * (1 - 2 * t) + 0.012 * Math.sin(angle * 3);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const x = cx + (width / 2) * radius * Math.sign(cos) * Math.abs(cos) ** (2 / LOOP_SQUARENESS);
    const y = cy + (height / 2) * radius * Math.sign(sin) * Math.abs(sin) ** (2 / LOOP_SQUARENESS);
    points.push(`${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return `M${points.join("L")}`;
}

/** Hand-drawn circle around the current page, drawn once its badge is in */
function HandCircle({ delay }: { delay: number }) {
  const reducedMotion = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  // Drawn in real pixels (measured), so the stroke stays even and round
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) =>
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height }),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    // A box a little larger than the badge; the loop is drawn around it
    <span ref={ref} aria-hidden className="pointer-events-none absolute -inset-x-2 -inset-y-1.5 text-muted-foreground">
      {size && (
        <svg width={size.width} height={size.height} className="absolute inset-0 overflow-visible">
          <motion.path
            d={loopPath(size.width, size.height)}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: reducedMotion ? 1 : 0, opacity: reducedMotion ? 1 : 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{
              pathLength: { duration: 0.8, ease: [0.65, 0, 0.35, 1], delay },
              opacity: { duration: 0.1, delay },
            }}
          />
        </svg>
      )}
    </span>
  );
}

// In the menu the badges stand on their own: squarer, with more room inside
const menuBadgeClassName = "gap-1.5 rounded-sm px-2 py-1";

function NavBadge({
  target,
  current,
  circleDelay = 0,
  children,
}: {
  target: PageKey;
  current: boolean;
  circleDelay?: number;
  children: ReactNode;
}) {
  const { href, icon: Icon, color } = PAGES[target];
  const content = (
    <>
      <Icon className={cn("size-3.5", color)} />
      {children}
    </>
  );

  // The current page isn't a link; the circle marks it instead
  if (current) {
    return (
      <span aria-current="page" className={cn(badgeClassName, menuBadgeClassName, "relative")}>
        {content}
        <HandCircle delay={circleDelay} />
      </span>
    );
  }
  return (
    <Link href={href} className={cn(badgeClassName, menuBadgeClassName, "transition-colors hover:bg-muted")}>
      {content}
    </Link>
  );
}

/**
 * Splits rich text into words and badges, each fading in one after another
 * like the StreamingText intros. Whitespace stays plain text, so punctuation
 * stays glued to the badge before it. (Not StreamingText itself: that one
 * registers as an active stream and would hide the footer while it runs.)
 */
function StreamedSentence({
  content,
  current,
  note,
}: {
  content: ReactNode;
  current: PageKey | null;
  /** Handwritten note below the sentence, written once the circle is drawn */
  note: string;
}) {
  const reducedMotion = useReducedMotion();
  let index = 0;
  type Token = string | { node: ReactNode; index: number; current?: boolean };
  const tokens = Children.toArray(content).flatMap((node): Token[] => {
    if (typeof node === "string") {
      return node.split(/(\s+)/).filter(Boolean).map((part) => (/^\s+$/.test(part) ? part : { node: part, index: index++ }));
    }
    const isCurrent = isValidElement<{ target: PageKey }>(node) && node.props.target === current;
    return [{ node, index: index++, current: isCurrent }];
  });

  // The circle starts once its badge has mostly faded in
  const currentToken = tokens.find((token) => typeof token !== "string" && token.current);
  const circleDelay = currentToken && typeof currentToken !== "string" ? currentToken.index * STAGGER + 0.3 : null;

  const noteDelay = Math.max(index * STAGGER + 0.35, (circleDelay ?? 0) + 0.8) + 0.1;

  return (
    <>
      <motion.p
        initial="hidden"
        animate="shown"
        variants={{ hidden: {}, shown: { transition: { staggerChildren: reducedMotion ? 0 : STAGGER } } }}
      >
        {tokens.map((token) =>
          typeof token === "string" ? (
            token
          ) : (
            <motion.span
              key={token.index}
              variants={{
                hidden: reducedMotion ? { opacity: 1 } : { opacity: 0, filter: "blur(4px)" },
                shown: { opacity: 1, filter: "blur(0px)", transition: { duration: 0.35 } },
              }}
            >
              {token.current
                ? cloneElement(token.node as ReactElement<{ circleDelay?: number }>, { circleDelay: circleDelay ?? 0 })
                : token.node}
            </motion.span>
          ),
        )}
      </motion.p>
      {circleDelay !== null && (
        // The popover only grows for the note once it's written: its space
        // opens smoothly first, then the note fades into it
        <motion.div
          aria-hidden
          className="overflow-hidden"
          initial={reducedMotion ? false : { height: 0 }}
          animate={{ height: "auto" }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1], delay: reducedMotion ? 0 : noteDelay }}
        >
          <motion.span
            // pt/pb: room for the tilt, which overflow-hidden would clip
            className="block -rotate-2 pt-1.5 pb-0.5 text-right font-handwriting text-base text-muted-foreground"
            initial={reducedMotion ? false : { opacity: 0, y: 4, filter: "blur(3px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.4, delay: reducedMotion ? 0 : noteDelay + 0.15 }}
          >
            {note} ↑
          </motion.span>
        </motion.div>
      )}
    </>
  );
}

/**
 * The site navigation: a button next to the name that opens a sentence in
 * which every page is a badge ("I'd like to [know who you are], …"). The
 * current page is circled by hand.
 */
export function SiteNav() {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close after navigating (adjusting state during render, no effect needed)
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  // Close on Escape and on clicks outside
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  const current = pageAt(pathname);

  // One badge per page; the page keys are the rich-text tags in `Nav.sentence`
  const badges = Object.fromEntries(
    (Object.keys(PAGES) as PageKey[]).map((key) => [
      key,
      (chunks: ReactNode) => (
        <NavBadge target={key} current={key === current}>
          {chunks}
        </NavBadge>
      ),
    ]),
  );

  return (
    <div ref={ref}>
      <button
        type="button"
        aria-label={open ? t("close") : t("open")}
        aria-expanded={open}
        aria-controls="site-nav"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
          open && "bg-muted text-foreground",
        )}
      >
        <IconBarsTwo className="size-4" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.nav
            id="site-nav"
            aria-label={t("label")}
            // Hides the cursor label while open, so it doesn't overlap the menu
            data-cursor-overlay
            // Right-aligned 8px below the 28px button (top-9, measured from the
            // header, which is the positioning context), never wider than the content column
            className="absolute top-9 right-0 z-30 w-88 max-w-full origin-top-right rounded-xl border bg-card p-4 leading-loose shadow-lg"
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -6, filter: "blur(6px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: -4, filter: "blur(4px)" }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          >
            <StreamedSentence content={t.rich("sentence", badges)} current={current} note={t("here")} />
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  );
}
