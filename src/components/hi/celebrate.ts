import confetti from "canvas-confetti";

const HEART_COLORS = ["#f43f5e", "#fb7185", "#ec4899", "#f9a8d4"];
const DURATION = 2000;

// A heart drawn as a vector path and filled with HEART_COLORS. Not the ❤️
// emoji via shapeFromText: Safari on iOS turns the emoji bitmap into white
// blocks (the bitmap's background shows), a path renders the same everywhere.
const HEART_PATH =
  "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z";

let heartShape: confetti.Shape | null | undefined;
/** The heart shape, built once; null if the browser can't (plain confetti then) */
function heart() {
  if (heartShape === undefined) {
    try {
      heartShape = confetti.shapeFromPath({ path: HEART_PATH });
    } catch {
      heartShape = null;
    }
  }
  return heartShape;
}

/** Two seconds of hearts raining in from both sides (skipped with reduced motion) */
export function celebrate() {
  const shape = heart();
  const end = Date.now() + DURATION;
  const defaults = {
    startVelocity: 30,
    spread: 360,
    ticks: 60,
    zIndex: 9999,
    scalar: 2,
    colors: HEART_COLORS,
    ...(shape && { shapes: [shape] }),
    disableForReducedMotion: true,
  };
  const random = (min: number, max: number) => Math.random() * (max - min) + min;

  const interval = window.setInterval(() => {
    const left = end - Date.now();
    if (left <= 0) return window.clearInterval(interval);
    const particleCount = Math.round(40 * (left / DURATION));
    confetti({ ...defaults, particleCount, origin: { x: random(0.1, 0.3), y: Math.random() - 0.2 } });
    confetti({ ...defaults, particleCount, origin: { x: random(0.7, 0.9), y: Math.random() - 0.2 } });
  }, 250);
}

/** A small burst of hearts from one point (viewport fractions 0–1), e.g. out of an element */
export function heartBurst(x: number, y: number) {
  const shape = heart();
  confetti({
    particleCount: 18,
    spread: 70,
    startVelocity: 22,
    gravity: 0.6,
    ticks: 90,
    scalar: 1.4,
    origin: { x, y },
    zIndex: 9999,
    colors: HEART_COLORS,
    ...(shape && { shapes: [shape] }),
    disableForReducedMotion: true,
  });
}
