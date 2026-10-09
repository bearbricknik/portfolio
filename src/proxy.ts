import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { isLocale, LOCALE_COOKIE } from "@/i18n/config";
import { resolveLocale } from "@/i18n/negotiate";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * Addresses carry no language (/cv, /blog/…), but every page is prerendered
 * once per language under an internal [locale] segment. This picks the
 * visitor's language (cookie → browser language → country → default) and
 * rewrites to that version: the page comes straight from the cache, and the
 * address in the browser stays the same.
 *
 * Next.js 16: "middleware" is now called "proxy" (same functionality).
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // The internal addresses (/de/cv) aren't meant to be visited: send them to
  // the public address and remember the language they asked for
  const [, first] = pathname.split("/");
  if (isLocale(first)) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(first.length + 1) || "/";
    const response = NextResponse.redirect(url);
    response.cookies.set(LOCALE_COOKIE, first, { path: "/", maxAge: COOKIE_MAX_AGE, sameSite: "lax" });
    return response;
  }

  const locale = resolveLocale({
    cookie: request.cookies.get(LOCALE_COOKIE)?.value,
    acceptLanguage: request.headers.get("accept-language"),
    country: request.headers.get("x-vercel-ip-country"),
  });

  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    // Only the site's pages: skip Next.js internals, API routes, the Studio,
    // the OG images, metadata routes and static files
    "/((?!api|studio|og|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|txt|xml|webmanifest)$).*)",
  ],
};
