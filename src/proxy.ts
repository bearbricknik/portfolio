import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Next.js 16: "middleware" is now called "proxy" (same functionality).
export function proxy(request: NextRequest) {
  // Example: expose the pathname to Server Components via `headers()`
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    // Skip Next.js internals, API routes, metadata routes and static files
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|opengraph-image|twitter-image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
