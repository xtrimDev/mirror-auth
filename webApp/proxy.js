import { getUserFromEncryptedToken } from "@auth";
import { NextResponse } from "next/server";

export async function proxy(request) {
  const tokenCookie = request.cookies.get("authToken");
  const { pathname, searchParams } = request.nextUrl;

  const isLoggedInRoute = pathname.startsWith("/dashboard");
  const isNotLoggedInRoute = (pathname.startsWith("/account/") || pathname.startsWith("/api/auth"));
  
  // Check if this is a login or signup page with appId
  const isAccountPageWithAppId = (
    (pathname === "/account/login" || pathname === "/account/signup") && 
    searchParams.has("appId") && searchParams.has("redirectURI")
  );

  // Allow access to account pages with appId even when logged in
  if (isAccountPageWithAppId) {
    return NextResponse.next();
  }

  // Allow login page if not logged in
  if (!tokenCookie) {
    if (isLoggedInRoute) {
      return NextResponse.redirect(new URL("/account/login", request.url));
    }
    return NextResponse.next();
  }

  const user = getUserFromEncryptedToken(tokenCookie.value);
  if (!user || !user.userId) {
    return NextResponse.redirect(new URL("/account/login", request.url));
  }

  // If logged in, prevent going back to login (except for appId cases which we already handled)
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