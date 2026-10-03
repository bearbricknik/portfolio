import type { ContributionDay, ContributionLevel } from "@/lib/github/types";

type Day = { date: string; count: number };

/*
 * Shaping the raw contribution counts for the calendar on the site. Pure
 * functions (no fetching), so they can run anywhere and be tested on their own.
 */

/** A stable pseudo-random number in [0, 1) per index (same picture on every visit) */
const jitter = (index: number) => {
  const x = Math.sin((index + 1) * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

const isWeekend = (date: string) => {
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
  return weekday === 0 || weekday === 6;
};

type SmoothOptions = {
  /** How far a week blends into its neighbours (Gaussian, in weeks) */
  sigmaWeeks?: number;
  /** Share of the year spread evenly over all weeks, so no stretch stays empty */
  baseline?: number;
  /** < 1 tones busy stretches down before they're scaled back (1 = off) */
  compress?: number;
};

/**
 * Evens out the year so busy and quiet stretches flow into each other, while
 * the total stays exactly the same. Weeks blend with their neighbours; within
 * a week the commits go to the days with a natural pattern (weekdays more,
 * weekends less, some days off, a little seeded scatter). Single days are no
 * longer exact; that's the point. `days` must be consecutive, from a Sunday.
 */
export function smoothContributions(days: Day[], { sigmaWeeks = 1.6, baseline = 0.35, compress = 0.6 }: SmoothOptions = {}): Day[] {
  const total = days.reduce((sum, day) => sum + day.count, 0);
  if (!total) return days;
  const weekCount = Math.ceil(days.length / 7);
  const weekly = Array.from({ length: weekCount }, (_, week) =>
    days.slice(week * 7, week * 7 + 7).reduce((sum, day) => sum + day.count, 0),
  );

  // 1 · Weeks: blend with the neighbouring weeks, tone peaks down, add a baseline
  const blended = weekly.map((_, week) => {
    let sum = 0;
    let weight = 0;
    for (let k = -6; k <= 6; k++) {
      const other = week + k;
      if (other < 0 || other >= weekCount) continue;
      const g = Math.exp(-(k * k) / (2 * sigmaWeeks * sigmaWeeks));
      sum += weekly[other] * g;
      weight += g;
    }
    return Math.pow(sum / weight, compress);
  });
  const blendedSum = blended.reduce((a, b) => a + b, 0) || 1;
  const weekTarget = blended.map((value) => ((1 - baseline) * value * total) / blendedSum + (baseline * total) / weekCount);

  // 2 · Days: a natural weekly pattern with scatter, some days without commits
  const shape = days.map((day, index) => {
    const weekend = isWeekend(day.date);
    if (jitter(index) < (weekend ? 0.45 : 0.12)) return 0;
    const scatter = jitter(index + 1000);
    return (weekend ? 0.35 : 1) * (0.25 + scatter * scatter * 2.2);
  });
  const spread = days.map((_, index) => {
    const week = Math.floor(index / 7);
    const weekShape = shape.slice(week * 7, week * 7 + 7).reduce((a, b) => a + b, 0) || 1;
    return (weekTarget[week] * shape[index]) / weekShape;
  });

  // Round with the largest remainders, so the total is unchanged
  const counts = spread.map(Math.floor);
  let missing = total - counts.reduce((a, b) => a + b, 0);
  spread
    .map((value, index) => ({ rest: value - Math.floor(value), index }))
    .sort((a, b) => b.rest - a.rest)
    .forEach(({ index }) => {
      if (missing > 0 && shape[index] > 0) {
        counts[index]++;
        missing--;
      }
    });
  return days.map((day, index) => ({ date: day.date, count: counts[index] }));
}

/**
 * Levels 0–4 for a calm calendar: most active days in the quiet steps 1–2,
 * step 3 for busier days, step 4 only for the top ~8%
 */
export function withLevels(days: Day[]): ContributionDay[] {
  const active = days.map((day) => day.count).filter(Boolean).sort((a, b) => a - b);
  const percentile = (p: number) => active[Math.floor(p * (active.length - 1))] ?? 0;
  const [p1, p2, p3] = [percentile(0.35), percentile(0.75), percentile(0.92)];
  const level = (count: number): ContributionLevel =>
    count === 0 ? 0 : count <= p1 ? 1 : count <= p2 ? 2 : count <= p3 ? 3 : 4;
  return days.map((day) => ({ ...day, level: level(day.count) }));
}
