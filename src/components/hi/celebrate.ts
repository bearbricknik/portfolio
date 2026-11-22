import confetti from "canvas-confetti";

// Fallback colors when the browser can't draw the heart emoji as a shape
const HEART_COLORS = ["#f43f5e", "#fb7185", "#ec4899", "#f9a8d4"];
const DURATION = 2000;

/** Two seconds of hearts raining in from both sides (skipped with reduced motion) */
export function celebrate() {
  let heart: confetti.Shape | undefined;
  try {
    heart = confetti.shapeFromText({ text: "❤️", scalar: 2 });
  } catch {
    // Older browsers without text shapes: regular confetti in rose colors
  }
  const end = Date.now() + DURATION;
  const defaults = {
    startVelocity: 30,
    spread: 360,
    ticks: 60,
    zIndex: 9999,
    scalar: 2,
    colors: HEART_COLORS,
    ...(heart && { shapes: [heart] }),
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
  let heart: confetti.Shape | undefined;
  try {
    heart = confetti.shapeFromText({ text: "❤️", scalar: 1.4 });
  } catch {
    // See celebrate()
  }
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
    ...(heart && { shapes: [heart] }),
    disableForReducedMotion: true,
  });
}
