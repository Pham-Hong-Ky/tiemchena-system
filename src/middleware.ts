import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only apply to /admin routes
  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    const isAuthenticated = await verifySessionToken(token);

    // If accessing login page
    if (pathname === "/admin/login") {
      // If already logged in, redirect to admin dashboard
      if (isAuthenticated) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      return NextResponse.next();
    }

    // For all other /admin routes, require authentication
    if (!isAuthenticated) {
      const loginUrl = new URL("/admin/login", request.url);
      if (pathname !== "/admin") {
        loginUrl.searchParams.set("from", pathname);
      }
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
