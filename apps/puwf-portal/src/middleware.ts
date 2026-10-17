import { type NextRequest, NextResponse } from "next/server";

export function middleware(_request: NextRequest) {
  if (process.env.APP_MODE === "production" || process.env.ENABLE_DEMO_CONTROLS !== "true") {
    return new NextResponse(null, { status: 404 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/demo/:path*"],
};
