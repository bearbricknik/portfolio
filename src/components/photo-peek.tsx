"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";

import { Polaroid, type PolaroidPhoto } from "@/components/polaroid";

// Only with a mouse and room next to the text; elsewhere photos sit inline
// (match it with `pointer-fine:md:` in Tailwind)
const PEEK_QUERY = "(pointer: fine) and (min-width: 768px)";
// Where the polaroid hangs relative to the cursor (px): to the right, a bit above
const OFFSET = { x: 24, y: -70 };
// Kept clear of the window's right edge (polaroid md, landscape ≈ 196px + tilt)
const EDGE = 216;
const FOLLOW = { stiffness: 350, damping: 35, mass: 0.6 };
// The cursor has to rest on an entry this long (ms) before its photo appears,
// so quickly passing over the list doesn't flash photos
const SHOW_DELAY = 300;

type Peek = { photo: PolaroidPhoto; tilt: number };

type PhotoPeekContextValue = {
  /** Whether photos follow the cursor here; if not, show them inline */
  enabled: boolean;
  show: (photo: PolaroidPhoto, tilt?: number) => void;
  hide: () => void;
};

const PhotoPeekContext = createContext<PhotoPeekContextValue | null>(null);

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(PEEK_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

/**
 * A polaroid that follows the cursor while something with a photo is hovered
 * (e.g. a CV entry). Wrap the list in it and call `usePhotoPeek()` in the items.
 */
export function PhotoPeekProvider({ children }: { children: ReactNode }) {
  const enabled = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(PEEK_QUERY).matches,
    () => false,
  );
  const reducedMotion = useReducedMotion();
  const [peek, setPeek] = useState<Peek | null>(null);
  const [visible, setVisible] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const followX = useSpring(x, FOLLOW);
  const followY = useSpring(y, FOLLOW);

  useEffect(() => {
    if (!enabled) return;
    const onMove = (event: PointerEvent) => {
      x.set(Math.min(event.clientX + OFFSET.x, window.innerWidth - EDGE));
      y.set(event.clientY + OFFSET.y);
      // Without motion the polaroid sits right at the cursor
      if (reducedMotion) {
        followX.jump(x.get());
        followY.jump(y.get());
      }
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [enabled, reducedMotion, x, y, followX, followY]);

  // While waiting to appear: the photo to show once the delay is over
  const pending = useRef<{ timer: number; peek: Peek } | null>(null);
  const cancelPending = useCallback(() => {
    if (pending.current) window.clearTimeout(pending.current.timer);
    pending.current = null;
  }, []);
  useEffect(() => cancelPending, [cancelPending]);

  const show = useCallback(
    (photo: PolaroidPhoto, tilt = 3) => {
      const next = { photo, tilt };
      const apply = (target: Peek) =>
        setPeek((current) => (current?.photo.src === target.photo.src && current.tilt === target.tilt ? current : target));

      // Already showing (moving from one entry to the next): switch right away
      if (visible) return apply(next);
      // Still waiting: keep the timer, just remember the latest photo
      if (pending.current) {
        pending.current.peek = next;
        return;
      }
      const timer = window.setTimeout(() => {
        const target = pending.current?.peek ?? next;
        pending.current = null;
        // Appearing: start at the cursor instead of flying in from the last spot
        followX.jump(x.get());
        followY.jump(y.get());
        apply(target);
        setVisible(true);
      }, reducedMotion ? 0 : SHOW_DELAY);
      pending.current = { timer, peek: next };
    },
    [visible, reducedMotion, x, y, followX, followY],
  );
  const hide = useCallback(() => {
    cancelPending();
    setVisible(false);
  }, [cancelPending]);
  const value = useMemo(() => ({ enabled, show, hide }), [enabled, show, hide]);

  return (
    <PhotoPeekContext.Provider value={value}>
      {children}
      {enabled &&
        createPortal(
          <motion.div
            aria-hidden
            className="pointer-events-none fixed top-0 left-0 z-40"
            style={{ x: followX, y: followY }}
            initial={false}
            animate={{ opacity: visible ? 1 : 0 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
          >
            <motion.div
              initial={false}
              animate={{ rotate: peek?.tilt ?? 0, scale: visible ? 1 : 0.92 }}
              transition={{ type: "spring", stiffness: 320, damping: 24 }}
            >
              {peek && (
                // Keyed by photo: a new photo resolves out of the blur again
                <Polaroid
                  key={typeof peek.photo.src === "string" ? peek.photo.src : peek.photo.src.src}
                  photo={{ ...peek.photo, aspect: "landscape" }}
                  size="md"
                  reveal
                  reducedMotion={reducedMotion ?? false}
                />
              )}
            </motion.div>
          </motion.div>,
          document.body,
        )}
    </PhotoPeekContext.Provider>
  );
}

/** Show and hide the cursor photo from inside a `PhotoPeekProvider` */
export function usePhotoPeek() {
  const context = useContext(PhotoPeekContext);
  if (!context) throw new Error("usePhotoPeek needs a PhotoPeekProvider around it");
  return context;
}
