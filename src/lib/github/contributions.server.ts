import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { smoothContributions, withLevels } from "@/lib/github/calendar";
import type { ContributionCalendar } from "@/lib/github/types";

/*
 * GitHub contributions of several accounts, added up per day.
 * Accounts come from env pairs GITHUB_TOKEN_<NAME> / GITHUB_USERNAME_<NAME>
 * (e.g. _BEARBRICKNICK, _DEIN_BETRIEBSRAT); add a pair to add an account.
 * Tokens need no permissions: GitHub reports private contributions as
 * counts (with "Private contributions" on in the profile).
 */

const ENDPOINT = "https://api.github.com/graphql";
// GitHub updates the calendar a few times an hour at most
export const GITHUB_REVALIDATE = 3600;
export const GITHUB_TAG = "github:contributions";
const FETCH_TIMEOUT = 8000;

// Only what the calendar needs: dates and counts
const QUERY = `query ($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar { weeks { contributionDays { date contributionCount } } }
    }
  }
}`;

type Account = { name: string; token: string; login: string };
type GraphQLResponse = {
  data?: { user: { contributionsCollection: { contributionCalendar: { weeks: { contributionDays: { date: string; contributionCount: number }[] }[] } } } | null };
  errors?: { message: string }[];
};

/** Every account with both a token and a username in the env */
function accounts(): Account[] {
  return Object.keys(process.env)
    .filter((key) => key.startsWith("GITHUB_TOKEN_"))
    .map((key) => {
      const name = key.slice("GITHUB_TOKEN_".length);
      return { name, token: process.env[key] ?? "", login: process.env[`GITHUB_USERNAME_${name}`] ?? "" };
    })
    .filter((account) => account.token && account.login);
}

/** One account's days (date → count) */
async function fetchAccount({ token, login }: Account) {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { authorization: `bearer ${token}`, "content-type": "application/json", "user-agent": "huberdominik.com" },
    body: JSON.stringify({ query: QUERY, variables: { login } }),
    // A hanging GitHub must not hold up the request (failures aren't cached)
    signal: AbortSignal.timeout(FETCH_TIMEOUT),
  });
  if (!response.ok) throw new Error(`GitHub responded ${response.status}`);
  const json = (await response.json()) as GraphQLResponse;
  const calendar = json.data?.user?.contributionsCollection.contributionCalendar;
  if (!calendar) throw new Error(json.errors?.[0]?.message ?? "No contribution calendar");
  return calendar.weeks.flatMap((week) => week.contributionDays);
}

/**
 * The combined, evened-out calendar of all configured accounts (only the
 * smoothed counts leave this function). An account that fails
 * (expired token, renamed user) is left out and logged, without its token;
 * only when every account fails does this throw.
 */
export async function getContributions(): Promise<ContributionCalendar> {
  // Cached on the server and prerendered into the home page; refreshed hourly
  // (or by tag). A failure throws and isn't cached.
  "use cache";
  cacheLife("hours");
  cacheTag(GITHUB_TAG);

  const configured = accounts();
  if (!configured.length) throw new Error("No GitHub accounts configured (GITHUB_TOKEN_<NAME> + GITHUB_USERNAME_<NAME>)");

  const results = await Promise.allSettled(configured.map(fetchAccount));
  const counts = new Map<string, number>();
  results.forEach((result, index) => {
    if (result.status === "rejected") {
      console.error(`GitHub contributions for ${configured[index].name} failed:`, (result.reason as Error).message);
      return;
    }
    for (const day of result.value) counts.set(day.date, (counts.get(day.date) ?? 0) + day.contributionCount);
  });
  if (results.every((result) => result.status === "rejected")) throw new Error("GitHub contributions unavailable");

  const dates = [...counts.keys()].sort();
  const raw = dates.map((date) => ({ date, count: counts.get(date) ?? 0 }));
  // The site shows an evened-out year (same total), see smoothContributions
  const days = withLevels(smoothContributions(raw));

  return {
    total: days.reduce((sum, day) => sum + day.count, 0),
    from: dates[0],
    to: dates.at(-1)!,
    days,
  };
}
