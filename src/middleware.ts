import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths that do not require authentication
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/logo.png") ||
    pathname === "/manifest.json" ||
    pathname === "/sw.js" ||
    pathname === "/setup" ||
    pathname.startsWith("/api/setup") ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname.startsWith("/portal/quote") ||
    pathname.startsWith("/api/portal") ||
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/api/auth/logout")
  ) {
    return NextResponse.next();
  }

  // Allow root '/' to be handled by app/page.tsx which directs to /setup or /quotes based on initialization status
  if (pathname === "/") {
    return NextResponse.next();
  }

  // Check for session cookie
  const sessionToken =
    request.cookies.get("asf_session")?.value ||
    request.cookies.get("xero_session")?.value;

  // Protect internal HTML pages
  const isProtectedPage =
    pathname.startsWith("/quotes") ||
    pathname.startsWith("/contacts") ||
    pathname.startsWith("/settings");

  if (isProtectedPage && !sessionToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
