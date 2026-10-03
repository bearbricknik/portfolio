import { NextResponse } from "next/server";

import { getContributions, GITHUB_REVALIDATE } from "@/lib/github/contributions.server";

/**
 * The combined contribution calendar as JSON: dates, counts and levels only
 * (no account names, repositories or tokens). Runs per request (not prerendered,
 * so a failure at build time can't get stuck); GitHub's answer is cached by
 * the fetch cache, the response by the CDN, both hourly.
 */
export async function GET() {
  try {
    const calendar = await getContributions();
    return NextResponse.json(calendar, {
      headers: { "cache-control": `public, s-maxage=${GITHUB_REVALIDATE}, stale-while-revalidate=${GITHUB_REVALIDATE}` },
    });
  } catch {
    // The reason is logged on the server; the browser only learns that it failed
    return NextResponse.json(
      { message: "Contributions unavailable" },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
}
