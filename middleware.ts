import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Check if maintenance mode is enabled
  const maintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true";

  if (maintenanceMode) {
    const { pathname } = request.nextUrl;

    // Allow access to essential routes
    const allowedPaths = [
      "/",
      "/favicon.ico",
      "/globals.css",
      "/_next",
      "/api/auth", // Keep auth working in case you need to test
    ];

    // Check if the path is allowed or is a static asset
    const isAllowed =
      allowedPaths.some((path) => pathname.startsWith(path)) ||
      pathname.includes(".");

    if (!isAllowed) {
      // Redirect to homepage (which shows maintenance page)
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
