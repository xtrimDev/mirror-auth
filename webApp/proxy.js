import { getUserFromEncryptedToken } from "@auth";
import { NextResponse } from "next/server";

export async function proxy(request) {
  const tokenCookie = request.cookies.get("authToken");
  const { pathname } = request.nextUrl;

  const isLoggedInRoute = pathname.startsWith("/dashboard");
  const isNotLoggedInRoute = (pathname.startsWith("/account/") || pathname.startsWith("/api/auth"));

  //  Allow login page if not logged in
  if (!tokenCookie) {
    if (isLoggedInRoute) {
      return NextResponse.redirect(new URL("/account/login", request.url));
    }
    return NextResponse.next();
  }

  // Validate token using shared helper
  const user = getUserFromEncryptedToken(tokenCookie.value);
  if (!user || !user.userId) {
    return NextResponse.redirect(new URL("/account/login", request.url));
  }

  // If logged in, prevent going back to login
  if (isNotLoggedInRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/account/:path*",
  ],
};