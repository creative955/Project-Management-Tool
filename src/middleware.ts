import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_LAST_ORG } from "@/config/app";

const SESSION_COOKIES = ["authjs.session-token", "__Secure-authjs.session-token"];

/**
 * Edge-safe gate: only checks that a session cookie exists. The session itself is
 * validated against the database in getOrgContext() / orgAction().
 */
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = SESSION_COOKIES.some((name) => request.cookies.has(name));

  if (!hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?callbackUrl=${encodeURIComponent(`${pathname}${search}`)}`;
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next();
  const match = /^\/w\/([a-z0-9-]+)(?:\/|$)/.exec(pathname);
  if (match) {
    response.cookies.set(COOKIE_LAST_ORG, match[1], {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return response;
}

export const config = {
  matcher: ["/w/:path*", "/onboarding"],
};
