import { getLocale } from "next-intl/server";

import { INTRO_TIMING } from "@/lib/intro-timing";

/*
 * Apple's handwritten greeting in the visitor's language: "hello", in German
 * "hallo" (paths from Apple's lettering, via github.com/JaceThings/SF-Hello).
 * Animated with CSS (globals.css), so the intro starts with the prerendered
 * HTML instead of waiting for hydration. The strokes are drawn in turn; both
 * greetings are fully written at INTRO_TIMING.helloWrittenAt, which the
 * streaming text is timed against.
 */

const HELLO_H =
  "M8.69214 166.553C36.2393 151.239 61.3409 131.548 89.8191 98.0295C109.203 75.1488 119.625 49.0228 120.122 31.0026C120.37 17.6036 113.836 7.43883 101.759 7.43883C88.3598 7.43883 79.9231 17.6036 74.7122 40.9363C69.005 66.5793 64.7866 96.0036 54.1166 190.356";
const HELLO_ELLO =
  "M55.1624 181.135C60.6251 133.114 81.4118 98.0479 107.963 98.0479C123.844 98.0479 133.937 110.703 131.071 128.817C129.457 139.487 127.587 150.405 125.408 163.06C122.869 178.941 130.128 191.348 152.122 191.348C184.197 191.348 219.189 173.523 237.097 145.915C243.198 136.509 245.68 128.073 245.928 119.884C246.176 104.996 237.739 93.8296 222.851 93.8296C203.992 93.8296 189.6 115.17 189.6 142.465C189.6 171.745 205.481 192.341 239.208 192.341C285.066 192.341 335.86 137.292 359.199 75.8585C365.788 58.513 368.26 42.4065 368.26 31.1512C368.26 17.8057 364.042 7.55823 352.131 7.55823C340.469 7.55823 332.777 16.6141 325.829 30.9129C317.688 47.4967 311.667 71.4162 309.203 98.4549C303 166.301 316.896 191.348 349.936 191.348C390 191.348 434.542 135.534 457.286 75.6686C463.803 58.513 466.275 42.4065 466.275 31.1512C466.275 17.8057 462.057 7.55823 450.146 7.55823C438.484 7.55823 430.792 16.6141 423.844 30.9129C415.703 47.4967 409.682 71.4162 407.218 98.4549C401.015 166.301 414.911 191.348 444.416 191.348C473.874 191.348 489.877 165.67 499.471 138.402C508.955 111.447 520.618 94.8221 544.935 94.8221C565.035 94.8221 580.916 109.71 580.916 137.75C580.916 168.768 560.792 192.093 535.362 192.341C512.984 192.589 498.285 174.475 499.774 147.179C501.511 116.907 519.873 94.8221 543.943 94.8221C557.839 94.8221 569.51 100.999 578.682 107.725C603.549 125.866 622.709 114.656 630.047 96.7186";

const HALLO_H_STEM =
  "M-87.4,84.5 C23.4,149.7 119.3,231.6 226.2,376.4 C301.3,478 338,569.4 340,642.2 C341,696.2 315,737.2 266,737.2 C212,737.2 178,696.2 157,602.2 C134,498.8 117,380.2 74,0";
const HALLO_H_ARCH =
  "M78.2,37.2 C99.4,223.6 184,372 291,372 C355,372 395.7,321 384.1,248 C377.6,205 365.9,155 359.2,106 C351,44 374.3,-4 446.6,-4 C548.8,-4 610,106.6 643.2,223";
const HALLO_A_BOWL =
  "M958.6,312.4 C939,357.5 897.3,388 831,388 C721,388 638.3,278 632.9,160 C628.2,52 678,-8.7 749,-8 C849.7,-7 923.8,92 956.9,301.4 C960.9,327.2 965.2,354.2 969.2,380";
const HALLO_A_LLO =
  "M969.2,380 C965.1,353.8 961,327.6 956.8,301.4 C938.8,186.8 930.5,141.6 931.4,112 C933.4,43 958.3,-4 1036.8,-4 C1172.9,-4 1360.6,224.9 1450.9,462.6 C1477,531.3 1487,596.2 1487,641.6 C1487,695.4 1470,736.7 1422,736.7 C1375,736.7 1344,700.2 1316,642.6 C1283.2,575.7 1258.9,479.3 1249,370.4 C1224,96.9 1280,-4 1413.2,-4 C1574.6,-4 1754.1,220.9 1845.8,462.2 C1872,531.3 1882,596.2 1882,641.6 C1882,695.4 1865,736.7 1817,736.7 C1770,736.7 1739,700.2 1711,642.6 C1678.2,575.7 1653.9,479.3 1644,370.4 C1619,96.9 1675,-4 1793.9,-4 C1912.6,-4 1977.1,99.5 2015.8,209.4 C2054,318 2101,385 2199,385 C2280,385 2344,325 2344,212 C2344,87 2262.9,-7 2160.4,-8 C2070.2,-9 2011,64 2017,174 C2024,296 2098,385 2195,385 C2251,385 2298,360.1 2335,333 C2435.2,259.9 2512.4,305.1 2542,377.4";

type Stroke = {
  d: string;
  /** When drawing starts and how long it takes (ms) */
  delay: number;
  duration: number;
  easing: string;
  /** Fade-in at the start (ms); 0 = appears with the first bit of line */
  fade: number;
};

type Greeting = { viewBox: string; strokeWidth: number; transform?: string; strokes: Stroke[] };

const T = INTRO_TIMING;

const HELLO: Greeting = {
  viewBox: "0 0 638 200",
  strokeWidth: 14.8883,
  strokes: [
    { d: HELLO_H, delay: 0, duration: T.helloHDraw, easing: "ease-in-out", fade: 400 },
    { d: HELLO_ELLO, delay: T.helloElloDelay, duration: T.helloElloDraw, easing: "ease-in-out", fade: 700 },
  ],
};

// Lengths of the four "hallo" strokes (in the path's units)
const HALLO_LENGTHS = [1658, 1238, 1205, 6333];

/**
 * "hallo" in four strokes that continue one another (h stem, h arch into the
 * a, a bowl, a stem into "llo"). Each gets its share of the time by length,
 * easing in on the first and out on the last, so the pen moves at an even
 * pace and finishes together with "hello".
 */
function hallo(): Greeting {
  const paths = [HALLO_H_STEM, HALLO_H_ARCH, HALLO_A_BOWL, HALLO_A_LLO];
  const total = HALLO_LENGTHS.reduce((sum, length) => sum + length, 0);
  let delay = 0;
  const strokes = paths.map((d, index) => {
    const duration = Math.round((T.helloWrittenAt * HALLO_LENGTHS[index]) / total);
    const easing = index === 0 ? "ease-in" : index === paths.length - 1 ? "ease-out" : "linear";
    const stroke = { d, delay, duration, easing, fade: index === 0 ? 400 : 0 };
    delay += duration;
    return stroke;
  });
  return {
    // Room around the paths for the round line ends (half the stroke width and a bit)
    viewBox: "-127.4 -49 2709.4 826.2",
    strokeWidth: 60,
    // The source paths are y-up
    transform: "scale(1, -1) translate(0, -728.156)",
    strokes,
  };
}

const GREETINGS: Record<string, Greeting> = { en: HELLO, de: hallo() };

export async function IntroOverlay() {
  const locale = await getLocale();
  const { viewBox, strokeWidth, transform, strokes } = GREETINGS[locale] ?? HELLO;

  return (
    <div
      aria-hidden
      className="intro-overlay fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md"
      style={
        {
          // Purely visual: never block clicks, even if the stylesheet fails to load
          pointerEvents: "none",
          // Timeline shared with the streaming text, see src/lib/intro-timing.ts
          "--intro-written-at": `${T.helloWrittenAt}ms`,
          "--intro-fade-out": `${T.overlayFadeOut}ms`,
        } as React.CSSProperties
      }
    >
      <svg
        className="h-10 sm:h-14"
        xmlns="http://www.w3.org/2000/svg"
        viewBox={viewBox}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      >
        <g transform={transform}>
          {strokes.map(({ d, delay, duration, easing, fade }, index) => (
            <path
              key={index}
              d={d}
              pathLength={1}
              className="intro-path"
              style={
                {
                  "--draw-delay": `${delay}ms`,
                  "--draw-duration": `${duration}ms`,
                  "--draw-easing": easing,
                  "--draw-fade": `${fade}ms`,
                } as React.CSSProperties
              }
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
