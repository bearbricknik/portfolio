"use client";

import { useEffect, useId, useRef } from "react";
import { AnimatePresence, motion, useAnimate, useInView, useReducedMotion } from "motion/react";
import { IconHeart } from "@central-icons-react/round-filled-radius-3-stroke-1.5";

import { AnimatedNumber } from "@/components/animated-number";
import { useHiState } from "@/components/hi/hi-state";
import { badgeClassName } from "@/components/inline-badge";

/**
 * Inline "Pluspunkt" badge in the streamed text. It counts once it has really
 * appeared: in view and no longer hidden by the stream (StreamingText keeps
 * tokens that haven't streamed yet `inert`), so the counter ticks up together
 * with the badge popping in.
 */
export function PlusPoint({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  const id = useId();
  const inView = useInView(ref, { once: true, amount: 1 });
  const { collect } = useHiState();

  useEffect(() => {
    if (!inView) return;
    let frame = 0;
    const check = () => {
      if (ref.current && !ref.current.closest("[inert]")) collect(id);
      else frame = requestAnimationFrame(check);
    };
    check();
    return () => cancelAnimationFrame(frame);
  }, [inView, id, collect]);

  return (
    <span ref={ref} className={badgeClassName}>
      <IconHeart className="size-3.5 text-rose-500" />
      {children}
    </span>
  );
}

/** The number of plus points collected so far, rolling as it grows */
export function PlusTotal() {
  const { points } = useHiState();
  return (
    <span className="font-medium tabular-nums">
      <AnimatedNumber value={points} trend={1} />
    </span>
  );
}

/**
 * Floating tally at the bottom of the screen: appears with the first plus
 * point and gives a little hop whenever another one is collected.
 */
export function PlusCounter({ one, other }: { one: string; other: string }) {
  const { points } = useHiState();

  return (
    <AnimatePresence>
      {points > 0 && (
        <motion.div
          // Above the scroll fades (z-10) and the corner controls (z-20)
          className="pointer-events-none fixed inset-x-0 bottom-6 z-30 flex justify-center"
          initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        >
          <CounterPill points={points} label={points === 1 ? one : other} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CounterPill({ points, label }: { points: number; label: string }) {
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const reducedMotion = useReducedMotion();
  const previous = useRef(points);

  // A little hop for every new point (not on mount: the pill fades in then)
  useEffect(() => {
    if (points === previous.current) return;
    previous.current = points;
    if (reducedMotion) return;
    animate(scope.current, { scale: [1, 1.12, 1] }, { duration: 0.35, ease: "easeOut" });
  }, [points, reducedMotion, animate, scope]);

  return (
    <div
      ref={scope}
      className="flex items-center gap-1.5 rounded-full border bg-background/80 px-3 py-1.5 text-sm shadow-sm backdrop-blur-md"
      aria-live="polite"
    >
      <IconHeart className="size-4 text-rose-500" />
      <PlusTotal />
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}
