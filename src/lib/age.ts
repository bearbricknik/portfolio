/**
 * Birth: 14.10.1997, 00:22 in Germany. Mid-October is still summer time
 * (CEST, UTC+2), so in UTC that's 13.10.1997 22:22 — and every birthday falls
 * into summer time too, so the anniversary is always 22:22 UTC.
 */
export const BIRTH = new Date("1997-10-13T22:22:00Z");

const SECONDS_PER_DAY = 86_400;

function anniversary(year: number) {
  return new Date(
    Date.UTC(year, BIRTH.getUTCMonth(), BIRTH.getUTCDate(), BIRTH.getUTCHours(), BIRTH.getUTCMinutes()),
  );
}

/**
 * Age as full years since birth, full days since the last birthday and the
 * seconds since the last full day (0–86399).
 */
export function getAge(now: Date) {
  let years = now.getUTCFullYear() - BIRTH.getUTCFullYear();
  if (anniversary(BIRTH.getUTCFullYear() + years) > now) years -= 1;

  const lastBirthday = anniversary(BIRTH.getUTCFullYear() + years);
  const elapsed = Math.floor((now.getTime() - lastBirthday.getTime()) / 1000);

  return {
    years,
    days: Math.floor(elapsed / SECONDS_PER_DAY),
    seconds: elapsed % SECONDS_PER_DAY,
  };
}

const BERLIN_MONTH_DAY = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Berlin",
  month: "2-digit",
  day: "2-digit",
});

/** True on 14 October (German time), the birthday */
export function isBirthday(now: Date) {
  return BERLIN_MONTH_DAY.format(now) === "10-14";
}
