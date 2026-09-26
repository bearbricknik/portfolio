/**
 * Timeline of the page intro, in milliseconds since page load. The "hello"
 * overlay (IntroOverlay + CSS in globals.css) and the first StreamingText both
 * derive their timing from here, so changing one value keeps them in sync.
 */
const HELLO_H_DRAW = 800;
const HELLO_ELLO_DELAY = 700;
const HELLO_ELLO_DRAW = 2800;

/** "hello" is fully written */
const HELLO_WRITTEN_AT = HELLO_ELLO_DELAY + HELLO_ELLO_DRAW;

/**
 * How long before "hello" is fully written the streaming text starts.
 * It streams behind the still blurred overlay and is already running when the
 * overlay fades out. 0 = start exactly when "hello" is done.
 */
const STREAM_LEAD = 800;

export const INTRO_TIMING = {
  helloHDraw: HELLO_H_DRAW,
  helloElloDelay: HELLO_ELLO_DELAY,
  helloElloDraw: HELLO_ELLO_DRAW,
  helloWrittenAt: HELLO_WRITTEN_AT,
  /** Overlay (blur) fades out right after "hello" is written */
  overlayFadeOut: 600,
  /** First StreamingText starts here (use as `notBefore`) */
  streamStart: HELLO_WRITTEN_AT - STREAM_LEAD,
} as const;
