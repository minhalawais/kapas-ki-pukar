import { type NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  if (["/login", "/privacy", "/support"].includes(request.nextUrl.pathname)) {
    return NextResponse.next();
  }
  if (!request.cookies.has("kapas_staff_session")) {
    const login = new URL("/login", request.url);
    login.searchParams.set("returnTo", request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  // Authentication must never intercept public brand assets. Otherwise logo
  // requests are redirected to /login and the browser renders no image.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|woff|woff2|ttf)$).*)",
  ],
};
