"use client";

import { Children, isValidElement, type ReactNode, useCallback, useEffect, useEffectEvent, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import { IconReact, IconVercel } from "@central-icons-react/round-outlined-radius-3-stroke-1.5";

import golf from "@/assets/photos/golf/golf-1.jpg";
import { Badge } from "@/components/inline-badge";
import { Polaroid } from "@/components/polaroid";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Which demo a post's "demo" block shows (Sanity field `kind`) */
export type DemoKind = "easing" | "blurText" | "spring";

// The site's curve and spring, as used everywhere else
const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";
const SPRING = { type: "spring", stiffness: 320, damping: 24 } as const;

/** An interactive example inside a post, by its kind */
export function PostDemo({ kind }: { kind: DemoKind }) {
  if (kind === "easing") return <EasingDemo />;
  if (kind === "blurText") return <BlurTextDemo />;
  if (kind === "spring") return <SpringDemo />;
  return null;
}

/** The frame of every demo: the stage on top, the controls below */
function DemoFrame({ children, controls }: { children: ReactNode; controls: ReactNode }) {
  return (
    <figure className="flex flex-col gap-4 rounded-xl border bg-muted/40 p-4">
      {children}
      <figcaption className="flex flex-wrap items-center gap-2">{controls}</figcaption>
    </figure>
  );
}

function DemoButton({ pressed, onClick, children }: { pressed?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      aria-pressed={pressed}
      onClick={onClick}
      data-cursor="pointer"
      className="rounded-full px-3 aria-pressed:bg-muted dark:aria-pressed:bg-input/80"
    >
      {children}
    </Button>
  );
}

function DemoHint({ children }: { children: ReactNode }) {
  return <span className="text-sm text-muted-foreground">{children}</span>;
}

/** Plays once when it scrolls into view, and again whenever `play` is called */
function usePlayOnView(play: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const onView = useEffectEvent(play);
  useEffect(() => {
    if (inView) onView();
  }, [inView]);
  return ref;
}

/* Easing: ease-in next to the site's ease-out, same 400ms, optionally slowed down */

const BALLS = [
  { label: "easeIn", easing: "cubic-bezier(0.42, 0, 1, 1)", className: "bg-muted-foreground/40" },
  { label: "mySite", easing: EASE_OUT, className: "bg-foreground" },
] as const;

function EasingDemo() {
  const t = useTranslations("BlogDemos");
  const [slow, setSlow] = useState(false);
  const balls = useRef<(HTMLSpanElement | null)[]>([]);

  const play = useCallback(
    (slowMotion = slow) => {
      balls.current.forEach((ball, index) => {
        if (!ball?.parentElement) return;
        // From the left end of the track to the right one (4px inset each side)
        const distance = ball.parentElement.clientWidth - ball.offsetWidth - 8;
        ball.getAnimations().forEach((animation) => animation.cancel());
        ball.animate([{ transform: "translateX(0)" }, { transform: `translateX(${distance}px)` }], {
          duration: 400 * (slowMotion ? 4 : 1),
          easing: BALLS[index].easing,
          fill: "forwards",
        });
      });
    },
    [slow],
  );
  const ref = usePlayOnView(play);

  return (
    <DemoFrame
      controls={
        <>
          <DemoButton onClick={() => play()}>{t("play")}</DemoButton>
          <DemoButton
            pressed={slow}
            onClick={() => {
              setSlow(!slow);
              play(!slow);
            }}
          >
            {t("slowMotion")}
          </DemoButton>
          <DemoHint>{t("easingHint")}</DemoHint>
        </>
      }
    >
      <div ref={ref} className="grid grid-cols-[6rem_1fr] items-center gap-x-3 gap-y-3">
        {BALLS.map((ball, index) => (
          <div key={ball.label} className="contents">
            <span className="text-sm text-muted-foreground">{t(ball.label)}</span>
            <div className="relative h-6 rounded-full bg-foreground/5">
              <span
                ref={(element) => {
                  balls.current[index] = element;
                }}
                className={cn("absolute top-1 left-1 size-4 rounded-full", ball.className)}
              />
            </div>
          </div>
        ))}
      </div>
    </DemoFrame>
  );
}

/* Blur: the streaming text's words resolving out of blur, or just popping in */

type Token = { kind: "word"; text: string } | { kind: "space"; text: string } | { kind: "node"; node: ReactNode };

function tokenize(content: ReactNode): Token[] {
  return Children.toArray(content).flatMap((item): Token[] =>
    typeof item === "string"
      ? item
          .split(/(\s+)/)
          .filter(Boolean)
          .map((text) => (/^\s+$/.test(text) ? { kind: "space", text } : { kind: "word", text }))
      : isValidElement(item)
        ? [{ kind: "node", node: item }]
        : [],
  );
}

function BlurTextDemo() {
  const t = useTranslations("BlogDemos");
  const [blur, setBlur] = useState(true);
  // Every play remounts the words, which restarts their animations; 0 = not yet
  const [run, setRun] = useState(0);
  const play = useCallback(() => setRun((current) => current + 1), []);
  const ref = usePlayOnView(play);

  const tokens = tokenize(
    t.rich("sample", {
      next: (chunks) => (
        <Badge icon={IconVercel} color="text-foreground">
          {chunks}
        </Badge>
      ),
      react: (chunks) => (
        <Badge icon={IconReact} color="text-cyan-500">
          {chunks}
        </Badge>
      ),
    }),
  );

  // Same timing as the streaming text: one token every 55ms (spaces don't count)
  const delays = tokens.reduce<number[]>((list, token) => [...list, (list.at(-1) ?? -1) + (token.kind === "space" ? 0 : 1)], []);
  const animation = (kind: "word" | "node") =>
    run === 0 ? "stream-token" : !blur ? "stream-instant" : kind === "word" ? "stream-word" : "stream-pop";

  return (
    <DemoFrame
      controls={
        <>
          <DemoButton onClick={play}>{t("play")}</DemoButton>
          <span role="group" aria-label={t("variant")} className="flex gap-2">
            {[true, false].map((value) => (
              <DemoButton
                key={String(value)}
                pressed={blur === value}
                onClick={() => {
                  setBlur(value);
                  play();
                }}
              >
                {value ? t("withBlur") : t("withoutBlur")}
              </DemoButton>
            ))}
          </span>
        </>
      }
    >
      <div ref={ref}>
        <p key={run} className="min-h-[3.25em]">
          {tokens.map((token, position) =>
            token.kind === "space" ? (
              token.text
            ) : (
              <span
                key={position}
                className={cn("inline-block whitespace-pre", animation(token.kind))}
                style={{ animationDelay: `${delays[position] * 55}ms` }}
              >
                {token.kind === "word" ? token.text : token.node}
              </span>
            ),
          )}
        </p>
      </div>
    </DemoFrame>
  );
}

/* Spring: a polaroid straightening up on hover, with the site's spring or instantly */

function SpringDemo() {
  const t = useTranslations("BlogDemos");
  const [spring, setSpring] = useState(true);
  const reducedMotion = useReducedMotion() ?? false;

  return (
    <DemoFrame
      controls={
        <>
          <span role="group" aria-label={t("variant")} className="flex gap-2">
            {[true, false].map((value) => (
              <DemoButton key={String(value)} pressed={spring === value} onClick={() => setSpring(value)}>
                {value ? t("spring") : t("noAnimation")}
              </DemoButton>
            ))}
          </span>
          <DemoHint>{t("springHint")}</DemoHint>
        </>
      }
    >
      <div className="grid place-items-center pt-4 pb-1">
        <motion.div
          tabIndex={0}
          className="rounded-lg shadow-lg outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          initial={{ rotate: -6 }}
          whileHover={{ rotate: 0, y: -6, scale: 1.06 }}
          whileFocus={{ rotate: 0, y: -6, scale: 1.06 }}
          transition={spring && !reducedMotion ? SPRING : { duration: 0 }}
        >
          <Polaroid size="md" photo={{ src: golf, alt: t("photoAlt"), caption: t("hoverMe") }} />
        </motion.div>
      </div>
    </DemoFrame>
  );
}
